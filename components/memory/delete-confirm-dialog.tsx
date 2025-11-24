'use client';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MemoryEntry } from '@/lib/db/types';
import { useDeleteMemory } from '@/lib/memory/queries';

interface DeleteConfirmDialogProps {
  memory: MemoryEntry;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteConfirmDialog({ memory, isOpen, onClose }: DeleteConfirmDialogProps) {
  const deleteMemory = useDeleteMemory();

  const handleDelete = async () => {
    await deleteMemory.mutateAsync(memory.id);
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Memory?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this memory?
            <br />
            <br />
            <strong>"{memory.content}"</strong>
            <br />
            <br />
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
