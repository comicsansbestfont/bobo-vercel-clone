'use client';

import { useState } from 'react';
import { MemoryEntry } from '@/lib/db/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Link as LinkIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getConfidenceBadge } from '@/lib/memory/utils';
import { AddMemoryModal } from './add-memory-modal';
import { DeleteConfirmDialog } from './delete-confirm-dialog';
import { ProvenanceModal } from './provenance-modal';

interface MemoryCardProps {
  memory: MemoryEntry;
  decayBadge?: boolean;
}

export function MemoryCard({ memory, decayBadge }: MemoryCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showProvenance, setShowProvenance] = useState(false);

  const confidenceBadge = getConfidenceBadge(memory.confidence);
  const lastMentioned = memory.last_mentioned ? new Date(memory.last_mentioned) : new Date(memory.created_at);
  const isRecent = new Date().getTime() - lastMentioned.getTime() < 7 * 24 * 60 * 60 * 1000; // 7 days

  return (
    <Card className="group hover:shadow-md transition-all hover:border-primary/20">
      <CardContent className="p-3 md:p-4">
        <div className="flex items-start justify-between gap-2 md:gap-4">
          <div className="flex-1 space-y-2">
            <p className="text-sm leading-relaxed text-foreground/90">{memory.content}</p>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Confidence Badge */}
              <Badge variant={confidenceBadge.variant} className="text-[10px] h-5 px-1.5">
                {confidenceBadge.label}
              </Badge>

              {/* Decay Indicator (for Top of Mind) */}
              {decayBadge && isRecent && (
                <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-green-500/50 text-green-600 bg-green-50 dark:bg-green-950/20">
                  Active
                </Badge>
              )}

              {/* Source Count */}
              {memory.source_message_count > 1 && (
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                  {memory.source_message_count} sources
                </Badge>
              )}

              {/* Last Mentioned */}
              <span className="text-[10px] text-muted-foreground ml-1">
                Updated {formatDistanceToNow(lastMentioned, { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Action Buttons (always visible on mobile, hover on desktop) */}
          <div className="flex items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-md border shadow-sm p-0.5 -mt-1 -mr-1 md:-mt-2 md:-mr-2">
            {memory.source_chat_ids && memory.source_chat_ids.length > 0 && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 md:h-7 md:w-7"
                onClick={() => setShowProvenance(true)}
                title="View source chats"
              >
                <LinkIcon className="w-4 h-4 md:w-3.5 md:h-3.5" />
              </Button>
            )}

            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 md:h-7 md:w-7"
              onClick={() => setShowEditModal(true)}
              title="Edit memory"
            >
              <Edit2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowDeleteDialog(true)}
              title="Delete memory"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 md:h-7 md:w-7"
            >
              <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Modals */}
      {showEditModal && (
        <AddMemoryModal 
            category={memory.category} 
            isOpen={showEditModal} 
            onClose={() => setShowEditModal(false)}
            memory={memory} 
        />
      )}
      {showDeleteDialog && (
        <DeleteConfirmDialog 
            memory={memory} 
            isOpen={showDeleteDialog}
            onClose={() => setShowDeleteDialog(false)} 
        />
      )}
      {showProvenance && (
        <ProvenanceModal 
            memory={memory} 
            isOpen={showProvenance}
            onClose={() => setShowProvenance(false)} 
        />
      )}
    </Card>
  );
}
