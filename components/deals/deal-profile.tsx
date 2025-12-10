'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ExternalLink,
  DollarSign,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStageConfig } from '@/lib/sidebar/stage-config';
import { Skeleton } from '@/components/ui/skeleton';

interface DealDetail {
  id: string;
  name: string;
  stage: string;
  company?: string;
  website?: string;
  founder?: string;
  leadSource?: string;
  arrEstimate?: string;
  teamSize?: string;
  firstContact?: string;
  lastUpdated?: string;
  engagementType?: string;
  currentStage?: string;
  folderPath?: string;
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  redFlags?: string[];
  timeline?: Array<{
    date: string;
    stage: string;
    notes: string;
  }>;
}

interface DealProfileProps {
  dealId: string;
}

export function DealProfile({ dealId }: DealProfileProps) {
  const router = useRouter();
  const [deal, setDeal] = useState<DealDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDeal() {
      try {
        setLoading(true);
        const res = await fetch(`/api/deals/${dealId}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error('Deal not found');
          throw new Error('Failed to fetch deal');
        }
        const data = await res.json();
        setDeal(data.deal);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load deal');
      } finally {
        setLoading(false);
      }
    }

    fetchDeal();
  }, [dealId]);

  if (loading) {
    return <DealProfileSkeleton />;
  }

  if (error || !deal) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <p className="text-destructive">{error || 'Deal not found'}</p>
        <Link
          href="/deals"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pipeline
        </Link>
      </div>
    );
  }

  const stageConfig = getStageConfig(deal.stage);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Compact Header */}
      <header className="flex items-center gap-4 px-4 py-3 border-b bg-muted/30">
        <Link
          href="/deals"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <h1 className="font-semibold text-lg">{deal.name}</h1>

        <div className={cn(
          'flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
          stageConfig.color.replace('bg-', 'bg-opacity-20 '),
          stageConfig.textColor
        )}>
          <div className={cn('h-2 w-2 rounded-full', stageConfig.color)} />
          {deal.stage}
        </div>

        {deal.arrEstimate && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            {deal.arrEstimate}
          </span>
        )}

        {deal.teamSize && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {deal.teamSize}
          </span>
        )}

        {deal.website && (
          <a
            href={deal.website.startsWith('http') ? deal.website : `https://${deal.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" />
            Web
          </a>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {/* Overview Section */}
        <section className="border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b">
            <h2 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
              Overview
            </h2>
          </div>
          <div className="p-4 space-y-4">
            {deal.founder && (
              <p className="font-medium">{deal.founder}</p>
            )}

            <p className="text-sm text-muted-foreground">
              {deal.website && (
                <a
                  href={deal.website.startsWith('http') ? deal.website : `https://${deal.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {deal.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              {deal.website && deal.leadSource && ' • '}
              {deal.leadSource}
              {(deal.website || deal.leadSource) && deal.firstContact && ' • '}
              {deal.firstContact && `First Contact: ${deal.firstContact}`}
            </p>

            {deal.summary && (
              <p className="text-sm leading-relaxed">{deal.summary}</p>
            )}

            {/* Tags Row */}
            <div className="flex flex-wrap gap-2">
              {deal.currentStage && (
                <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded">
                  {deal.currentStage}
                </span>
              )}
              {deal.engagementType && (
                <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded">
                  {deal.engagementType}
                </span>
              )}
              {deal.lastUpdated && (
                <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Updated {deal.lastUpdated}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Assessment Section */}
        {(deal.strengths?.length || deal.weaknesses?.length || deal.redFlags?.length) && (
          <section className="border rounded-lg overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 border-b">
              <h2 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                Assessment
              </h2>
            </div>
            <div className="p-4 space-y-4">
              {deal.strengths && deal.strengths.length > 0 && (
                <div className="space-y-2">
                  {deal.strengths.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}

              {deal.weaknesses && deal.weaknesses.length > 0 && (
                <div className="space-y-2">
                  {deal.weaknesses.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <XCircle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}

              {deal.redFlags && deal.redFlags.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  {deal.redFlags.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Timeline Section */}
        {deal.timeline && deal.timeline.length > 0 && (
          <section className="border rounded-lg overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 border-b">
              <h2 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                Timeline
              </h2>
            </div>
            <div className="p-4">
              <div className="relative pl-6 space-y-4">
                {/* Vertical line */}
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

                {deal.timeline.map((entry, i) => (
                  <div key={i} className="relative">
                    {/* Dot */}
                    <div className={cn(
                      'absolute -left-6 top-1.5 h-3 w-3 rounded-full border-2 border-background',
                      i === 0 ? 'bg-primary' : 'bg-muted-foreground/30'
                    )} />

                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-20 flex-shrink-0">
                        {entry.date}
                      </span>
                      <span className="text-sm">
                        {entry.notes || entry.stage}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function DealProfileSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Header skeleton */}
      <div className="flex items-center gap-4 px-4 py-3 border-b bg-muted/30">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-16" />
      </div>

      {/* Content skeleton */}
      <div className="flex-1 p-4 md:p-6 space-y-6">
        <div className="border rounded-lg p-4 space-y-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-20 w-full" />
        </div>

        <div className="border rounded-lg p-4 space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  );
}
