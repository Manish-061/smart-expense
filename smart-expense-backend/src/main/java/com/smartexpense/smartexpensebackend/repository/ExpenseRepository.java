package com.smartexpense.smartexpensebackend.repository;

import com.smartexpense.smartexpensebackend.model.Category;
import com.smartexpense.smartexpensebackend.model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    // ========================
    // Basic queries
    // ========================

    List<Expense> findByUserIdOrderByDateDesc(Long userId);

    // ========================
    // Filtered queries
    // ========================

    List<Expense> findByUserIdAndCategoryOrderByDateDesc(Long userId, Category category);

    List<Expense> findByUserIdAndDateBetweenOrderByDateDesc(Long userId, LocalDate startDate, LocalDate endDate);

    List<Expense> findByUserIdAndCategoryAndDateBetweenOrderByDateDesc(
            Long userId, Category category, LocalDate startDate, LocalDate endDate);

    // ========================
    // Aggregation queries
    // ========================

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e " +
           "WHERE e.user.id = :userId " +
           "AND YEAR(e.date) = :year " +
           "AND MONTH(e.date) = :month")
    BigDecimal getTotalSpendByMonth(@Param("userId") Long userId,
                                   @Param("year") int year,
                                   @Param("month") int month);

    @Query("SELECT e.category, COALESCE(SUM(e.amount), 0) FROM Expense e " +
           "WHERE e.user.id = :userId " +
           "AND YEAR(e.date) = :year " +
           "AND MONTH(e.date) = :month " +
           "GROUP BY e.category " +
           "ORDER BY SUM(e.amount) DESC")
    List<Object[]> getCategoryWiseSummary(@Param("userId") Long userId,
                                         @Param("year") int year,
                                         @Param("month") int month);
}
