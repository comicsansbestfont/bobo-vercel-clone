/**
 * Entity Info Card Component
 *
 * Displays deal/client info card with stage and last updated
 *
 * M312B-07: Entity Info Card
 */

'use client';

import { useEffect, useState } from 'react';
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
    <div className="flex items-center gap-2 py-1">
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sidebar-primary/10 shrink-0">
        <Icon className="h-3.5 w-3.5 text-sidebar-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm truncate leading-tight">{name}</h3>
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground mt-0.5" />
        ) : meta && (
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            {meta.stage && <StageIndicator stage={meta.stage} showLabel />}
            {meta.lastUpdated && (
              <span className="truncate">{formatDate(meta.lastUpdated)}</span>
            )}
          </div>
        )}
      </div>
    </div>
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
