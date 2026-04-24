package com.smartexpense.smartexpensebackend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * OCR service that calls the Tesseract CLI directly via ProcessBuilder.
 * This avoids all JNA/native-library crashes (Invalid memory access)
 * that plague Tess4J on Windows.
 *
 * Requires Tesseract OCR installed on the system.
 * Install on Windows: winget install -e --id UB-Mannheim.TesseractOCR
 */
@Service
@Slf4j
public class OcrService {

    @Value("${ocr.tesseract-cmd:tesseract}")
    private String tesseractCmd;

    // ========================
    // Regex patterns for extraction
    // ========================

    // Match amounts like $12.50, 12.50, ₹450.00, Rs. 320
    private static final Pattern AMOUNT_PATTERN = Pattern.compile(
            "(?:[$₹€£]|Rs\\.?\\s?)?(\\d{1,7}[,.]\\d{2})\\b");

    // Match common date formats
    private static final DateTimeFormatter[] DATE_FORMATTERS = {
            DateTimeFormatter.ofPattern("MM/dd/yyyy"),
            DateTimeFormatter.ofPattern("dd/MM/yyyy"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd"),
            DateTimeFormatter.ofPattern("dd-MM-yyyy"),
            DateTimeFormatter.ofPattern("MM-dd-yyyy"),
            DateTimeFormatter.ofPattern("dd.MM.yyyy"),
    };

    private static final Pattern DATE_PATTERN = Pattern.compile(
            "(\\d{1,4}[/\\-.]\\d{1,2}[/\\-.]\\d{2,4})");

    /**
     * Perform OCR on an uploaded image file and extract structured data.
     * Uses the system-installed Tesseract CLI to avoid JNA crashes.
     */
    public Map<String, Object> processReceipt(MultipartFile file) throws IOException {
        // Preserve original extension — Tesseract uses it for image format detection
        String originalFilename = file.getOriginalFilename();
        String extension = ".png";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        File tempInput = File.createTempFile("receipt-", extension);
        File tempOutput = File.createTempFile("ocr-output-", ""); // Tesseract appends .txt

        try {
            file.transferTo(tempInput);

            // Call Tesseract CLI: tesseract input.png output-base
            ProcessBuilder pb = new ProcessBuilder(
                    tesseractCmd,
                    tempInput.getAbsolutePath(),
                    tempOutput.getAbsolutePath(), // Tesseract auto-appends .txt
                    "-l", "eng",
                    "--psm", "3"  // Fully automatic page segmentation
            );
            pb.redirectErrorStream(true);

            Process process = pb.start();

            // Capture stdout/stderr for debugging
            String processOutput;
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line).append("\n");
                }
                processOutput = sb.toString();
            }

            boolean finished = process.waitFor(30, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                throw new IOException("Tesseract OCR timed out after 30 seconds.");
            }

            int exitCode = process.exitValue();
            if (exitCode != 0) {
                log.error("Tesseract exited with code {}: {}", exitCode, processOutput);
                throw new IOException("Tesseract OCR failed (exit code " + exitCode + "): " + processOutput.trim());
            }

            // Read the output .txt file
            File outputTxt = new File(tempOutput.getAbsolutePath() + ".txt");
            if (!outputTxt.exists()) {
                throw new IOException("Tesseract did not produce output. Check that Tesseract is installed and on PATH.");
            }

            String rawText;
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(new FileInputStream(outputTxt), StandardCharsets.UTF_8))) {
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line).append("\n");
                }
                rawText = sb.toString().trim();
            }

            log.info("OCR raw text: {}", rawText);

            Map<String, Object> result = new HashMap<>();
            result.put("rawText", rawText);

            // Extract structured fields
            extractAmount(rawText, result);
            extractDate(rawText, result);
            extractMerchant(rawText, result);

            return result;

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("OCR processing was interrupted.", e);
        } finally {
            // Clean up all temp files
            tempInput.delete();
            tempOutput.delete();
            new File(tempOutput.getAbsolutePath() + ".txt").delete();
        }
    }

    // ========================
    // Private extraction helpers
    // ========================

    private void extractAmount(String text, Map<String, Object> result) {
        Matcher matcher = AMOUNT_PATTERN.matcher(text);
        BigDecimal largestAmount = null;

        // Find all amounts, take the largest one (likely the total)
        while (matcher.find()) {
            try {
                String amountStr = matcher.group(1).replace(",", ".");
                BigDecimal amount = new BigDecimal(amountStr);
                if (largestAmount == null || amount.compareTo(largestAmount) > 0) {
                    largestAmount = amount;
                }
            } catch (NumberFormatException ignored) {
                // Skip invalid numbers
            }
        }

        if (largestAmount != null) {
            result.put("amount", largestAmount);
            result.put("amountConfidence", 0.7);
        } else {
            result.put("amount", null);
            result.put("amountConfidence", 0.0);
        }
    }

    private void extractDate(String text, Map<String, Object> result) {
        Matcher matcher = DATE_PATTERN.matcher(text);

        while (matcher.find()) {
            String dateStr = matcher.group(1);
            for (DateTimeFormatter formatter : DATE_FORMATTERS) {
                try {
                    LocalDate date = LocalDate.parse(dateStr, formatter);
                    // Sanity check: date should be within the last 2 years
                    if (date.isAfter(LocalDate.now().minusYears(2)) && !date.isAfter(LocalDate.now())) {
                        result.put("date", date.toString());
                        result.put("dateConfidence", 0.8);
                        return;
                    }
                } catch (DateTimeParseException ignored) {
                    // Try next formatter
                }
            }
        }

        result.put("date", null);
        result.put("dateConfidence", 0.0);
    }

    private void extractMerchant(String text, Map<String, Object> result) {
        String[] lines = text.split("\\n");
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.length() >= 3
                    && !trimmed.matches("^[\\d\\s.,$₹€£%\\-+*/]+$")
                    && !trimmed.equalsIgnoreCase("receipt")
                    && !trimmed.equalsIgnoreCase("invoice")
                    && !trimmed.equalsIgnoreCase("bill")) {
                result.put("merchantName", trimmed);
                result.put("merchantConfidence", 0.5);
                return;
            }
        }

        result.put("merchantName", null);
        result.put("merchantConfidence", 0.0);
    }
}
