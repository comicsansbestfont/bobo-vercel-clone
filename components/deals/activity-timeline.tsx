'use client';

/**
 * Activity Timeline - Middle panel showing chronological activity feed
 *
 * Module: USE-002 (Deal Workspace)
 * Status: Stub - Designed, not implemented
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Phone,
  Mail,
  Video,
  MessageSquare,
  Linkedin,
  StickyNote,
  CheckCircle2
} from 'lucide-react';

interface ActivityTimelineProps {
  projectId: string;
  selectedActivityId: string | null;
  onSelectActivity: (id: string | null) => void;
}

// Activity type icons mapping
const activityIcons = {
  call: Phone,
  email: Mail,
  meeting: Video,
  message: MessageSquare,
  linkedin: Linkedin,
  note: StickyNote,
  task_completed: CheckCircle2,
};

// Mock data for UI development
const mockActivities = [
  {
    id: '1',
    type: 'call' as const,
    title: 'Pitch practice session',
    date: '2025-12-10T14:00:00Z',
    duration: 45,
    outcome: 'positive',
    summary: 'Reviewed pitch deck and practiced VC Q&A responses. Good progress on valuation discussion.',
  },
  {
    id: '2',
    type: 'email' as const,
    title: 'Follow-up on pitch deck',
    date: '2025-12-10T16:30:00Z',
    outcome: 'neutral',
    summary: 'Sent updated pitch deck with revised projections.',
  },
  {
    id: '3',
    type: 'meeting' as const,
    title: 'VC intro discussion',
    date: '2025-12-08T10:00:00Z',
    duration: 30,
    outcome: 'positive',
    summary: 'Discussed warm intro strategy for Purpose Ventures pitch.',
  },
];

export function ActivityTimeline({
  projectId,
  selectedActivityId,
  onSelectActivity
}: ActivityTimelineProps) {
  // TODO: Fetch activities from API
  // const { data: activities, isLoading } = useActivities(projectId);

  const activities = mockActivities;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Activity Timeline</h2>
        <Badge variant="secondary">{activities.length} activities</Badge>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            isSelected={selectedActivityId === activity.id}
            onClick={() => onSelectActivity(
              selectedActivityId === activity.id ? null : activity.id
            )}
          />
        ))}

        {activities.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No activities logged yet. Use the quick actions above to log your first activity.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

interface ActivityCardProps {
  activity: {
    id: string;
    type: keyof typeof activityIcons;
    title: string;
    date: string;
    duration?: number;
    outcome?: string;
    summary: string;
  };
  isSelected: boolean;
  onClick: () => void;
}

function ActivityCard({ activity, isSelected, onClick }: ActivityCardProps) {
  const Icon = activityIcons[activity.type] || StickyNote;

  const getOutcomeColor = (outcome?: string) => {
    switch (outcome) {
      case 'positive': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'negative': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">{activity.title}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(activity.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {activity.duration && ` · ${activity.duration} min`}
              </p>
            </div>
          </div>
          {activity.outcome && (
            <Badge
              variant="secondary"
              className={getOutcomeColor(activity.outcome)}
            >
              {activity.outcome}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {activity.summary}
        </p>
      </CardContent>
    </Card>
  );
}
