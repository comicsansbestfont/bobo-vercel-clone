'use client';

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { AppSidebar } from '@/components/ui/app-sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  ActivityIcon,
  ActivityCard,
  QuickActionButton,
  PropertyItem,
  StageIndicator,
  ContactCard,
  type Activity,
  type Stage,
  type Contact,
  type Property,
} from '@/components/crm';
import {
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckSquare,
  Sparkles,
  MoreHorizontal,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Globe,
  Building2,
  User,
  Send,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  PanelLeftClose,
  PanelRightClose,
  Link2,
  Users,
  FolderOpen,
  Target,
  TrendingUp,
  Command,
  Info,
  MessageCircle,
  Linkedin,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Types (page-specific, shared types imported from @/components/crm) ---

interface EngagementData {
  engagement_id: string;
  engagement_name: string;
  stage: string;
  engagement_type: string;
  arr_estimate: string;
  mrr_current: string;
  active_customers: number;
  current_gtm_stage: string;
  team_size: number;
  fit_assessment: string;
  coachability: string;
  lead_source: string;
  first_contact_date: string;
  lost_reason: string | null;
  company_id: string;
  company_name: string;
  website: string;
  industry: string;
  address: { city: string; state: string; country: string };
  linkedin_url: string | null;
  // New unified schema fields
  account_stage: 'lead' | 'deal' | 'client';
  sub_stage: string;
}

interface Meeting {
  id: string;
  title: string;
  meeting_type: string;
  channel: string;
  started_at: string;
  duration_mins: number;
  purpose: string;
  summary: string;
  outcome: string;
  key_points: Array<{ point: string; category: string }>;
  action_items: Array<{ task: string; status: string; assignee: string }>;
}

interface ThreadMessage {
  date: string;
  direction: 'inbound' | 'outbound';
  from: string;
  to?: string;
  subject?: string;
  body_preview: string;
  body?: string;
}

interface Thread {
  id: string;
  channel: string;
  subject: string;
  started_at: string;
  last_message_at: string;
  message_count: number;
  messages?: ThreadMessage[];
}

interface StageHistoryItem {
  id: string;
  from_stage: string | null;
  to_stage: string;
  changed_at: string;
  notes: string;
}

interface Note {
  id: string;
  title: string;
  body: string;
  note_type: string;
  created_at: string;
}

interface Research {
  id: string;
  research_content: {
    company_background?: string;
    awards_recognition?: string[];
    market_analysis?: {
      market?: string;
      total_hospitality_industry?: string;
      fast_food_takeaway_target?: string;
      market_composition?: string;
      key_trends?: string[];
      problem_being_solved?: string;
    };
    product_analysis?: {
      core_value_prop?: string;
      platform_components?: string[];
      key_differentiator?: string;
      product_maturity?: string;
    };
    business_model?: {
      revenue_streams?: Array<{ stream: string; model: string; status: string }>;
      pricing_philosophy?: string;
    };
    growth_signals?: {
      traction_metrics?: Record<string, string>;
      case_studies?: Array<{ venue: string; gmv_12m: string; avg_spend: string; repeat_rate: string }>;
      revenue_impact_evidence?: string[];
    };
    key_stakeholders?: {
      founders?: Array<{ name: string; role: string; age?: number; background: string }>;
      dev_team?: string;
      key_references?: Array<{ name: string; role: string; notes: string }>;
    };
    competitive_landscape?: {
      competitors?: Array<{ name: string; scale: string; advantage: string; pricing: string; threat: string }>;
      mytab_competitive_advantages?: string[];
      positioning_gap?: string;
    };
    tldr?: string[];
  };
  research_text: string;
  research_sources: string[];
  research_date: string;
  last_researched_at: string;
}

// --- Helper Functions ---

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(num);
}

function getStageColor(stage: string): string {
  const colors: Record<string, string> = {
    // Lead sub_stages
    'new_opportunity': 'bg-gray-100 text-gray-700',
    'triage': 'bg-yellow-100 text-yellow-700',
    'deep_dive': 'bg-orange-100 text-orange-700',
    // Deal sub_stages
    'relationship_dev': 'bg-cyan-100 text-cyan-700',
    'proposal_presented': 'bg-blue-100 text-blue-700',
    'contract_sent': 'bg-indigo-100 text-indigo-700',
    'finalising_terms': 'bg-purple-100 text-purple-700',
    // Client sub_stages
    'active': 'bg-green-100 text-green-700',
    'on_hold': 'bg-amber-100 text-amber-700',
    'completed': 'bg-emerald-100 text-emerald-700',
    // Terminal
    'closed_lost': 'bg-red-100 text-red-700',
    // Legacy support
    'New Opportunity': 'bg-gray-100 text-gray-700',
    'Triage & Qualification': 'bg-yellow-100 text-yellow-700',
    'Deep Dive & Diagnosis': 'bg-orange-100 text-orange-700',
    'Relationship Development': 'bg-cyan-100 text-cyan-700',
    'Closed Lost': 'bg-red-100 text-red-700',
  };
  return colors[stage] || 'bg-gray-100 text-gray-700';
}

function formatSubStage(subStage: string): string {
  const labels: Record<string, string> = {
    'new_opportunity': 'New Opportunity',
    'triage': 'Triage & Qualification',
    'deep_dive': 'Deep Dive & Diagnosis',
    'relationship_dev': 'Relationship Development',
    'proposal_presented': 'Proposal Presented',
    'contract_sent': 'Contract Sent',
    'finalising_terms': 'Finalising Terms',
    'active': 'Active',
    'on_hold': 'On Hold',
    'completed': 'Completed',
    'closed_lost': 'Closed Lost',
  };
  return labels[subStage] || subStage;
}

// --- Main Page Component ---

function MyTabDealWorkspaceContent() {
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('activity');
  const [chatInput, setChatInput] = useState('');
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const [mobileAIOpen, setMobileAIOpen] = useState(false);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());

  const toggleThreadExpanded = useCallback((threadId: string) => {
    setExpandedThreads(prev => {
      const next = new Set(prev);
      if (next.has(threadId)) {
        next.delete(threadId);
      } else {
        next.add(threadId);
      }
      return next;
    });
  }, []);

  // Data state
  const [engagement, setEngagement] = useState<EngagementData | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [stageHistory, setStageHistory] = useState<StageHistoryItem[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [research, setResearch] = useState<Research | null>(null);
  const [loading, setLoading] = useState(true);

  const toggleLeftPanel = useCallback(() => setLeftPanelOpen(prev => !prev), []);
  const toggleRightPanel = useCallback(() => setRightPanelOpen(prev => !prev), []);

  // Fetch data on mount
  useEffect(() => {
    async function fetchData() {
      const companyId = 'b4b19698-6d4f-451a-9bc6-c7f790654869';

      try {
        const response = await fetch(`/api/crm/engagement/${companyId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch engagement');
        }

        const data = await response.json();

        if (data.engagement) {
          const engData = data.engagement;
          const company = engData.companies as {
            id: string;
            name: string;
            website: string;
            industry: string;
            address: { city: string; state: string; country: string };
            linkedin_url: string | null;
          };
          setEngagement({
            engagement_id: engData.id,
            engagement_name: engData.name,
            stage: engData.stage,
            engagement_type: engData.engagement_type,
            arr_estimate: engData.arr_estimate,
            mrr_current: engData.mrr_current,
            active_customers: engData.active_customers,
            current_gtm_stage: engData.current_gtm_stage,
            team_size: engData.team_size,
            fit_assessment: engData.fit_assessment,
            coachability: engData.coachability,
            lead_source: engData.lead_source,
            first_contact_date: engData.first_contact_date,
            lost_reason: engData.lost_reason,
            company_id: company.id,
            company_name: company.name,
            website: company.website,
            industry: company.industry,
            address: company.address,
            linkedin_url: company.linkedin_url,
            account_stage: engData.account_stage || 'lead',
            sub_stage: engData.sub_stage || 'new_opportunity',
          });
        }

        if (data.contacts) setContacts(data.contacts);
        if (data.meetings) setMeetings(data.meetings as Meeting[]);
        if (data.threads) setThreads(data.threads);
        if (data.stageHistory) setStageHistory(data.stageHistory);
        if (data.notes) setNotes(data.notes as Note[]);
        if (data.research) setResearch(data.research as Research);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Transform data for UI
  const aboutProperties: Property[] = engagement ? [
    { label: 'Founder', value: contacts.find(c => c.is_primary)?.name || 'N/A', icon: User },
    { label: 'Lead Source', value: engagement.lead_source?.replace('_', ' ') || 'N/A', icon: Link2 },
    { label: 'First Contact', value: engagement.first_contact_date ? formatDate(engagement.first_contact_date) : 'N/A', icon: Calendar },
    { label: 'GTM Stage', value: engagement.current_gtm_stage || 'N/A', icon: Target },
    { label: 'Fit Assessment', value: engagement.fit_assessment?.replace('_', ' ') || 'N/A', icon: TrendingUp },
    { label: 'Coachability', value: engagement.coachability || 'N/A', icon: CheckCircle },
  ] : [];

  const companyProperties: Property[] = engagement ? [
    { label: 'Website', value: engagement.website?.replace('https://', '') || 'N/A', icon: Globe },
    { label: 'LinkedIn', value: engagement.linkedin_url ? (
      <a href={engagement.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
        Company Page
      </a>
    ) : 'N/A', icon: Linkedin },
    { label: 'Industry', value: engagement.industry || 'N/A', icon: Building2 },
    { label: 'Location', value: engagement.address ? `${engagement.address.city}, ${engagement.address.state}` : 'N/A', icon: Target },
    { label: 'Team Size', value: engagement.team_size?.toString() || 'N/A', icon: Users },
    { label: 'Active Customers', value: engagement.active_customers?.toString() || 'N/A', icon: Users },
  ] : [];

  // Convert stage history to stages array
  const stages: Stage[] = stageHistory.map((sh, index) => ({
    id: sh.id,
    name: sh.to_stage,
    date: formatDate(sh.changed_at),
    isCurrent: index === stageHistory.length - 1,
  }));

  // Build activities from meetings and threads only (notes filtered out per user request)
  // Note: We store sortDate (raw ISO timestamp) for accurate sorting since
  // formatDate() loses time information, causing same-day activities to sort incorrectly

  // Create a map of thread IDs to thread data for expandable messages
  const threadDataMap = new Map(threads.map(t => [t.id, t]));

  const activities: (Activity & { threadData?: Thread })[] = [
    ...meetings.map(m => ({
      id: m.id,
      type: 'meeting' as const,
      title: m.title,
      date: formatDate(m.started_at),
      time: formatTime(m.started_at),
      sortDate: m.started_at, // Raw timestamp for sorting
      content: m.summary,
      metadata: {
        duration: `${m.duration_mins}m`,
        outcome: m.outcome,
        channel: m.channel,
      },
    })),
    ...threads.map(t => ({
      id: t.id,
      type: t.channel as Activity['type'],
      title: t.subject,
      date: formatDate(t.last_message_at),
      time: formatTime(t.last_message_at),
      sortDate: t.last_message_at, // Raw timestamp for sorting
      content: `${t.message_count} messages`,
      metadata: {
        channel: t.channel,
        messages: `${t.message_count} msgs`,
      },
      threadData: t, // Include full thread data for expandable messages
    })),
    // Notes excluded from activity feed - available in Notes tab
  ].sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime());

  // Get action items from meetings
  const pendingActionItems = meetings
    .flatMap(m => m.action_items || [])
    .filter(ai => ai.status === 'pending')
    .slice(0, 3);

  if (loading) {
    return (
      <AppSidebar>
        <div className="flex items-center justify-center h-screen">
          <div className="text-muted-foreground">Loading MyTab workspace...</div>
        </div>
      </AppSidebar>
    );
  }

  if (!engagement) {
    return (
      <AppSidebar>
        <div className="flex items-center justify-center h-screen">
          <div className="text-muted-foreground">Company not found</div>
        </div>
      </AppSidebar>
    );
  }

  // Left Panel Content
  const LeftPanelContent = () => (
    <div className="p-4 md:p-3 space-y-6">
      {/* Deal Summary Card */}
      <div className="p-4 md:p-3 rounded-lg bg-background border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold">{formatCurrency(engagement.arr_estimate)}</span>
          <Badge variant="outline" className="font-normal">
            ARR
          </Badge>
        </div>
        <div className="space-y-2.5 md:space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">MRR</span>
            <span className="font-medium">{formatCurrency(engagement.mrr_current)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Customers</span>
            <span className="font-medium">{engagement.active_customers}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Team</span>
            <span className="font-medium">{engagement.team_size} people</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* About Section */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          About
        </h3>
        <div className="space-y-0.5">
          {aboutProperties.map((prop, i) => (
            <PropertyItem key={i} {...prop} />
          ))}
        </div>
      </div>

      <Separator />

      {/* Company Info */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Company
        </h3>
        <div className="space-y-0.5">
          {companyProperties.map((prop, i) => (
            <PropertyItem key={i} {...prop} />
          ))}
        </div>
      </div>

      <Separator />

      {/* Contacts */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Contacts ({contacts.length})
          </h3>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-1">
          {contacts.map(contact => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
        </div>
      </div>

      <Separator />

      {/* Assessment Tags */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Assessment
        </h3>
        <div className="flex flex-wrap gap-2">
          {engagement.fit_assessment === 'strong_fit' && (
            <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 py-1">
              <CheckCircle className="w-3 h-3 mr-1" />
              Strong Fit
            </Badge>
          )}
          {engagement.fit_assessment === 'uncertain' && (
            <Badge className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 py-1">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Uncertain Fit
            </Badge>
          )}
          {engagement.coachability === 'high' && (
            <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 py-1">
              <CheckCircle className="w-3 h-3 mr-1" />
              High Coachability
            </Badge>
          )}
          {engagement.stage === 'closed_lost' && (
            <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 py-1">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Closed Lost
            </Badge>
          )}
        </div>
      </div>

      <Separator />

      {/* Files */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Files
          </h3>
          <Button variant="ghost" size="sm" className="h-6 text-xs">
            Browse
          </Button>
        </div>
        <div className="space-y-1">
          {['Meetings', 'Communications', 'Documents'].map(folder => (
            <div
              key={folder}
              className="flex items-center gap-2 py-2.5 md:py-1.5 px-2 -mx-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <FolderOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{folder}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Right Panel Content
  const RightPanelContent = () => (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Chat Messages */}
          <div className="space-y-4">
            {/* User message */}
            <div className="flex flex-col items-end">
              <div className="bg-blue-600 text-white text-sm px-3 py-2 rounded-2xl rounded-tr-md max-w-[85%]">
                Brief me on this company
              </div>
              <span className="text-[10px] text-muted-foreground mt-1">10:30 AM</span>
            </div>

            {/* AI response */}
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2 mb-1.5">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="bg-purple-600 text-white text-[9px]">
                    AI
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium text-muted-foreground">Bobo</span>
              </div>
              <div className="bg-muted/50 text-sm px-3 py-3 rounded-2xl rounded-tl-md max-w-[95%] space-y-2">
                <p><strong>{engagement.company_name}</strong> is a {engagement.industry} startup at the <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium', getStageColor(engagement.stage))}>{formatSubStage(engagement.stage)}</span> stage.</p>
                <ul className="text-muted-foreground space-y-1 text-sm">
                  <li>• ARR: {formatCurrency(engagement.arr_estimate)}</li>
                  <li>• Founder: {contacts.find(c => c.is_primary)?.name}</li>
                  <li>• GTM Stage: {engagement.current_gtm_stage}</li>
                  <li>• {engagement.active_customers} active customers</li>
                </ul>
                {engagement.lost_reason && (
                  <p className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded">
                    <strong>Closed Reason:</strong> {engagement.lost_reason.substring(0, 100)}...
                  </p>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground mt-1">10:30 AM</span>
            </div>
          </div>

          <Separator />

          {/* Pending Action Items */}
          {pendingActionItems.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Pending Actions
              </h3>
              <div className="space-y-2">
                {pendingActionItems.map((action, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-3 md:p-2 rounded-lg border hover:border-purple-200 hover:bg-purple-50/50 cursor-pointer transition-colors group"
                  >
                    <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-orange-400" />
                    <div className="flex-1">
                      <span className="text-sm">{action.task}</span>
                      <span className="text-xs text-muted-foreground ml-2">({action.assignee})</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </ScrollArea>

      {/* Chat Input */}
      <div className="p-3 border-t shrink-0">
        <div className="relative">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="w-full bg-muted/30 border rounded-lg pl-3 pr-10 py-3 md:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300 transition-all placeholder:text-muted-foreground"
            placeholder="Ask about this company..."
          />
          <Button
            size="icon"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 md:h-7 md:w-7 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
          >
            <Send className="w-4 h-4 md:w-3.5 md:h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <AppSidebar>
      <div className="flex h-[100dvh] flex-col bg-background overflow-hidden">

        {/* Header */}
        <header className="h-14 md:h-12 border-b flex items-center justify-between px-3 md:px-4 shrink-0 bg-background z-20 safe-area-inset-top">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 md:h-8 md:w-auto md:gap-1.5 md:px-2 text-muted-foreground hover:text-foreground shrink-0"
              onClick={() => window.history.back()}
            >
              <ChevronLeft className="w-5 h-5 md:w-4 md:h-4" />
              <span className="hidden md:inline text-sm">Pipeline</span>
            </Button>

            <div className="hidden md:block h-4 w-px bg-border" />

            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 md:w-7 md:h-7 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 md:w-3.5 md:h-3.5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-semibold flex items-center gap-2 truncate">
                  {engagement.company_name}
                  <Badge
                    className={cn('font-normal text-[10px] h-5', getStageColor(engagement.stage))}
                  >
                    {formatSubStage(engagement.stage)}
                  </Badge>
                </h1>
                <p className="text-xs text-muted-foreground md:hidden">{formatCurrency(engagement.arr_estimate)} ARR</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            <div className="hidden lg:flex items-center gap-1 text-xs text-muted-foreground mr-2">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>

            <Button variant="ghost" size="icon" className="h-9 w-9 md:h-8 md:w-8">
              <MoreHorizontal className="w-5 h-5 md:w-4 md:h-4" />
            </Button>

            {engagement.engagement_type === 'deal' && !['closed_won', 'closed_lost'].includes(engagement.stage) && (
              <Button
                size="sm"
                className="hidden md:flex h-8 bg-green-600 hover:bg-green-700 text-white gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Convert to Client
              </Button>
            )}
          </div>
        </header>

        {/* Main Workspace */}
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT PANEL */}
          <aside className={cn(
            'hidden md:flex border-r flex-col bg-muted/5 transition-all duration-200',
            leftPanelOpen ? 'w-[280px]' : 'w-0 overflow-hidden'
          )}>
            <div className="flex items-center justify-between h-10 px-3 border-b">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Details
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={toggleLeftPanel}
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <LeftPanelContent />
            </ScrollArea>
          </aside>

          {!leftPanelOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex h-8 w-8 absolute left-12 top-14 z-10"
              onClick={toggleLeftPanel}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}

          {/* CENTER PANEL */}
          <main className="flex-1 flex flex-col min-w-0 bg-background">

            {/* Quick Actions Bar */}
            <div className="border-b px-2 md:px-4 py-2 md:py-0 md:h-12 flex items-center justify-between bg-background shrink-0">
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide md:overflow-visible">
                <QuickActionButton icon={Phone} label="Call" color="text-blue-600" />
                <QuickActionButton icon={Mail} label="Email" color="text-purple-600" />
                <QuickActionButton icon={Calendar} label="Meet" color="text-orange-600" />
                <QuickActionButton icon={FileText} label="Note" color="text-gray-600" />
                <QuickActionButton icon={CheckSquare} label="Task" color="text-green-600" />
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden md:block">
                <TabsList className="h-8 bg-muted/50 p-0.5">
                  <TabsTrigger value="activity" className="h-7 text-xs px-3 data-[state=active]:shadow-sm">
                    Activity ({activities.length})
                  </TabsTrigger>
                  <TabsTrigger value="overview" className="h-7 text-xs px-3 data-[state=active]:shadow-sm">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="h-7 text-xs px-3 data-[state=active]:shadow-sm">
                    Notes ({notes.length})
                  </TabsTrigger>
                  <TabsTrigger value="research" className="h-7 text-xs px-3 data-[state=active]:shadow-sm">
                    Research
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Content Area */}
            <ScrollArea className="flex-1">
              <div className="max-w-3xl mx-auto p-4 md:p-6 pb-24 md:pb-6">

                {/* Mobile Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="md:hidden mb-4">
                  <TabsList className="w-full h-10 bg-muted/50 p-1">
                    <TabsTrigger value="activity" className="flex-1 h-8 text-sm data-[state=active]:shadow-sm">
                      Activity
                    </TabsTrigger>
                    <TabsTrigger value="overview" className="flex-1 h-8 text-sm data-[state=active]:shadow-sm">
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="flex-1 h-8 text-sm data-[state=active]:shadow-sm">
                      Notes
                    </TabsTrigger>
                    <TabsTrigger value="research" className="flex-1 h-8 text-sm data-[state=active]:shadow-sm">
                      Research
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <Tabs value={activeTab} className="space-y-4 md:space-y-6">

                  <TabsContent value="activity" className="mt-0 space-y-4 md:space-y-6">

                    {/* Status Card for Closed Lost */}
                    {engagement.stage === 'closed_lost' && engagement.lost_reason && (
                      <div className="p-4 rounded-xl md:rounded-lg bg-red-50 border border-red-100">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-red-900 mb-1">
                              Closed Lost
                            </h3>
                            <p className="text-sm text-red-700">
                              {engagement.lost_reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Activity Timeline */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-medium text-foreground">
                          Activity
                          <span className="text-muted-foreground font-normal ml-2">
                            {activities.length} items
                          </span>
                        </h2>
                      </div>

                      <div className="space-y-0">
                        {activities.map(activity => {
                          // For threads (email/linkedin), show expandable with messages
                          if (activity.threadData && activity.threadData.messages && activity.threadData.messages.length > 0) {
                            const isExpanded = expandedThreads.has(String(activity.id));
                            const thread = activity.threadData;
                            return (
                              <div key={activity.id} className="border-b last:border-b-0">
                                {/* Thread header - clickable to expand */}
                                <button
                                  onClick={() => toggleThreadExpanded(String(activity.id))}
                                  className="w-full p-4 flex items-start gap-3 text-left hover:bg-muted/50 transition-colors"
                                >
                                  <div className="mt-1">
                                    <ActivityIcon type={activity.type} className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="text-sm font-medium truncate">{activity.title}</h4>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                      <span>{activity.date}</span>
                                      <span>,</span>
                                      <span>{activity.time}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary" className="text-[10px]">{activity.type}</Badge>
                                      <Badge variant="outline" className="text-[10px]">{thread.message_count} msgs</Badge>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  </div>
                                </button>

                                {/* Expanded messages */}
                                {isExpanded && thread.messages && (
                                  <div className="bg-muted/30 border-t">
                                    {thread.messages.map((msg, idx) => (
                                      <div key={idx} className="p-3 pl-12 border-b last:border-b-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          {msg.direction === 'inbound' ? (
                                            <ArrowDownLeft className="h-3 w-3 text-blue-500" />
                                          ) : (
                                            <ArrowUpRight className="h-3 w-3 text-green-500" />
                                          )}
                                          <span className="text-xs font-medium">{msg.from}</span>
                                          <span className="text-xs text-muted-foreground">
                                            {formatDate(msg.date)}, {formatTime(msg.date)}
                                          </span>
                                        </div>
                                        {msg.subject && (
                                          <div className="text-xs font-medium text-muted-foreground mb-1">
                                            Subject: {msg.subject}
                                          </div>
                                        )}
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                          {msg.body_preview}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          }

                          // For meetings and other non-thread activities, use standard ActivityCard
                          return <ActivityCard key={activity.id} activity={activity} />;
                        })}
                      </div>
                    </div>

                    {/* Stage History */}
                    <div className="p-4 rounded-xl md:rounded-lg border bg-muted/5">
                      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                        Stage History
                      </h3>
                      <StageIndicator stages={stages} />
                    </div>

                  </TabsContent>

                  <TabsContent value="overview" className="mt-0">
                    <div className="space-y-6">
                      {/* Key Points from Meetings */}
                      {meetings.length > 0 && meetings[0].key_points && (
                        <div className="p-4 rounded-lg border">
                          <h3 className="text-sm font-medium mb-3">Key Insights</h3>
                          <div className="space-y-2">
                            {meetings.flatMap(m => m.key_points || []).slice(0, 6).map((kp, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm">
                                <Badge variant="outline" className="text-[10px] shrink-0">
                                  {kp.category}
                                </Badge>
                                <span className="text-muted-foreground">{kp.point}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="notes" className="mt-0">
                    <div className="space-y-4">
                      {notes.map(note => (
                        <div key={note.id} className="p-4 rounded-lg border">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-[10px]">
                              {note.note_type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(note.created_at)}
                            </span>
                          </div>
                          <h3 className="text-sm font-medium mb-2">{note.title}</h3>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {note.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="research" className="mt-0">
                    {research ? (
                      <div className="space-y-6">
                        {/* Research Meta */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Researched: {research.research_date ? formatDate(research.research_date) : 'Unknown'}</span>
                          <span>Sources: {research.research_sources?.join(', ')}</span>
                        </div>

                        {/* TLDR */}
                        {research.research_content.tldr && (
                          <div className="p-4 rounded-lg border bg-muted/30">
                            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                              <Lightbulb className="w-4 h-4 text-yellow-600" />
                              TLDR
                            </h3>
                            <ul className="space-y-2">
                              {research.research_content.tldr.map((item, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="text-muted-foreground/60">•</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Company Background */}
                        {research.research_content.company_background && (
                          <div className="p-4 rounded-lg border">
                            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                              <Building2 className="w-4 h-4" />
                              Company Background
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {research.research_content.company_background}
                            </p>
                            {research.research_content.awards_recognition && (
                              <div className="mt-3">
                                <span className="text-xs font-medium text-muted-foreground uppercase">Awards & Recognition</span>
                                <ul className="mt-1 space-y-1">
                                  {research.research_content.awards_recognition.map((award, i) => (
                                    <li key={i} className="text-xs text-muted-foreground">• {award}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Founders */}
                        {research.research_content.key_stakeholders?.founders && (
                          <div className="p-4 rounded-lg border">
                            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              Founders
                            </h3>
                            <div className="space-y-3">
                              {research.research_content.key_stakeholders.founders.map((founder, i) => (
                                <div key={i} className="flex items-start gap-3">
                                  <Avatar className="w-8 h-8">
                                    <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                                      {founder.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="text-sm font-medium">{founder.name}</div>
                                    <div className="text-xs text-muted-foreground">{founder.role}{founder.age ? `, ${founder.age}` : ''}</div>
                                    <div className="text-xs text-muted-foreground mt-1">{founder.background}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Market Analysis */}
                        {research.research_content.market_analysis && (
                          <div className="p-4 rounded-lg border">
                            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                              <Target className="w-4 h-4" />
                              Market Analysis
                            </h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              {research.research_content.market_analysis.market && (
                                <div>
                                  <span className="text-xs text-muted-foreground">Market</span>
                                  <div className="font-medium">{research.research_content.market_analysis.market}</div>
                                </div>
                              )}
                              {research.research_content.market_analysis.fast_food_takeaway_target && (
                                <div>
                                  <span className="text-xs text-muted-foreground">Target Segment</span>
                                  <div className="font-medium">{research.research_content.market_analysis.fast_food_takeaway_target}</div>
                                </div>
                              )}
                            </div>
                            {research.research_content.market_analysis.problem_being_solved && (
                              <div className="mt-3 p-2 bg-muted/30 rounded text-xs text-muted-foreground">
                                <span className="font-medium">Problem:</span> {research.research_content.market_analysis.problem_being_solved}
                              </div>
                            )}
                            {research.research_content.market_analysis.key_trends && (
                              <div className="mt-3">
                                <span className="text-xs font-medium text-muted-foreground uppercase">Key Trends</span>
                                <ul className="mt-1 space-y-1">
                                  {research.research_content.market_analysis.key_trends.map((trend, i) => (
                                    <li key={i} className="text-xs text-muted-foreground">• {trend}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Competitive Landscape */}
                        {research.research_content.competitive_landscape?.competitors && (
                          <div className="p-4 rounded-lg border">
                            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                              <TrendingUp className="w-4 h-4" />
                              Competitive Landscape
                            </h3>
                            <div className="space-y-2">
                              {research.research_content.competitive_landscape.competitors.map((comp, i) => (
                                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                                  <div>
                                    <div className="text-sm font-medium">{comp.name}</div>
                                    <div className="text-xs text-muted-foreground">{comp.scale}</div>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[10px]",
                                      comp.threat === 'HIGH' && 'border-red-200 text-red-700 bg-red-50',
                                      comp.threat === 'MEDIUM' && 'border-yellow-200 text-yellow-700 bg-yellow-50',
                                      comp.threat === 'LOW' && 'border-green-200 text-green-700 bg-green-50',
                                    )}
                                  >
                                    {comp.threat}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                            {research.research_content.competitive_landscape.mytab_competitive_advantages && (
                              <div className="mt-4">
                                <span className="text-xs font-medium text-green-700">Competitive Advantages</span>
                                <ul className="mt-1 space-y-1">
                                  {research.research_content.competitive_landscape.mytab_competitive_advantages.map((adv, i) => (
                                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                                      <CheckCircle className="w-3 h-3 text-green-600 shrink-0 mt-0.5" />
                                      {adv}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Growth Signals */}
                        {research.research_content.growth_signals?.case_studies && (
                          <div className="p-4 rounded-lg border">
                            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                              <DollarSign className="w-4 h-4" />
                              Traction Case Studies
                            </h3>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-muted-foreground border-b">
                                    <th className="text-left py-2 font-medium">Venue</th>
                                    <th className="text-right py-2 font-medium">12M GMV</th>
                                    <th className="text-right py-2 font-medium">Avg Spend</th>
                                    <th className="text-right py-2 font-medium">Repeat Rate</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {research.research_content.growth_signals.case_studies.map((cs, i) => (
                                    <tr key={i} className="border-b last:border-0">
                                      <td className="py-2 font-medium">{cs.venue}</td>
                                      <td className="py-2 text-right">{cs.gmv_12m}</td>
                                      <td className="py-2 text-right">{cs.avg_spend}</td>
                                      <td className="py-2 text-right">{cs.repeat_rate}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-sm text-muted-foreground">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        No deep research available yet
                      </div>
                    )}
                  </TabsContent>

                </Tabs>

              </div>
            </ScrollArea>
          </main>

          {!rightPanelOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex h-8 w-8 absolute right-12 top-14 z-10"
              onClick={toggleRightPanel}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}

          {/* RIGHT PANEL */}
          <aside className={cn(
            'hidden md:flex border-l flex-col bg-background transition-all duration-200',
            rightPanelOpen ? 'w-[360px]' : 'w-0 overflow-hidden'
          )}>
            <div className="flex items-center justify-between h-12 px-4 border-b shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium">Bobo Assistant</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={toggleRightPanel}
              >
                <PanelRightClose className="w-3.5 h-3.5" />
              </Button>
            </div>

            <RightPanelContent />
          </aside>

        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t safe-area-inset-bottom z-30">
          <div className="flex items-center justify-around h-16 px-4">
            <Sheet open={mobileDetailsOpen} onOpenChange={setMobileDetailsOpen}>
              <SheetTrigger asChild>
                <button className="flex flex-col items-center gap-1 py-2 px-4 text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="w-5 h-5" />
                  <span className="text-[10px] font-medium">Details</span>
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] sm:w-[350px] p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="text-left">Company Details</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-60px)]">
                  <LeftPanelContent />
                </ScrollArea>
              </SheetContent>
            </Sheet>

            {engagement.engagement_type === 'deal' && !['closed_won', 'closed_lost'].includes(engagement.stage) && (
              <button className="flex flex-col items-center gap-1 py-2 px-4 text-green-600 hover:text-green-700 transition-colors">
                <CheckCircle className="w-5 h-5" />
                <span className="text-[10px] font-medium">Convert to Client</span>
              </button>
            )}

            <Sheet open={mobileAIOpen} onOpenChange={setMobileAIOpen}>
              <SheetTrigger asChild>
                <button className="flex flex-col items-center gap-1 py-2 px-4 text-purple-600 hover:text-purple-700 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-[10px] font-medium">Bobo</span>
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] sm:w-[400px] p-0 flex flex-col">
                <SheetHeader className="p-4 border-b shrink-0">
                  <SheetTitle className="text-left flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    Bobo Assistant
                  </SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-hidden">
                  <RightPanelContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

      </div>
    </AppSidebar>
  );
}

export default function MyTabDealWorkspacePage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading company workspace...</div>}>
      <MyTabDealWorkspaceContent />
    </Suspense>
  );
}
