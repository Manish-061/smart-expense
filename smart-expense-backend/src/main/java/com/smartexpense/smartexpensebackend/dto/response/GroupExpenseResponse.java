package com.smartexpense.smartexpensebackend.dto.response;

import com.smartexpense.smartexpensebackend.model.Category;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupExpenseResponse {

    private Long id;
    private Long groupId;
    private BigDecimal amount;
    private String description;
    private Category category;
    private LocalDate date;
    private Long paidByUserId;
    private String paidByName;
    private List<ExpenseSplitResponse> splits;
    private LocalDateTime createdAt;
}
