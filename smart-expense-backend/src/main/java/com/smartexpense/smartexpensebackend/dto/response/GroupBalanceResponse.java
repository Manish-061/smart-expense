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
public class GroupBalanceResponse {

    private Long userId;
    private String fullName;
    private String email;
    private BigDecimal pendingOwedAmount;
}
