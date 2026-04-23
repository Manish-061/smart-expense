package com.smartexpense.smartexpensebackend.controller;

import com.smartexpense.smartexpensebackend.dto.request.ExpenseRequest;
import com.smartexpense.smartexpensebackend.dto.response.ExpenseResponse;
import com.smartexpense.smartexpensebackend.dto.response.ExpenseSummaryResponse;
import com.smartexpense.smartexpensebackend.model.Category;
import com.smartexpense.smartexpensebackend.model.User;
import com.smartexpense.smartexpensebackend.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    /**
     * Create a new expense.
     * POST /api/expenses
     */
    @PostMapping
    public ResponseEntity<ExpenseResponse> createExpense(
            @Valid @RequestBody ExpenseRequest request,
            @AuthenticationPrincipal User user) {
        ExpenseResponse response = expenseService.createExpense(request, user);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Get all expenses for the authenticated user with optional filters.
     * GET /api/expenses
     * GET /api/expenses?category=FOOD
     * GET /api/expenses?startDate=2026-04-01&endDate=2026-04-30
     * GET /api/expenses?category=FOOD&startDate=2026-04-01&endDate=2026-04-30
     */
    @GetMapping
    public ResponseEntity<List<ExpenseResponse>> getExpenses(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) Category category,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        List<ExpenseResponse> expenses = expenseService.getExpenses(user, category, startDate, endDate);
        return ResponseEntity.ok(expenses);
    }

    /**
     * Get monthly expense summary with category-wise breakdown.
     * GET /api/expenses/summary?year=2026&month=4
     */
    @GetMapping("/summary")
    public ResponseEntity<ExpenseSummaryResponse> getExpenseSummary(
            @AuthenticationPrincipal User user,
            @RequestParam int year,
            @RequestParam int month) {
        ExpenseSummaryResponse summary = expenseService.getExpenseSummary(user, year, month);
        return ResponseEntity.ok(summary);
    }
}
