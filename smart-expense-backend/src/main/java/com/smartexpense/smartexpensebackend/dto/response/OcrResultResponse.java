package com.smartexpense.smartexpensebackend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OcrResultResponse {

    private String receiptUrl;       // Permanent S3 URL (for storage in DB)
    private String receiptImageUrl;  // Temporary pre-signed URL (for browser rendering)

    // Extracted fields
    private BigDecimal amount;
    private String merchantName;
    private String date;

    // Confidence scores (0.0 to 1.0)
    private double amountConfidence;
    private double merchantConfidence;
    private double dateConfidence;

    // Raw OCR output (for debugging / Phase 3 storage)
    private String rawText;
}
