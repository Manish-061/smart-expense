package com.smartexpense.smartexpensebackend.dto.request;

import com.smartexpense.smartexpensebackend.model.Category;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Request DTO for creating an expense from user-reviewed OCR data.
 * The user may have edited any of these fields before submitting.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReceiptExpenseRequest {

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;

    @NotBlank(message = "Description is required")
    @Size(max = 255, message = "Description must be at most 255 characters")
    private String description;

    @NotNull(message = "Category is required")
    private Category category;

    @NotNull(message = "Date is required")
    private LocalDate date;

    // S3 URL of the uploaded receipt image
    @NotBlank(message = "Receipt URL is required")
    private String receiptUrl;

    // Raw OCR text (stored for audit/debugging)
    private String rawOcrData;
}
