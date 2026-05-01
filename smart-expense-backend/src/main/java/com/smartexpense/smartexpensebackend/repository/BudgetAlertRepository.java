package com.smartexpense.smartexpensebackend.repository;

import com.smartexpense.smartexpensebackend.model.AlertType;
import com.smartexpense.smartexpensebackend.model.BudgetAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BudgetAlertRepository extends JpaRepository<BudgetAlert, Long> {

    List<BudgetAlert> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<BudgetAlert> findByUserIdAndReadFalseOrderByCreatedAtDesc(Long userId);

    boolean existsByBudgetIdAndAlertType(Long budgetId, AlertType alertType);

    long countByUserIdAndReadFalse(Long userId);
}
