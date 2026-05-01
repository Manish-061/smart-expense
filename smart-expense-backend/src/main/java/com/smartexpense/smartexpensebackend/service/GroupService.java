package com.smartexpense.smartexpensebackend.service;

import com.smartexpense.smartexpensebackend.dto.request.AddGroupMemberRequest;
import com.smartexpense.smartexpensebackend.dto.request.CreateGroupRequest;
import com.smartexpense.smartexpensebackend.dto.request.GroupExpenseRequest;
import com.smartexpense.smartexpensebackend.dto.response.ExpenseSplitResponse;
import com.smartexpense.smartexpensebackend.dto.response.GroupBalanceResponse;
import com.smartexpense.smartexpensebackend.dto.response.GroupExpenseResponse;
import com.smartexpense.smartexpensebackend.dto.response.GroupMemberResponse;
import com.smartexpense.smartexpensebackend.dto.response.GroupResponse;
import com.smartexpense.smartexpensebackend.exception.DuplicateResourceException;
import com.smartexpense.smartexpensebackend.exception.ResourceNotFoundException;
import com.smartexpense.smartexpensebackend.model.ExpenseGroup;
import com.smartexpense.smartexpensebackend.model.ExpenseSplit;
import com.smartexpense.smartexpensebackend.model.GroupExpense;
import com.smartexpense.smartexpensebackend.model.GroupMember;
import com.smartexpense.smartexpensebackend.model.SplitStatus;
import com.smartexpense.smartexpensebackend.model.User;
import com.smartexpense.smartexpensebackend.repository.ExpenseGroupRepository;
import com.smartexpense.smartexpensebackend.repository.ExpenseSplitRepository;
import com.smartexpense.smartexpensebackend.repository.GroupExpenseRepository;
import com.smartexpense.smartexpensebackend.repository.GroupMemberRepository;
import com.smartexpense.smartexpensebackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final ExpenseGroupRepository expenseGroupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupExpenseRepository groupExpenseRepository;
    private final ExpenseSplitRepository expenseSplitRepository;
    private final UserRepository userRepository;

    @Transactional
    public GroupResponse createGroup(CreateGroupRequest request, User user) {
        ExpenseGroup group = ExpenseGroup.builder()
                .name(request.getName())
                .description(request.getDescription())
                .owner(user)
                .build();

        ExpenseGroup savedGroup = expenseGroupRepository.save(group);
        groupMemberRepository.save(GroupMember.builder()
                .group(savedGroup)
                .user(user)
                .build());

        return getGroup(savedGroup.getId(), user);
    }

    @Transactional(readOnly = true)
    public List<GroupResponse> getMyGroups(User user) {
        return expenseGroupRepository.findGroupsByMemberUserId(user.getId()).stream()
                .map(group -> mapGroupToResponse(group, groupMemberRepository.findByGroupIdOrderByJoinedAtAsc(group.getId())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public GroupResponse getGroup(Long groupId, User user) {
        ExpenseGroup group = getGroupOrThrow(groupId);
        ensureMember(groupId, user);
        List<GroupMember> members = groupMemberRepository.findByGroupIdOrderByJoinedAtAsc(groupId);
        return mapGroupToResponse(group, members);
    }

    @Transactional
    public GroupResponse addMember(Long groupId, AddGroupMemberRequest request, User user) {
        ExpenseGroup group = getGroupOrThrow(groupId);
        ensureOwner(group, user);

        User memberUser = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.getEmail()));

        if (groupMemberRepository.existsByGroupIdAndUserId(groupId, memberUser.getId())) {
            throw new DuplicateResourceException("User is already a member of this group");
        }

        groupMemberRepository.save(GroupMember.builder()
                .group(group)
                .user(memberUser)
                .build());

        return getGroup(groupId, user);
    }

    @Transactional
    public GroupResponse removeMember(Long groupId, Long userId, User user) {
        ExpenseGroup group = getGroupOrThrow(groupId);
        ensureOwner(group, user);

        if (group.getOwner().getId().equals(userId)) {
            throw new IllegalArgumentException("Group owner cannot be removed from the group");
        }

        if (expenseSplitRepository.existsByGroupExpenseGroupIdAndUserIdAndStatus(groupId, userId, SplitStatus.PENDING)) {
            throw new IllegalArgumentException("Member has pending splits and cannot be removed yet");
        }

        GroupMember membership = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Group member not found"));

        groupMemberRepository.delete(membership);
        return getGroup(groupId, user);
    }

    @Transactional
    public GroupExpenseResponse createGroupExpense(GroupExpenseRequest request, User user) {
        ExpenseGroup group = getGroupOrThrow(request.getGroupId());
        ensureMember(group.getId(), user);

        List<GroupMember> members = groupMemberRepository.findByGroupIdOrderByJoinedAtAsc(group.getId());
        if (members.isEmpty()) {
            throw new IllegalArgumentException("Group must have at least one member before adding expenses");
        }

        GroupExpense groupExpense = GroupExpense.builder()
                .group(group)
                .paidBy(user)
                .amount(request.getAmount().setScale(2, RoundingMode.HALF_UP))
                .description(request.getDescription())
                .category(request.getCategory())
                .date(request.getDate())
                .currency("INR")
                .build();

        List<BigDecimal> splitAmounts = calculateEqualSplits(groupExpense.getAmount(), members.size());
        for (int i = 0; i < members.size(); i++) {
            User splitUser = members.get(i).getUser();
            SplitStatus status = splitUser.getId().equals(user.getId())
                    ? SplitStatus.SETTLED
                    : SplitStatus.PENDING;

            groupExpense.getSplits().add(ExpenseSplit.builder()
                    .groupExpense(groupExpense)
                    .user(splitUser)
                    .owedAmount(splitAmounts.get(i))
                    .status(status)
                    .settledAt(status == SplitStatus.SETTLED ? LocalDateTime.now() : null)
                    .build());
        }

        GroupExpense saved = groupExpenseRepository.save(groupExpense);
        return mapGroupExpenseToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<GroupExpenseResponse> getGroupExpenses(Long groupId, User user) {
        getGroupOrThrow(groupId);
        ensureMember(groupId, user);

        return groupExpenseRepository.findByGroupIdOrderByDateDescCreatedAtDesc(groupId).stream()
                .map(this::mapGroupExpenseToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GroupBalanceResponse> getGroupBalances(Long groupId, User user) {
        getGroupOrThrow(groupId);
        ensureMember(groupId, user);

        Map<Long, GroupBalanceResponse> balances = new LinkedHashMap<>();
        for (GroupMember member : groupMemberRepository.findByGroupIdOrderByJoinedAtAsc(groupId)) {
            User memberUser = member.getUser();
            balances.put(memberUser.getId(), GroupBalanceResponse.builder()
                    .userId(memberUser.getId())
                    .fullName(memberUser.getFullName())
                    .email(memberUser.getEmail())
                    .pendingOwedAmount(BigDecimal.ZERO.setScale(2))
                    .build());
        }

        expenseSplitRepository.findByGroupExpenseGroupIdAndStatus(groupId, SplitStatus.PENDING)
                .forEach(split -> balances.computeIfPresent(split.getUser().getId(), (id, balance) -> {
                    balance.setPendingOwedAmount(balance.getPendingOwedAmount().add(split.getOwedAmount()));
                    return balance;
                }));

        return List.copyOf(balances.values());
    }

    @Transactional
    public ExpenseSplitResponse settleSplit(Long groupId, Long splitId, User user) {
        getGroupOrThrow(groupId);
        ensureMember(groupId, user);

        ExpenseSplit split = expenseSplitRepository.findByIdAndGroupExpenseGroupId(splitId, groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense split not found"));

        boolean isPayer = split.getGroupExpense().getPaidBy().getId().equals(user.getId());
        boolean isDebtor = split.getUser().getId().equals(user.getId());
        if (!isPayer && !isDebtor) {
            throw new AccessDeniedException("You can only settle your own splits or splits owed to you");
        }

        split.setStatus(SplitStatus.SETTLED);
        split.setSettledAt(LocalDateTime.now());
        ExpenseSplit saved = expenseSplitRepository.save(split);
        return mapSplitToResponse(saved);
    }

    @Transactional
    public List<ExpenseSplitResponse> settleAllForMember(Long groupId, Long memberUserId, User user) {
        getGroupOrThrow(groupId);
        ensureMember(groupId, user);

        List<ExpenseSplit> pendingSplits = expenseSplitRepository
                .findByGroupExpenseGroupIdAndUserIdAndStatus(groupId, memberUserId, SplitStatus.PENDING);

        if (pendingSplits.isEmpty()) {
            throw new ResourceNotFoundException("No pending splits found for this member");
        }

        LocalDateTime now = LocalDateTime.now();
        for (ExpenseSplit split : pendingSplits) {
            split.setStatus(SplitStatus.SETTLED);
            split.setSettledAt(now);
        }

        List<ExpenseSplit> saved = expenseSplitRepository.saveAll(pendingSplits);
        return saved.stream().map(this::mapSplitToResponse).collect(Collectors.toList());
    }

    private ExpenseGroup getGroupOrThrow(Long groupId) {
        return expenseGroupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found with id: " + groupId));
    }

    private void ensureMember(Long groupId, User user) {
        if (!groupMemberRepository.existsByGroupIdAndUserId(groupId, user.getId())) {
            throw new AccessDeniedException("You are not a member of this group");
        }
    }

    private void ensureOwner(ExpenseGroup group, User user) {
        if (!group.getOwner().getId().equals(user.getId())) {
            throw new AccessDeniedException("Only the group owner can manage members");
        }
    }

    private List<BigDecimal> calculateEqualSplits(BigDecimal amount, int memberCount) {
        long totalCents = amount.movePointRight(2).longValueExact();
        long baseCents = totalCents / memberCount;
        long remainderCents = totalCents % memberCount;

        return java.util.stream.LongStream.range(0, memberCount)
                .mapToObj(index -> BigDecimal.valueOf(baseCents + (index < remainderCents ? 1 : 0), 2))
                .collect(Collectors.toList());
    }

    private GroupResponse mapGroupToResponse(ExpenseGroup group, List<GroupMember> members) {
        return GroupResponse.builder()
                .id(group.getId())
                .name(group.getName())
                .description(group.getDescription())
                .ownerId(group.getOwner().getId())
                .ownerName(group.getOwner().getFullName())
                .members(members.stream()
                        .map(this::mapMemberToResponse)
                        .collect(Collectors.toList()))
                .createdAt(group.getCreatedAt())
                .build();
    }

    private GroupMemberResponse mapMemberToResponse(GroupMember member) {
        User user = member.getUser();
        return GroupMemberResponse.builder()
                .id(member.getId())
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .joinedAt(member.getJoinedAt())
                .build();
    }

    private GroupExpenseResponse mapGroupExpenseToResponse(GroupExpense expense) {
        return GroupExpenseResponse.builder()
                .id(expense.getId())
                .groupId(expense.getGroup().getId())
                .amount(expense.getAmount())
                .description(expense.getDescription())
                .category(expense.getCategory())
                .date(expense.getDate())
                .paidByUserId(expense.getPaidBy().getId())
                .paidByName(expense.getPaidBy().getFullName())
                .splits(expense.getSplits().stream()
                        .sorted(Comparator.comparing(split -> split.getUser().getId()))
                        .map(this::mapSplitToResponse)
                        .collect(Collectors.toList()))
                .createdAt(expense.getCreatedAt())
                .build();
    }

    private ExpenseSplitResponse mapSplitToResponse(ExpenseSplit split) {
        User user = split.getUser();
        return ExpenseSplitResponse.builder()
                .id(split.getId())
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .owedAmount(split.getOwedAmount())
                .status(split.getStatus())
                .settledAt(split.getSettledAt())
                .build();
    }
}
