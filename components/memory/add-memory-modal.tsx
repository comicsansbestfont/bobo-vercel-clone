'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useCreateMemory, useUpdateMemory } from '@/lib/memory/queries';
import { MemoryCategory, MemoryEntry } from '@/lib/db/types';
import { getCategoryLabel } from '@/lib/memory/utils';

const memorySchema = z.object({
  category: z.string(),
  subcategory: z.string().optional(),
  content: z.string().min(10, 'Content must be at least 10 characters').max(500, 'Content must be less than 500 characters'),
  summary: z.string().optional(),
  confidence: z.number().min(0.5).max(1.0),
  notes: z.string().optional(),
});

type MemoryFormData = z.infer<typeof memorySchema>;

interface AddMemoryModalProps {
  category: MemoryCategory;
  isOpen: boolean;
  onClose: () => void;
  memory?: MemoryEntry; // If editing
}

export function AddMemoryModal({ category, isOpen, onClose, memory }: AddMemoryModalProps) {
  const isEditing = !!memory;
  const createMemory = useCreateMemory();
  const updateMemory = useUpdateMemory();

  const form = useForm<MemoryFormData>({
    resolver: zodResolver(memorySchema),
    defaultValues: memory ? {
      category: memory.category,
      subcategory: memory.subcategory || undefined,
      content: memory.content,
      summary: memory.summary || undefined,
      confidence: memory.confidence,
      notes: '',
    } : {
      category,
      content: '',
      confidence: 0.95,
      notes: '',
    },
  });

  const onSubmit = async (data: MemoryFormData) => {
    if (isEditing && memory) {
      await updateMemory.mutateAsync({
        id: memory.id,
        data: {
          ...data,
          category: data.category as MemoryCategory,
        }
      });
    } else {
      await createMemory.mutateAsync({
        ...data,
        category: data.category as MemoryCategory,
        source_type: 'manual',
        source_chat_ids: [],
        source_project_ids: [],
      });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Memory' : `Add Memory to ${getCategoryLabel(category)}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              placeholder="Enter memory content... (e.g., 'Senior software engineer at Google')"
              rows={3}
              {...form.register('content')}
            />
            {form.formState.errors.content && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.content.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="summary">Summary (optional)</Label>
            <Textarea
              id="summary"
              placeholder="Optional one-sentence summary..."
              rows={2}
              {...form.register('summary')}
            />
          </div>

          <div>
            <Label htmlFor="confidence">Confidence Level</Label>
            <Select
              value={form.watch('confidence').toString()}
              onValueChange={(value) => form.setValue('confidence', parseFloat(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.95">Very High (0.95)</SelectItem>
                <SelectItem value="0.8">High (0.8)</SelectItem>
                <SelectItem value="0.6">Medium (0.6)</SelectItem>
                <SelectItem value="0.5">Low (0.5)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {category === 'brief_history' && (
            <div>
              <Label htmlFor="subcategory">Time Period</Label>
              <Select 
                value={form.watch('subcategory')} 
                onValueChange={(value) => form.setValue('subcategory', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent_months">Recent Months (0-3 months ago)</SelectItem>
                  <SelectItem value="earlier">Earlier (3-12 months ago)</SelectItem>
                  <SelectItem value="long_term">Long Term (1+ year ago)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Internal Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Optional notes for yourself (not shown to AI)..."
              rows={2}
              {...form.register('notes')}
            />
            <p className="text-xs text-muted-foreground mt-1">
              These notes are for your reference only and will not be included in the AI context.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
