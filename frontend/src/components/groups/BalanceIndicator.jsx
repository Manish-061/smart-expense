import { CheckCircle2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import { Button } from "../ui/Button";
import { formatAmount } from "../../lib/currencies";

/**
 * Displays a single member's pending balance in a group.
 * 
 * Backend shape (GroupBalanceResponse):
 *   { userId, fullName, email, pendingOwedAmount }
 */
export function BalanceIndicator({ groupId, balance, currentUserId }) {
  const queryClient = useQueryClient();

  const settleAllMutation = useMutation({
    mutationFn: async () => {
      const response = await api.patch(`/groups/${groupId}/members/${balance.userId}/settle-all`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', String(groupId), 'balances'] });
      queryClient.invalidateQueries({ queryKey: ['groups', String(groupId), 'expenses'] });
    }
  });

  if (!balance.pendingOwedAmount || balance.pendingOwedAmount <= 0) return null;

  const isMe = balance.userId === currentUserId;

  return (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
          ${isMe ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}
        >
          {balance.fullName.charAt(0)}
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-900">
            {isMe 
              ? <span>You owe</span>
              : <span><span className="font-bold">{balance.fullName}</span> owes</span>
            }
          </p>
          <p className={`text-lg font-bold ${isMe ? 'text-red-600' : 'text-amber-600'}`}>
            {formatAmount(balance.pendingOwedAmount)}
          </p>
        </div>
      </div>

      {!isMe && (
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => settleAllMutation.mutate()}
          isLoading={settleAllMutation.isPending}
          className="!text-xs"
        >
          <CheckCircle2 className="w-4 h-4 mr-1" />
          Settle Up
        </Button>
      )}

      {isMe && (
        <span className="text-xs font-medium bg-red-50 text-red-600 px-2 py-1 rounded-full border border-red-100">
          Pending
        </span>
      )}
    </div>
  );
}
