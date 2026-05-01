package com.smartexpense.smartexpensebackend.scheduler;

import com.smartexpense.smartexpensebackend.service.BudgetService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Phase 6: Background job that periodically checks all budgets
 * against actual spending and generates alerts.
 *
 * Runs every 6 hours by default.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class BudgetAlertScheduler {

    private final BudgetService budgetService;

    /**
     * Cron-based job: runs at minute 0 of every 6th hour (00:00, 06:00, 12:00, 18:00).
     */
    @Scheduled(cron = "0 0 */6 * * *")
    public void checkBudgetAlerts() {
        LocalDate today = LocalDate.now();
        int year = today.getYear();
        int month = today.getMonthValue();

        log.info("Running budget alert check for {}/{}", year, month);

        try {
            budgetService.checkAndGenerateAlerts(year, month);
            log.info("Budget alert check completed successfully");
        } catch (Exception e) {
            log.error("Budget alert check failed", e);
        }
    }
}
