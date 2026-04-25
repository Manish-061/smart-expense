package com.smartexpense.smartexpensebackend.repository;

import com.smartexpense.smartexpensebackend.model.CategoryRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRuleRepository extends JpaRepository<CategoryRule, Long> {

    /**
     * Fetch all rules, ordered by priority descending so the highest-priority
     * matching rule wins during categorization.
     */
    List<CategoryRule> findAllByOrderByPriorityDesc();
}
