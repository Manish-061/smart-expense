import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Users, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { GroupCard } from "../../components/groups/GroupCard";

const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100),
  description: z.string().max(255).optional(),
});

function CreateGroupModal({ onClose, onSuccess }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(createGroupSchema)
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/groups', data);
      return response.data;
    },
    onSuccess: (data) => {
      onSuccess(data);
      onClose();
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Create New Group</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
            <Input 
              placeholder="e.g. Trip to Iceland" 
              {...register("name")}
              error={errors.name?.message}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <Input 
              placeholder="e.g. Shared costs for the trip" 
              {...register("description")}
              error={errors.description?.message}
            />
          </div>
          
          <div className="pt-4 flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={mutation.isPending}>
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Groups() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: groups, isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const response = await api.get('/groups');
      return response.data;
    }
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {isModalOpen && (
        <CreateGroupModal 
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['groups'] })}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Group Expenses</h1>
          <p className="text-gray-600 mt-1">Manage and split costs with your team and friends.</p>
        </div>
        
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Create Group
        </Button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-gray-500">Loading groups...</div>
      ) : groups?.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No groups yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Create a group to start splitting bills with roommates, friends, or travel buddies.
          </p>
          <Button onClick={() => setIsModalOpen(true)}>Create your first group</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups?.map(group => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}
