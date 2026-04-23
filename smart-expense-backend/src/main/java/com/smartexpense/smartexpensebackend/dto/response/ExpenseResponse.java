package com.smartexpense.smartexpensebackend.dto.response;

import com.smartexpense.smartexpensebackend.model.Category;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseResponse {

    private Long id;
    private BigDecimal amount;
    private String description;
    private Category category;
    private LocalDate date;
    private LocalDateTime createdAt;
}
