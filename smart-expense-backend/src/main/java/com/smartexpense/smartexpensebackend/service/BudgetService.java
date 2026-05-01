package com.smartexpense.smartexpensebackend.service;

import com.smartexpense.smartexpensebackend.dto.request.BudgetRequest;
import com.smartexpense.smartexpensebackend.dto.response.BudgetAlertResponse;
import com.smartexpense.smartexpensebackend.dto.response.BudgetResponse;
import com.smartexpense.smartexpensebackend.exception.DuplicateResourceException;
import com.smartexpense.smartexpensebackend.exception.ResourceNotFoundException;
import com.smartexpense.smartexpensebackend.model.*;
import com.smartexpense.smartexpensebackend.repository.BudgetAlertRepository;
import com.smartexpense.smartexpensebackend.repository.BudgetRepository;
import com.smartexpense.smartexpensebackend.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final BudgetAlertRepository budgetAlertRepository;
    private final ExpenseRepository expenseRepository;

    // ========================
    // Budget CRUD
    // ========================

    /**
     * Create or update a budget for a category/month.
     * If a budget already exists for the same user+category+year+month, update the amount.
     */
    @Transactional
    public BudgetResponse createOrUpdateBudget(BudgetRequest request, User user) {
        Budget budget = budgetRepository.findByUserIdAndCategoryAndYearAndMonth(
                user.getId(), request.getCategory(), request.getYear(), request.getMonth()
        ).orElse(null);

        if (budget != null) {
            // Update existing budget
            budget.setAmount(request.getAmount().setScale(2, RoundingMode.HALF_UP));
        } else {
            // Create new budget
            budget = Budget.builder()
                    .user(user)
                    .category(request.getCategory())
                    .year(request.getYear())
                    .month(request.getMonth())
                    .amount(request.getAmount().setScale(2, RoundingMode.HALF_UP))
                    .build();
        }

        Budget saved = budgetRepository.save(budget);
        return mapToResponse(saved, user.getId());
    }

    /**
     * Get all budgets for a user in a given month, enriched with spending data.
     */
    public List<BudgetResponse> getBudgets(User user, int year, int month) {
        List<Budget> budgets = budgetRepository.findByUserIdAndYearAndMonthOrderByCategoryAsc(
                user.getId(), year, month);

        return budgets.stream()
                .map(b -> mapToResponse(b, user.getId()))
                .collect(Collectors.toList());
    }

    /**
     * Delete a budget by ID. Only the owner can delete.
     */
    @Transactional
    public void deleteBudget(Long budgetId, User user) {
        Budget budget = budgetRepository.findById(budgetId)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found with id: " + budgetId));

        if (!budget.getUser().getId().equals(user.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("You can only delete your own budgets");
        }

        budgetRepository.delete(budget);
    }

    // ========================
    // Alerts
    // ========================

    /**
     * Get all alerts for the authenticated user.
     */
    public List<BudgetAlertResponse> getAlerts(User user) {
        return budgetAlertRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::mapAlertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get only unread alerts for the authenticated user.
     */
    public List<BudgetAlertResponse> getUnreadAlerts(User user) {
        return budgetAlertRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::mapAlertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get unread alert count.
     */
    public long getUnreadAlertCount(User user) {
        return budgetAlertRepository.countByUserIdAndReadFalse(user.getId());
    }

    /**
     * Mark a single alert as read.
     */
    @Transactional
    public BudgetAlertResponse markAlertAsRead(Long alertId, User user) {
        BudgetAlert alert = budgetAlertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found with id: " + alertId));

        if (!alert.getUser().getId().equals(user.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("You can only manage your own alerts");
        }

        alert.setRead(true);
        BudgetAlert saved = budgetAlertRepository.save(alert);
        return mapAlertToResponse(saved);
    }

    /**
     * Mark all alerts as read for the user.
     */
    @Transactional
    public void markAllAlertsAsRead(User user) {
        List<BudgetAlert> unread = budgetAlertRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(user.getId());
        for (BudgetAlert alert : unread) {
            alert.setRead(true);
        }
        budgetAlertRepository.saveAll(unread);
    }

    // ========================
    // Alert Generation (called by scheduler)
    // ========================

    /**
     * Check all budgets for a given month and generate alerts.
     * Called by the BudgetAlertScheduler.
     */
    @Transactional
    public void checkAndGenerateAlerts(int year, int month) {
        List<Budget> allBudgets = budgetRepository.findByYearAndMonth(year, month);
        log.info("Checking {} budgets for {}/{}", allBudgets.size(), year, month);

        for (Budget budget : allBudgets) {
            BigDecimal spent = getSpentAmount(budget.getUser().getId(), budget.getCategory(), year, month);
            BigDecimal budgetAmount = budget.getAmount();

            if (budgetAmount.compareTo(BigDecimal.ZERO) <= 0) continue;

            double percentage = spent.divide(budgetAmount, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();

            // Check 100% exceeded first
            if (percentage >= 100.0) {
                createAlertIfNotExists(budget, AlertType.EXCEEDED, percentage);
            }
            // Check 80% warning
            if (percentage >= 80.0 && percentage < 100.0) {
                createAlertIfNotExists(budget, AlertType.WARNING, percentage);
            }
        }
    }

    // ========================
    // Private helpers
    // ========================

    private void createAlertIfNotExists(Budget budget, AlertType type, double percentage) {
        if (budgetAlertRepository.existsByBudgetIdAndAlertType(budget.getId(), type)) {
            return; // Alert already exists, skip
        }

        String categoryLabel = budget.getCategory().name().charAt(0)
                + budget.getCategory().name().substring(1).toLowerCase();

        String message;
        if (type == AlertType.EXCEEDED) {
            message = String.format("You've exceeded your %s budget for %s! %.0f%% used.",
                    categoryLabel, getMonthLabel(budget.getMonth()), percentage);
        } else {
            message = String.format("You've used %.0f%% of your %s budget for %s.",
                    percentage, categoryLabel, getMonthLabel(budget.getMonth()));
        }

        BudgetAlert alert = BudgetAlert.builder()
                .budget(budget)
                .user(budget.getUser())
                .alertType(type)
                .message(message)
                .percentageUsed(BigDecimal.valueOf(percentage).setScale(2, RoundingMode.HALF_UP))
                .read(false)
                .build();

        budgetAlertRepository.save(alert);
        log.info("Created {} alert for user {} category {} ({}%)",
                type, budget.getUser().getId(), budget.getCategory(), String.format("%.1f", percentage));
    }

    private BigDecimal getSpentAmount(Long userId, Category category, int year, int month) {
        // Reuse the existing category-wise summary query and find the matching category
        List<Object[]> results = expenseRepository.getCategoryWiseSummary(userId, year, month);
        for (Object[] row : results) {
            Category cat = (Category) row[0];
            if (cat == category) {
                return (BigDecimal) row[1];
            }
        }
        return BigDecimal.ZERO;
    }

    private BudgetResponse mapToResponse(Budget budget, Long userId) {
        BigDecimal spent = getSpentAmount(userId, budget.getCategory(), budget.getYear(), budget.getMonth());
        BigDecimal remaining = budget.getAmount().subtract(spent);
        double percentage = budget.getAmount().compareTo(BigDecimal.ZERO) > 0
                ? spent.divide(budget.getAmount(), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)).doubleValue()
                : 0.0;

        String status;
        if (percentage >= 100.0) {
            status = "EXCEEDED";
        } else if (percentage >= 80.0) {
            status = "WARNING";
        } else {
            status = "UNDER_BUDGET";
        }

        return BudgetResponse.builder()
                .id(budget.getId())
                .category(budget.getCategory())
                .year(budget.getYear())
                .month(budget.getMonth())
                .budgetAmount(budget.getAmount())
                .spentAmount(spent)
                .remainingAmount(remaining)
                .percentageUsed(Math.round(percentage * 100.0) / 100.0) // 2 decimal places
                .status(status)
                .createdAt(budget.getCreatedAt())
                .build();
    }

    private BudgetAlertResponse mapAlertToResponse(BudgetAlert alert) {
        return BudgetAlertResponse.builder()
                .id(alert.getId())
                .budgetId(alert.getBudget().getId())
                .category(alert.getBudget().getCategory())
                .alertType(alert.getAlertType())
                .message(alert.getMessage())
                .percentageUsed(alert.getPercentageUsed())
                .read(alert.isRead())
                .createdAt(alert.getCreatedAt())
                .build();
    }

    private String getMonthLabel(int month) {
        String[] months = {"January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"};
        return months[month - 1];
    }
}
