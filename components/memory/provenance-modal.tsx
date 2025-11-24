'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MemoryEntry } from '@/lib/db/types';
import { format } from 'date-fns';
import { getConfidenceBadge } from '@/lib/memory/utils';
import { Badge } from '@/components/ui/badge';

interface ProvenanceModalProps {
  memory: MemoryEntry;
  isOpen: boolean;
  onClose: () => void;
}

export function ProvenanceModal({ memory, isOpen, onClose }: ProvenanceModalProps) {
  const confidenceBadge = getConfidenceBadge(memory.confidence);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Memory Provenance</DialogTitle>
          <DialogDescription>
            Details about how this memory was created
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-md text-sm italic">
            "{memory.content}"
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Extraction Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Confidence:</div>
              <div>
                <Badge variant={confidenceBadge.variant} className="text-xs">
                  {confidenceBadge.label} ({memory.confidence})
                </Badge>
              </div>
              
              <div className="text-muted-foreground">Source Type:</div>
              <div className="capitalize">{memory.source_type}</div>
              
              <div className="text-muted-foreground">Created:</div>
              <div>{format(new Date(memory.created_at), 'PPP p')}</div>
              
              <div className="text-muted-foreground">Last Updated:</div>
              <div>{format(new Date(memory.last_updated || memory.created_at), 'PPP p')}</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Source Chats ({memory.source_chat_ids?.length || 0})</h4>
            {memory.source_chat_ids && memory.source_chat_ids.length > 0 ? (
              <ul className="text-sm space-y-1 list-disc pl-4 text-muted-foreground">
                {memory.source_chat_ids.map((chatId, index) => (
                  <li key={index}>
                    Chat ID: {chatId.slice(0, 8)}...
                    {/* In a real app, we would fetch chat titles here */}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No source chats linked (Manual entry)</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
