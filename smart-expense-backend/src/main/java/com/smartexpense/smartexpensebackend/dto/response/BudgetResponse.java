package com.smartexpense.smartexpensebackend.dto.response;

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
public class BudgetResponse {

    private Long id;
    private Category category;
    private int year;
    private int month;
    private BigDecimal budgetAmount;
    private BigDecimal spentAmount;
    private BigDecimal remainingAmount;
    private double percentageUsed;
    private String status;          // UNDER_BUDGET, WARNING, EXCEEDED
    private LocalDateTime createdAt;
}
