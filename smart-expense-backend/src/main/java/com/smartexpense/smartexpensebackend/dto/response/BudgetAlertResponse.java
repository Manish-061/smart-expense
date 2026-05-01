package com.smartexpense.smartexpensebackend.dto.response;

import com.smartexpense.smartexpensebackend.model.AlertType;
import com.smartexpense.smartexpensebackend.model.Category;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetAlertResponse {

    private Long id;
    private Long budgetId;
    private Category category;
    private AlertType alertType;
    private String message;
    private BigDecimal percentageUsed;
    private boolean read;
    private LocalDateTime createdAt;
}
