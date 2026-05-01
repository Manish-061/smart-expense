package com.smartexpense.smartexpensebackend.dto.response;

import com.smartexpense.smartexpensebackend.model.SplitStatus;
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
public class ExpenseSplitResponse {

    private Long id;
    private Long userId;
    private String fullName;
    private String email;
    private BigDecimal owedAmount;
    private SplitStatus status;
    private LocalDateTime settledAt;
}
