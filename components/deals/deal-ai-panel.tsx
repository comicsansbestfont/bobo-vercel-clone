'use client';

/**
 * Deal AI Panel - Right panel for AI chat and generated artifacts
 *
 * Module: USE-002 (Deal Workspace)
 * Status: Stub - Designed, not implemented
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  FileText,
  Lightbulb,
  Send,
  Sparkles,
  ClipboardList,
  Mail
} from 'lucide-react';

interface DealAIPanelProps {
  projectId: string;
  selectedActivityId: string | null;
}

export function DealAIPanel({ projectId, selectedActivityId }: DealAIPanelProps) {
  const [activeTab, setActiveTab] = useState('chat');
  const [message, setMessage] = useState('');

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b px-4">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="artifacts" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Artifacts
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Suggestions
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chat" className="flex-1 flex flex-col m-0 p-4">
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Chat messages would go here */}
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                Ask me about this deal, generate prep briefs, or draft emails.
              </p>
            </div>
          </div>

          {/* Chat Input */}
          <div className="mt-4 space-y-2">
            <div className="flex gap-2">
              <Textarea
                placeholder="Ask about this deal..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <ClipboardList className="h-4 w-4 mr-1" />
                  Prep Brief
                </Button>
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-1" />
                  Draft Email
                </Button>
              </div>
              <Button size="sm" disabled={!message.trim()}>
                <Send className="h-4 w-4 mr-1" />
                Send
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="artifacts" className="flex-1 m-0 p-4 overflow-y-auto">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generated documents and drafts for this deal.
            </p>

            {/* Placeholder artifact cards */}
            <ArtifactCard
              title="Call Prep Brief"
              date="Dec 12, 2025"
              type="prep"
            />
            <ArtifactCard
              title="Draft Email - VC Intro"
              date="Dec 10, 2025"
              type="email"
            />
            <ArtifactCard
              title="Meeting Summary"
              date="Dec 10, 2025"
              type="summary"
            />
          </div>
        </TabsContent>

        <TabsContent value="suggestions" className="flex-1 m-0 p-4 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-medium">AI Suggestions</h3>
            </div>

            <SuggestionCard
              priority="high"
              title="Schedule follow-up call"
              description="It's been 3 days since last contact with Mikaela."
              action="Schedule"
            />
            <SuggestionCard
              priority="medium"
              title="Review valuation expectations"
              description="Potential mismatch between $6M ask and $24K ARR."
              action="Add Note"
            />
            <SuggestionCard
              priority="low"
              title="Update deal stage"
              description="Consider moving to 'Negotiation' based on recent activity."
              action="Update"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ArtifactCard({
  title,
  date,
  type
}: {
  title: string;
  date: string;
  type: 'prep' | 'email' | 'summary';
}) {
  const icons = {
    prep: ClipboardList,
    email: Mail,
    summary: FileText,
  };
  const Icon = icons[type];

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="py-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">{title}</p>
            <p className="text-xs text-muted-foreground">{date}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SuggestionCard({
  priority,
  title,
  description,
  action,
}: {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
}) {
  const priorityColors = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  };

  return (
    <Card>
      <CardContent className="py-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge
              variant="secondary"
              className={priorityColors[priority]}
            >
              {priority}
            </Badge>
            <Button variant="outline" size="sm">
              {action}
            </Button>
          </div>
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
