package com.smartexpense.smartexpensebackend.repository;

import com.smartexpense.smartexpensebackend.model.ExpenseSplit;
import com.smartexpense.smartexpensebackend.model.SplitStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExpenseSplitRepository extends JpaRepository<ExpenseSplit, Long> {

    Optional<ExpenseSplit> findByIdAndGroupExpenseGroupId(Long id, Long groupId);

    List<ExpenseSplit> findByGroupExpenseGroupIdAndStatus(Long groupId, SplitStatus status);

    List<ExpenseSplit> findByGroupExpenseGroupIdAndUserIdAndStatus(Long groupId, Long userId, SplitStatus status);

    boolean existsByGroupExpenseGroupIdAndUserIdAndStatus(Long groupId, Long userId, SplitStatus status);
}
