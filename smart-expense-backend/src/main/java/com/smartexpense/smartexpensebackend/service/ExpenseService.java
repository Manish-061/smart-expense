package com.smartexpense.smartexpensebackend.service;

import com.smartexpense.smartexpensebackend.dto.request.ExpenseRequest;
import com.smartexpense.smartexpensebackend.dto.response.ExpenseResponse;
import com.smartexpense.smartexpensebackend.dto.response.ExpenseSummaryResponse;
import com.smartexpense.smartexpensebackend.model.Category;
import com.smartexpense.smartexpensebackend.model.Expense;
import com.smartexpense.smartexpensebackend.model.User;
import com.smartexpense.smartexpensebackend.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;

    /**
     * Create a new expense for the authenticated user.
     */
    public ExpenseResponse createExpense(ExpenseRequest request, User user) {
        Expense expense = Expense.builder()
                .amount(request.getAmount())
                .description(request.getDescription())
                .category(request.getCategory())
                .date(request.getDate())
                .user(user)
                .build();

        Expense saved = expenseRepository.save(expense);
        return mapToResponse(saved);
    }

    /**
     * Get expenses for the authenticated user with optional filters.
     *
     * @param user      the authenticated user
     * @param category  optional category filter
     * @param startDate optional start date (inclusive)
     * @param endDate   optional end date (inclusive)
     * @return filtered list of expenses, ordered by date descending
     */
    public List<ExpenseResponse> getExpenses(User user, Category category,
                                              LocalDate startDate, LocalDate endDate) {
        List<Expense> expenses;

        boolean hasCategory = category != null;
        boolean hasDateRange = startDate != null && endDate != null;

        if (hasCategory && hasDateRange) {
            expenses = expenseRepository.findByUserIdAndCategoryAndDateBetweenOrderByDateDesc(
                    user.getId(), category, startDate, endDate);
        } else if (hasCategory) {
            expenses = expenseRepository.findByUserIdAndCategoryOrderByDateDesc(
                    user.getId(), category);
        } else if (hasDateRange) {
            expenses = expenseRepository.findByUserIdAndDateBetweenOrderByDateDesc(
                    user.getId(), startDate, endDate);
        } else {
            expenses = expenseRepository.findByUserIdOrderByDateDesc(user.getId());
        }

        return expenses.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get monthly expense summary with category-wise breakdown.
     *
     * @param user  the authenticated user
     * @param year  the year (e.g., 2026)
     * @param month the month (1-12)
     * @return summary with total spend and per-category breakdown
     */
    public ExpenseSummaryResponse getExpenseSummary(User user, int year, int month) {
        BigDecimal totalSpend = expenseRepository.getTotalSpendByMonth(user.getId(), year, month);

        List<Object[]> categoryResults = expenseRepository.getCategoryWiseSummary(
                user.getId(), year, month);

        // Build ordered map (highest spend first, preserved from query ORDER BY)
        Map<String, BigDecimal> categoryBreakdown = new LinkedHashMap<>();
        for (Object[] row : categoryResults) {
            Category cat = (Category) row[0];
            BigDecimal amount = (BigDecimal) row[1];
            categoryBreakdown.put(cat.name(), amount);
        }

        return ExpenseSummaryResponse.builder()
                .year(year)
                .month(month)
                .totalSpend(totalSpend)
                .categoryBreakdown(categoryBreakdown)
                .build();
    }

    // ========================
    // Private helpers
    // ========================

    private ExpenseResponse mapToResponse(Expense expense) {
        return ExpenseResponse.builder()
                .id(expense.getId())
                .amount(expense.getAmount())
                .description(expense.getDescription())
                .category(expense.getCategory())
                .date(expense.getDate())
                .createdAt(expense.getCreatedAt())
                .build();
    }
}
