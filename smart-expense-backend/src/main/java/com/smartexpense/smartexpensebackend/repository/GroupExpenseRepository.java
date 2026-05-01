package com.smartexpense.smartexpensebackend.repository;

import com.smartexpense.smartexpensebackend.model.GroupExpense;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupExpenseRepository extends JpaRepository<GroupExpense, Long> {

    @EntityGraph(attributePaths = {"paidBy", "splits", "splits.user"})
    @Query("SELECT DISTINCT ge FROM GroupExpense ge " +
           "WHERE ge.group.id = :groupId " +
           "ORDER BY ge.date DESC, ge.createdAt DESC")
    List<GroupExpense> findByGroupIdOrderByDateDescCreatedAtDesc(@Param("groupId") Long groupId);
}
