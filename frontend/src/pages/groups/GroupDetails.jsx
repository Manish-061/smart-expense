import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Users, Plus, UserPlus, Receipt } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../lib/api";
import useAuthStore from "../../store/useAuthStore";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { BalanceIndicator } from "../../components/groups/BalanceIndicator";
import { GroupExpenseForm } from "../../components/groups/GroupExpenseForm";
import { CategoryBadge } from "../../components/ui/CategoryBadge";
import { getCategoryConfig } from "../../lib/categories";
import { formatAmount } from "../../lib/currencies";

const addMemberSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function GroupDetails() {
  const { id } = useParams();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);

  // Queries
  const { data: group, isLoading: isGroupLoading } = useQuery({
    queryKey: ['groups', id],
    queryFn: async () => {
      const response = await api.get(`/groups/${id}`);
      return response.data;
    }
  });

  const { data: expenses, isLoading: isExpensesLoading } = useQuery({
    queryKey: ['groups', id, 'expenses'],
    queryFn: async () => {
      const response = await api.get(`/groups/${id}/expenses`);
      return response.data;
    },
    enabled: !!group,
  });

  const { data: balances, isLoading: isBalancesLoading } = useQuery({
    queryKey: ['groups', id, 'balances'],
    queryFn: async () => {
      const response = await api.get(`/groups/${id}/balances`);
      return response.data;
    },
    enabled: !!group,
  });

  // Mutations
  const addMemberForm = useForm({ resolver: zodResolver(addMemberSchema) });
  
  const addMemberMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/groups/${id}/members`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', id] });
      queryClient.invalidateQueries({ queryKey: ['groups', id, 'balances'] });
      addMemberForm.reset();
    }
  });

  const addExpenseMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/expenses/group', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', id, 'expenses'] });
      queryClient.invalidateQueries({ queryKey: ['groups', id, 'balances'] });
      setIsExpenseFormOpen(false);
    }
  });

  if (isGroupLoading) {
    return <div className="p-12 text-center text-gray-500">Loading group details...</div>;
  }

  if (!group) {
    return <div className="p-12 text-center text-red-500">Group not found or you don't have access.</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto relative">
      {/* Expense Modal */}
      {isExpenseFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <GroupExpenseForm 
            groupId={group.id}
            onCancel={() => setIsExpenseFormOpen(false)}
            onSubmit={(data) => addExpenseMutation.mutate(data)}
            isLoading={addExpenseMutation.isPending}
          />
        </div>
      )}

      {/* Header */}
      <div>
        <Link to="/groups" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Groups
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
            {group.description && <p className="text-gray-600 mt-1">{group.description}</p>}
            <p className="text-sm text-gray-500 mt-2">
              Created {format(new Date(group.createdAt), "MMM d, yyyy")} • {group.members?.length || 0} Members
            </p>
          </div>
          <Button onClick={() => setIsExpenseFormOpen(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Balances & Members */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Balances Section */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Group Balances</h3>
            </div>
            <div className="p-5 space-y-4 bg-gray-50/50">
              {isBalancesLoading ? (
                <p className="text-sm text-gray-500 text-center">Loading balances...</p>
              ) : !balances || balances.every(b => !b.pendingOwedAmount || b.pendingOwedAmount <= 0) ? (
                <p className="text-sm text-gray-500 text-center">All settled up! 🎉</p>
              ) : (
                balances.map(balance => (
                  <BalanceIndicator 
                    key={balance.userId} 
                    groupId={id}
                    balance={balance} 
                    currentUserId={user?.id} 
                  />
                ))
              )}
            </div>
          </div>

          {/* Members Section */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-400" />
              <h3 className="font-bold text-gray-900">Members ({group.members?.length || 0})</h3>
            </div>
            <div className="p-5 space-y-4">
              <ul className="space-y-3">
                {group.members?.map(member => (
                  <li key={member.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-xs">
                      {member.fullName?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {member.fullName} {member.userId === user?.id && "(You)"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{member.email}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="pt-4 border-t border-gray-100">
                <form onSubmit={addMemberForm.handleSubmit(data => addMemberMutation.mutate(data))} className="flex gap-2">
                  <div className="flex-1">
                    <Input 
                      placeholder="User's email" 
                      className="!h-9 text-sm"
                      {...addMemberForm.register("email")}
                      error={addMemberForm.formState.errors.email?.message}
                    />
                  </div>
                  <Button type="submit" size="sm" className="!px-3 flex-shrink-0" isLoading={addMemberMutation.isPending}>
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </form>
                {addMemberMutation.isError && (
                  <p className="text-xs text-red-500 mt-1">Failed to add user. Ensure they are registered.</p>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Expenses List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Recent Group Expenses</h3>
            </div>
            
            <div className="p-0">
              {isExpensesLoading ? (
                <div className="p-8 text-center text-gray-500">Loading expenses...</div>
              ) : !expenses || expenses.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No expenses added to this group yet.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {expenses.map(expense => {
                    const catConfig = getCategoryConfig(expense.category);
                    const CatIcon = catConfig.icon;
                    return (
                      <li key={expense.id} className="p-5 hover:bg-gray-50 transition-colors flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4">
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-full ${catConfig.bg} flex items-center justify-center ${catConfig.color} mt-1 sm:mt-0 flex-shrink-0`}>
                            <CatIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{expense.description}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-sm text-gray-500">{format(new Date(expense.date), "MMM d, yyyy")}</span>
                              <span className="text-gray-300">•</span>
                              <span className="text-sm text-gray-500">Paid by <span className="font-medium">{expense.paidByName}</span></span>
                            </div>
                            <div className="mt-2">
                              <CategoryBadge category={expense.category} size="sm" showIcon={false} />
                            </div>
                          </div>
                        </div>
                        <div className="text-right sm:text-left w-full sm:w-auto flex sm:flex-col justify-between sm:justify-start items-center sm:items-end">
                           <span className="text-sm text-gray-500 sm:hidden">Amount:</span>
                           <div className="font-bold text-gray-900 text-lg">
                            {formatAmount(expense.amount)}
                           </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
