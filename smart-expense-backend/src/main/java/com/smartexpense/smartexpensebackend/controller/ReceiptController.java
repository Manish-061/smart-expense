package com.smartexpense.smartexpensebackend.controller;

import com.smartexpense.smartexpensebackend.dto.request.ReceiptExpenseRequest;
import com.smartexpense.smartexpensebackend.dto.response.ExpenseResponse;
import com.smartexpense.smartexpensebackend.dto.response.OcrResultResponse;
import com.smartexpense.smartexpensebackend.model.Category;
import com.smartexpense.smartexpensebackend.model.User;
import com.smartexpense.smartexpensebackend.service.CategorizationService;
import com.smartexpense.smartexpensebackend.service.ExpenseService;
import com.smartexpense.smartexpensebackend.service.OcrService;
import com.smartexpense.smartexpensebackend.service.S3StorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
@Slf4j
public class ReceiptController {

    private final S3StorageService s3StorageService;
    private final OcrService ocrService;
    private final ExpenseService expenseService;
    private final CategorizationService categorizationService;

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/tiff"
    );

    /**
     * Upload a receipt image, store it in S3, and return OCR-extracted data.
     * The extracted data is NOT auto-saved — user must review and confirm (Phase 3).
     *
     * POST /api/expenses/receipt
     */
    @PostMapping(value = "/receipt", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadReceipt(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "File is empty. Please upload a valid receipt image.")
            );
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "Invalid file type. Allowed: JPEG, PNG, WebP, TIFF.")
            );
        }

        try {
            String receiptUrl = s3StorageService.uploadFile(file);
            Map<String, Object> ocrResult = ocrService.processReceipt(file);

            // Generate a temporary pre-signed URL for frontend image rendering (1 hour)
            String receiptImageUrl = s3StorageService.generatePresignedUrl(receiptUrl, Duration.ofHours(1));

            // Phase 4: Suggest a category based on merchant name and raw OCR text
            String merchantName = (String) ocrResult.get("merchantName");
            String rawText = (String) ocrResult.get("rawText");
            Category suggestedCategory = categorizationService.suggestCategory(merchantName, rawText);

            OcrResultResponse response = OcrResultResponse.builder()
                    .receiptUrl(receiptUrl)
                    .receiptImageUrl(receiptImageUrl)
                    .amount(ocrResult.get("amount") != null ? (BigDecimal) ocrResult.get("amount") : null)
                    .merchantName(merchantName)
                    .date((String) ocrResult.get("date"))
                    .suggestedCategory(suggestedCategory)
                    .amountConfidence((double) ocrResult.get("amountConfidence"))
                    .merchantConfidence((double) ocrResult.get("merchantConfidence"))
                    .dateConfidence((double) ocrResult.get("dateConfidence"))
                    .rawText(rawText)
                    .build();

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Receipt processing failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    Map.of("message", "Failed to process receipt: " + e.getMessage())
            );
        }
    }

    /**
     * Create an expense from user-reviewed OCR data (Phase 3).
     * The user has already reviewed and potentially edited the extracted fields.
     *
     * POST /api/expenses/from-receipt
     */
    @PostMapping("/from-receipt")
    public ResponseEntity<ExpenseResponse> createExpenseFromReceipt(
            @Valid @RequestBody ReceiptExpenseRequest request,
            @AuthenticationPrincipal User user) {

        ExpenseResponse response = expenseService.createExpenseFromReceipt(request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
