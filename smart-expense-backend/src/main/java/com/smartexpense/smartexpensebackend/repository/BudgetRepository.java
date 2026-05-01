package com.smartexpense.smartexpensebackend.repository;

import com.smartexpense.smartexpensebackend.model.Budget;
import com.smartexpense.smartexpensebackend.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {

    List<Budget> findByUserIdAndYearAndMonthOrderByCategoryAsc(Long userId, int year, int month);

    Optional<Budget> findByUserIdAndCategoryAndYearAndMonth(Long userId, Category category, int year, int month);

    List<Budget> findByYearAndMonth(int year, int month);

    boolean existsByUserIdAndCategoryAndYearAndMonth(Long userId, Category category, int year, int month);
}
