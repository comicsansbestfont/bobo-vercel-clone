'use client';

import { Mail, Phone, Calendar, FileText, MessageSquare, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import type { ContactActivity } from './types';

interface ContactActivityFeedProps {
  activities: ContactActivity[];
}

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  email: Mail,
  call: Phone,
  meeting: Calendar,
  video: Video,
  note: FileText,
  message: MessageSquare,
};

const ACTIVITY_COLORS: Record<string, string> = {
  email: 'bg-purple-100 text-purple-600',
  call: 'bg-blue-100 text-blue-600',
  meeting: 'bg-orange-100 text-orange-600',
  video: 'bg-green-100 text-green-600',
  note: 'bg-gray-100 text-gray-600',
  message: 'bg-cyan-100 text-cyan-600',
};

export function ContactActivityFeed({ activities }: ContactActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <MessageSquare className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm">No activity yet</p>
        <p className="text-xs">Activities with this contact will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {activities.map((activity, index) => {
        const Icon = ACTIVITY_ICONS[activity.activity_type] || MessageSquare;
        const colorClass = ACTIVITY_COLORS[activity.activity_type] || 'bg-gray-100 text-gray-600';

        return (
          <div
            key={activity.id}
            className="flex gap-3 p-4 border-b last:border-b-0 hover:bg-muted/30 transition-colors"
          >
            {/* Icon */}
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
              <Icon className="h-4 w-4" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="text-sm font-medium truncate">
                  {activity.title || `${activity.activity_type} activity`}
                </h4>
                <div className="flex items-center gap-2 shrink-0">
                  {activity.direction && (
                    <Badge variant="outline" className="text-[10px]">
                      {activity.direction}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.activity_date), { addSuffix: true })}
                  </span>
                </div>
              </div>

              {activity.summary && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {activity.summary}
                </p>
              )}

              {activity.channel && (
                <Badge variant="secondary" className="mt-2 text-[10px]">
                  {activity.channel}
                </Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
