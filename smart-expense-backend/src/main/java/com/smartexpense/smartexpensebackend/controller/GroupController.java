package com.smartexpense.smartexpensebackend.controller;

import com.smartexpense.smartexpensebackend.dto.request.AddGroupMemberRequest;
import com.smartexpense.smartexpensebackend.dto.request.CreateGroupRequest;
import com.smartexpense.smartexpensebackend.dto.response.ExpenseSplitResponse;
import com.smartexpense.smartexpensebackend.dto.response.GroupBalanceResponse;
import com.smartexpense.smartexpensebackend.dto.response.GroupExpenseResponse;
import com.smartexpense.smartexpensebackend.dto.response.GroupResponse;
import com.smartexpense.smartexpensebackend.model.User;
import com.smartexpense.smartexpensebackend.service.GroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    /**
     * Create a new expense-sharing group.
     * POST /api/groups
     */
    @PostMapping
    public ResponseEntity<GroupResponse> createGroup(
            @Valid @RequestBody CreateGroupRequest request,
            @AuthenticationPrincipal User user) {
        GroupResponse response = groupService.createGroup(request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get groups where the authenticated user is a member.
     * GET /api/groups
     */
    @GetMapping
    public ResponseEntity<List<GroupResponse>> getMyGroups(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(groupService.getMyGroups(user));
    }

    /**
     * Get one group with its members.
     * GET /api/groups/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<GroupResponse> getGroup(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(groupService.getGroup(id, user));
    }

    /**
     * Add an existing registered user to a group by email.
     * POST /api/groups/{id}/members
     */
    @PostMapping("/{id}/members")
    public ResponseEntity<GroupResponse> addMember(
            @PathVariable Long id,
            @Valid @RequestBody AddGroupMemberRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(groupService.addMember(id, request, user));
    }

    /**
     * Remove a member from a group by user ID.
     * DELETE /api/groups/{id}/members/{userId}
     */
    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<GroupResponse> removeMember(
            @PathVariable Long id,
            @PathVariable Long userId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(groupService.removeMember(id, userId, user));
    }

    /**
     * Get group expenses and their per-member split status.
     * GET /api/groups/{id}/expenses
     */
    @GetMapping("/{id}/expenses")
    public ResponseEntity<List<GroupExpenseResponse>> getGroupExpenses(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(groupService.getGroupExpenses(id, user));
    }

    /**
     * Get each member's pending owed amount in a group.
     * GET /api/groups/{id}/balances
     */
    @GetMapping("/{id}/balances")
    public ResponseEntity<List<GroupBalanceResponse>> getGroupBalances(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(groupService.getGroupBalances(id, user));
    }

    /**
     * Mark a single split as settled.
     * PATCH /api/groups/{id}/splits/{splitId}/settle
     */
    @PatchMapping("/{id}/splits/{splitId}/settle")
    public ResponseEntity<ExpenseSplitResponse> settleSplit(
            @PathVariable Long id,
            @PathVariable Long splitId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(groupService.settleSplit(id, splitId, user));
    }

    /**
     * Settle all pending splits for a specific member in a group.
     * PATCH /api/groups/{id}/members/{userId}/settle-all
     */
    @PatchMapping("/{id}/members/{userId}/settle-all")
    public ResponseEntity<List<ExpenseSplitResponse>> settleAllForMember(
            @PathVariable Long id,
            @PathVariable Long userId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(groupService.settleAllForMember(id, userId, user));
    }
}
