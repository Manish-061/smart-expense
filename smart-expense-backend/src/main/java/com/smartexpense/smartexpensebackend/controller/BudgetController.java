package com.smartexpense.smartexpensebackend.controller;

import com.smartexpense.smartexpensebackend.dto.request.BudgetRequest;
import com.smartexpense.smartexpensebackend.dto.response.BudgetAlertResponse;
import com.smartexpense.smartexpensebackend.dto.response.BudgetResponse;
import com.smartexpense.smartexpensebackend.model.User;
import com.smartexpense.smartexpensebackend.service.BudgetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;

    // ========================
    // Budget CRUD
    // ========================

    /**
     * Create or update a monthly category budget.
     * POST /api/budgets
     */
    @PostMapping
    public ResponseEntity<BudgetResponse> createOrUpdateBudget(
            @Valid @RequestBody BudgetRequest request,
            @AuthenticationPrincipal User user) {
        BudgetResponse response = budgetService.createOrUpdateBudget(request, user);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Get all budgets for a given month with spending progress.
     * GET /api/budgets?year=2026&month=5
     */
    @GetMapping
    public ResponseEntity<List<BudgetResponse>> getBudgets(
            @AuthenticationPrincipal User user,
            @RequestParam int year,
            @RequestParam int month) {
        List<BudgetResponse> budgets = budgetService.getBudgets(user, year, month);
        return ResponseEntity.ok(budgets);
    }

    /**
     * Delete a budget.
     * DELETE /api/budgets/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBudget(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        budgetService.deleteBudget(id, user);
        return ResponseEntity.noContent().build();
    }

    // ========================
    // Alerts
    // ========================

    /**
     * Get all budget alerts for the user.
     * GET /api/budgets/alerts
     */
    @GetMapping("/alerts")
    public ResponseEntity<List<BudgetAlertResponse>> getAlerts(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(budgetService.getAlerts(user));
    }

    /**
     * Get only unread alerts.
     * GET /api/budgets/alerts/unread
     */
    @GetMapping("/alerts/unread")
    public ResponseEntity<List<BudgetAlertResponse>> getUnreadAlerts(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(budgetService.getUnreadAlerts(user));
    }

    /**
     * Get unread alert count.
     * GET /api/budgets/alerts/count
     */
    @GetMapping("/alerts/count")
    public ResponseEntity<Map<String, Long>> getUnreadAlertCount(
            @AuthenticationPrincipal User user) {
        long count = budgetService.getUnreadAlertCount(user);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    /**
     * Mark a single alert as read.
     * PATCH /api/budgets/alerts/{id}/read
     */
    @PatchMapping("/alerts/{id}/read")
    public ResponseEntity<BudgetAlertResponse> markAlertAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(budgetService.markAlertAsRead(id, user));
    }

    /**
     * Mark all alerts as read.
     * PATCH /api/budgets/alerts/read-all
     */
    @PatchMapping("/alerts/read-all")
    public ResponseEntity<Void> markAllAlertsAsRead(
            @AuthenticationPrincipal User user) {
        budgetService.markAllAlertsAsRead(user);
        return ResponseEntity.noContent().build();
    }
}
