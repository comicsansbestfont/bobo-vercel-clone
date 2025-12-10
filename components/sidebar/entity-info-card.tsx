/**
 * Entity Info Card Component
 *
 * Displays deal/client info card with stage and last updated
 *
 * M312B-07: Entity Info Card
 */

'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { StageIndicator } from './stage-indicator';
import { Briefcase, Users, Loader2 } from 'lucide-react';

interface EntityInfoCardProps {
  type: 'deal' | 'client';
  name: string;
  folderPath: string;
}

interface MasterDocMeta {
  stage?: string;
  lastUpdated?: string;
  company?: string;
  founder?: string;
  website?: string;
  arrEstimate?: string;
  teamSize?: string;
  engagementType?: string;
}

export function EntityInfoCard({ type, name, folderPath }: EntityInfoCardProps) {
  const [meta, setMeta] = useState<MasterDocMeta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/advisory/master-doc?folderPath=${encodeURIComponent(folderPath)}`)
      .then(res => res.json())
      .then(data => setMeta(data.frontmatter || {}))
      .catch(() => setMeta({}))
      .finally(() => setLoading(false));
  }, [folderPath]);

  const Icon = type === 'deal' ? Briefcase : Users;

  return (
    <Card className="p-3 mb-4 bg-sidebar-accent/50">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary/10">
          <Icon className="h-4 w-4 text-sidebar-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{name}</h3>
          {meta?.company && meta.company !== name && (
            <p className="text-xs text-muted-foreground truncate">{meta.company}</p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : meta && (
        <div className="space-y-1.5">
          {meta.stage && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-xs text-muted-foreground">Stage</span>
              <StageIndicator stage={meta.stage} showLabel />
            </div>
          )}
          {meta.engagementType && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-xs text-muted-foreground">Type</span>
              <span className="text-xs">{meta.engagementType}</span>
            </div>
          )}
          {meta.lastUpdated && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-xs text-muted-foreground">Updated</span>
              <span className="text-xs">
                {formatDate(meta.lastUpdated)}
              </span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return dateStr;
  }
}
