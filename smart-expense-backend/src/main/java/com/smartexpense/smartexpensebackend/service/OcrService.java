package com.smartexpense.smartexpensebackend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * OCR service using Tess4J (Tesseract Java wrapper) via Spring dependency injection.
 *
 * The Tesseract instance is a singleton bean injected from TesseractConfig.
 * Access is synchronized because Tess4J's Tesseract class is NOT thread-safe.
 * This approach avoids:
 *   - The JNA "Invalid memory access" crash from creating/destroying instances.
 *   - The requirement to have Tesseract CLI installed on the host system.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class OcrService {

    private final Tesseract tesseract;

    // ========================
    // Regex patterns for extraction
    // ========================

    // Match amounts like $12.50, 12.50, ₹450.00, Rs. 320
    private static final Pattern AMOUNT_PATTERN = Pattern.compile(
            "(?:[$₹€£]|Rs\\.?\\s?)(\\d{1,7}[,.]\\d{2})\\b");

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
     * Uses the injected singleton Tesseract instance with synchronized access.
     *
     * Uses doOCR(File) instead of doOCR(BufferedImage) to avoid the JNA
     * "Invalid memory access" crash caused by BufferedImage-to-Pix conversion
     * on Windows.
     */
    public Map<String, Object> processReceipt(MultipartFile file) throws IOException {
        // Preserve original extension — Leptonica uses it for format detection
        String originalFilename = file.getOriginalFilename();
        String extension = ".png";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        File tempFile = File.createTempFile("receipt-", extension);
        try {
            file.transferTo(tempFile);

            String rawText;
            try {
                // Synchronized access — Tess4J is not thread-safe
                synchronized (tesseract) {
                    rawText = tesseract.doOCR(tempFile).trim();
                }
            } catch (TesseractException e) {
                log.error("Tess4J OCR failed: {}", e.getMessage(), e);
                throw new IOException("OCR processing failed: " + e.getMessage(), e);
            }

            log.info("OCR raw text: {}", rawText);

            Map<String, Object> result = new HashMap<>();
            result.put("rawText", rawText);

            // Extract structured fields
            extractAmount(rawText, result);
            extractDate(rawText, result);
            extractMerchant(rawText, result);

            return result;
        } finally {
            // Always clean up the temp file
            if (tempFile.exists()) {
                tempFile.delete();
            }
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
