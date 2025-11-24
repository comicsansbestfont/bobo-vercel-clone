import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { memoryApi } from './api';
import { toast } from 'sonner';
import { MemoryEntry } from '@/lib/db/types';

// MEMORIES
export function useMemories() {
  return useQuery({
    queryKey: ['memories'],
    queryFn: memoryApi.getMemories,
  });
}

export function useCreateMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: memoryApi.createMemory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      toast.success('Memory added successfully');
    },
    onError: (error) => {
      toast.error('Failed to create memory');
      console.error(error);
    },
  });
}

export function useUpdateMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MemoryEntry> }) =>
      memoryApi.updateMemory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      toast.success('Memory updated');
    },
    onError: () => {
      toast.error('Failed to update memory');
    },
  });
}

export function useDeleteMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: memoryApi.deleteMemory,
    onMutate: async (id) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['memories'] });
      const previousMemories = queryClient.getQueryData(['memories']);

      queryClient.setQueryData(['memories'], (old: MemoryEntry[] | undefined) =>
        old ? old.filter(m => m.id !== id) : []
      );

      return { previousMemories };
    },
    onError: (err, id, context) => {
      // Rollback on error
      queryClient.setQueryData(['memories'], context?.previousMemories);
      toast.error('Failed to delete memory');
    },
    onSuccess: () => {
      toast.success('Memory deleted');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
  });
}

// SETTINGS
export function useMemorySettings() {
  return useQuery({
    queryKey: ['memory-settings'],
    queryFn: memoryApi.getSettings,
  });
}

export function useUpdateMemorySettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: memoryApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory-settings'] });
      toast.success('Settings saved');
    },
    onError: () => {
      toast.error('Failed to update settings');
    },
  });
}

// SUGGESTIONS
export function useMemorySuggestions() {
  return useQuery({
    queryKey: ['memory-suggestions'],
    queryFn: memoryApi.getSuggestions,
  });
}

export function useAcceptSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: memoryApi.acceptSuggestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      queryClient.invalidateQueries({ queryKey: ['memory-suggestions'] });
      toast.success('Suggestion added to memories');
    },
    onError: () => {
      toast.error('Failed to accept suggestion');
    }
  });
}

export function useDismissSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: memoryApi.dismissSuggestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory-suggestions'] });
      toast.success('Suggestion dismissed');
    },
    onError: () => {
      toast.error('Failed to dismiss suggestion');
    }
  });
}

// BULK ACTIONS
export function useClearAllMemories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: memoryApi.clearAllMemories,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      toast.success(data.message || 'Extracted memories cleared');
    },
    onError: () => {
      toast.error('Failed to clear memories');
    }
  });
}
