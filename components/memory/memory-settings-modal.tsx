'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useMemorySettings, useUpdateMemorySettings, useClearAllMemories } from '@/lib/memory/queries';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState, useEffect } from 'react';

const settingsSchema = z.object({
  auto_extraction_enabled: z.boolean(),
  extraction_frequency: z.enum(['realtime', 'daily', 'weekly', 'manual']),
  enabled_categories: z.array(z.string()),
  token_budget: z.number().min(100).max(2000),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface MemorySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MemorySettingsModal({ isOpen, onClose }: MemorySettingsModalProps) {
  const { data: settings, isLoading } = useMemorySettings();
  const updateSettings = useUpdateMemorySettings();
  const [showClearDialog, setShowClearDialog] = useState(false);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      auto_extraction_enabled: false,
      extraction_frequency: 'realtime',
      enabled_categories: [
        'work_context',
        'personal_context',
        'top_of_mind',
        'brief_history',
        'long_term_background',
        'other_instructions',
      ],
      token_budget: 500,
    },
  });

  // Update form values when settings load
  useEffect(() => {
    if (settings) {
      form.reset({
        auto_extraction_enabled: settings.auto_extraction_enabled,
        extraction_frequency: settings.extraction_frequency,
        enabled_categories: settings.enabled_categories || [],
        token_budget: settings.token_budget,
      });
    }
  }, [settings, form]);

  const onSubmit = async (data: SettingsFormData) => {
    await updateSettings.mutateAsync(data);
    onClose();
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <p>Loading settings...</p>
        </DialogContent>
      </Dialog>
    );
  }

  const categories = [
    { id: 'work_context', label: 'Work Context' },
    { id: 'personal_context', label: 'Personal Context' },
    { id: 'top_of_mind', label: 'Top of Mind' },
    { id: 'brief_history', label: 'Brief History' },
    { id: 'long_term_background', label: 'Long-Term Background' },
    { id: 'other_instructions', label: 'Other Instructions' },
  ];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Memory Settings</DialogTitle>
            <DialogDescription>
              Control how Bobo extracts and uses memories about you
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Automatic Extraction */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-extraction" className="text-base font-semibold">
                    Automatic Memory Extraction
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically extract memories from your conversations
                  </p>
                </div>
                <Switch
                  id="auto-extraction"
                  checked={form.watch('auto_extraction_enabled')}
                  onCheckedChange={(checked) => form.setValue('auto_extraction_enabled', checked)}
                />
              </div>

              {form.watch('auto_extraction_enabled') && (
                <div>
                  <Label htmlFor="frequency">Extraction Frequency</Label>
                  <Select
                    value={form.watch('extraction_frequency')}
                    onValueChange={(value: any) => form.setValue('extraction_frequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">After every chat (recommended)</SelectItem>
                      <SelectItem value="daily">Daily batch processing</SelectItem>
                      <SelectItem value="weekly">Weekly batch processing</SelectItem>
                      <SelectItem value="manual">Manual only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Separator />

            {/* Privacy Controls */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">Privacy Controls</Label>
                <p className="text-sm text-muted-foreground">
                  Choose which categories to include in memory extraction
                </p>
              </div>

              <div className="space-y-2">
                {categories.map(category => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={category.id}
                      checked={form.watch('enabled_categories').includes(category.id)}
                      onChange={(e) => {
                        const current = form.watch('enabled_categories');
                        if (e.target.checked) {
                          form.setValue('enabled_categories', [...current, category.id]);
                        } else {
                          form.setValue('enabled_categories', current.filter(c => c !== category.id));
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor={category.id} className="text-sm font-normal cursor-pointer">
                      {category.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Token Budget */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="token-budget" className="text-base font-semibold">
                  Token Budget
                </Label>
                <p className="text-sm text-muted-foreground">
                  Maximum tokens to use for memory in AI context (100-2000)
                </p>
              </div>

              <Input
                id="token-budget"
                type="number"
                min={100}
                max={2000}
                {...form.register('token_budget', { valueAsNumber: true })}
              />
              {form.formState.errors.token_budget && (
                <p className="text-sm text-destructive">
                  Token budget must be between 100 and 2000
                </p>
              )}
            </div>

            <Separator />

            {/* Danger Zone */}
            <div className="space-y-4 border border-destructive/50 rounded-lg p-4 bg-destructive/5">
              <div>
                <Label className="text-base font-semibold text-destructive">Danger Zone</Label>
                <p className="text-sm text-muted-foreground">
                  Irreversible actions that affect all your memories
                </p>
              </div>

              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowClearDialog(true)}
              >
                Clear All Extracted Memories
              </Button>
              <p className="text-xs text-muted-foreground">
                This will delete all automatically extracted memories. Your manual profile will be preserved.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Settings'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Clear All Confirmation Dialog */}
      {showClearDialog && (
        <ClearAllConfirmDialog
          isOpen={showClearDialog}
          onClose={() => setShowClearDialog(false)}
        />
      )}
    </>
  );
}

function ClearAllConfirmDialog({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [confirmText, setConfirmText] = useState('');
  const clearAllMemories = useClearAllMemories();

  const handleClear = async () => {
    if (confirmText === 'DELETE') {
      await clearAllMemories.mutateAsync();
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear All Extracted Memories?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete all automatically extracted memories.
            <br />
            <br />
            Your manual profile will be preserved.
            <br />
            <br />
            Type <strong>DELETE</strong> to confirm.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Input
          placeholder="Type DELETE to confirm"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
        />

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleClear}
            disabled={confirmText !== 'DELETE'}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Clear All Memories
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
