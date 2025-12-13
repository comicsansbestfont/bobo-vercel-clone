'use client';

import React, { useState, useCallback, Suspense } from 'react';
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
} from '@/components/ui/sheet';
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputButton,
  PromptInputSubmit,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input';
import {
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
  Globe,
  Building2,
  User,
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
  Mic,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Mock Data ---

const dealData = {
  name: 'MyTab',
  stage: 'Proposal',
  amount: '$45,000',
  closeDate: 'Jan 15, 2026',
  pipeline: 'SaaS Advisory',
  owner: 'Sachee Perera',
  probability: 60,
};

const companyData = {
  website: 'mytab.app',
  industry: 'Hospitality Tech',
  location: 'Perth, WA',
  employees: '4',
};

const aboutProperties: Property[] = [
  { label: 'Founder', value: 'Mikaela Greene', icon: User },
  { label: 'Lead Source', value: 'LinkedIn', icon: Link2 },
  { label: 'First Contact', value: 'Nov 6, 2025', icon: Calendar },
  { label: 'Current Stage', value: 'Early Traction', icon: Target },
  { label: 'Engagement', value: 'Advisory Retainer', icon: TrendingUp },
];

const contacts: Contact[] = [
  { id: '1', name: 'Mikaela Greene', role: 'Founder & CEO', email: 'mikaela@mytab.app', initials: 'MG' },
  { id: '2', name: 'James Wilson', role: 'CTO', email: 'james@mytab.app', initials: 'JW' },
];

const stageHistory: Stage[] = [
  { id: '1', name: 'New Opportunity', date: 'Nov 6' },
  { id: '2', name: 'Triage', date: 'Nov 8' },
  { id: '3', name: 'Deep Dive', date: 'Nov 15' },
  { id: '4', name: 'Relationship', date: 'Dec 2' },
  { id: '5', name: 'Proposal', date: 'Dec 10', isCurrent: true },
  { id: '6', name: 'Contract' },
  { id: '7', name: 'Won' },
];

const activities: Activity[] = [
  {
    id: 1,
    type: 'call',
    title: 'Call with Mikaela Greene',
    date: 'Today',
    time: '2:30 PM',
    sortDate: '2025-12-13T14:30:00Z',
    content: 'Discussed pitch deck revisions and valuation model. Mikaela presented updated projections.',
    metadata: { duration: '45m', outcome: 'Positive' },
  },
  {
    id: 2,
    type: 'email',
    title: 'Deck review and feedback',
    date: 'Dec 11',
    time: '4:15 PM',
    sortDate: '2025-12-11T16:15:00Z',
    content: 'Sent detailed feedback on investor deck. Highlighted strengths in product demo section.',
    metadata: { direction: 'Outbound', status: 'Opened' },
  },
  {
    id: 3,
    type: 'meeting',
    title: 'Pitch Practice Session',
    date: 'Dec 10',
    time: '3:00 PM',
    sortDate: '2025-12-10T15:00:00Z',
    content: 'Full pitch deck review with live app demo. Strong presentation style.',
    metadata: { duration: '1h 03m', attendees: '2' },
  },
  {
    id: 4,
    type: 'note',
    title: 'Competitor Analysis',
    date: 'Dec 8',
    time: '10:22 AM',
    sortDate: '2025-12-08T10:22:00Z',
    content: 'TabSquare just raised Series B at $40M valuation. MyTab differentiates on NFC ordering.',
  },
];

const suggestedActions = [
  { id: 1, text: 'Schedule follow-up call post-VC pitch', priority: 'high' },
  { id: 2, text: 'Draft VC intro email to Sarah', priority: 'high' },
  { id: 3, text: 'Review updated ARR projections', priority: 'medium' },
];

// --- Left Panel Content (Reusable for both desktop and mobile sheet) ---
const LeftPanelContent = () => (
  <div className="p-4 md:p-3 space-y-6">
    {/* Deal Summary Card */}
    <div className="p-4 md:p-3 rounded-lg bg-background border">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl font-bold">{dealData.amount}</span>
        <Badge variant="outline" className="font-normal">
          {dealData.probability}%
        </Badge>
      </div>
      <div className="space-y-2.5 md:space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Close Date</span>
          <span className="font-medium">{dealData.closeDate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Pipeline</span>
          <span className="font-medium">{dealData.pipeline}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Owner</span>
          <span className="font-medium">{dealData.owner}</span>
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
        <PropertyItem label="Website" value={companyData.website} icon={Globe} />
        <PropertyItem label="Industry" value={companyData.industry} icon={Building2} />
        <PropertyItem label="Location" value={companyData.location} icon={Target} />
        <PropertyItem label="Team Size" value={companyData.employees} icon={Users} />
      </div>
    </div>

    <Separator />

    {/* Contacts */}
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Contacts
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
        <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 py-1">
          <CheckCircle className="w-3 h-3 mr-1" />
          Strong Product
        </Badge>
        <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 py-1">
          <CheckCircle className="w-3 h-3 mr-1" />
          Market Traction
        </Badge>
        <Badge className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 py-1">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Unit Economics
        </Badge>
        <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 py-1">
          <AlertTriangle className="w-3 h-3 mr-1" />
          No Term Sheet
        </Badge>
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

// --- Right Panel Content (Reusable for both desktop and mobile sheet) ---
const RightPanelContent = ({
  chatInput,
  setChatInput,
  onSubmit
}: {
  chatInput: string;
  setChatInput: (v: string) => void;
  onSubmit: (message: PromptInputMessage) => void;
}) => (
  <div className="flex flex-col h-full">
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-4">
        {/* Chat Messages */}
        <div className="space-y-4">
          {/* User message */}
          <div className="flex flex-col items-end">
            <div className="bg-blue-600 text-white text-sm px-3 py-2 rounded-2xl rounded-tr-md max-w-[85%]">
              Brief me on this deal
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
              <p><strong>MyTab</strong> is a hospitality tech startup at the Proposal stage.</p>
              <ul className="text-muted-foreground space-y-1 text-sm">
                <li>• $45K advisory engagement</li>
                <li>• Founder: Mikaela Greene</li>
                <li>• VC pitch scheduled Dec 18</li>
                <li>• Watch: Unit economics story</li>
              </ul>
            </div>
            <span className="text-[10px] text-muted-foreground mt-1">10:30 AM</span>
          </div>
        </div>

        <Separator />

        {/* Suggested Actions */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Suggested Actions
          </h3>
          <div className="space-y-2">
            {suggestedActions.map(action => (
              <div
                key={action.id}
                className="flex items-start gap-2 p-3 md:p-2 rounded-lg border hover:border-purple-200 hover:bg-purple-50/50 cursor-pointer transition-colors group"
              >
                <div className={cn(
                  'w-2 h-2 rounded-full mt-1.5 shrink-0',
                  action.priority === 'high' ? 'bg-red-500' : 'bg-orange-400'
                )} />
                <span className="text-sm flex-1">{action.text}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Deal Health */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Deal Health
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Engagement</span>
                <span className="font-medium text-green-600">80%</span>
              </div>
              <div className="h-2 md:h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-4/5 bg-green-500 rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Momentum</span>
                <span className="font-medium text-yellow-600">60%</span>
              </div>
              <div className="h-2 md:h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-3/5 bg-yellow-500 rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Risk</span>
                <span className="font-medium text-orange-600">40%</span>
              </div>
              <div className="h-2 md:h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-2/5 bg-orange-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>

    {/* Chat Input - PromptInput Component */}
    <div className="p-3 border-t shrink-0">
      <PromptInput onSubmit={onSubmit} className="shadow-none border-0 p-0">
        <PromptInputBody className="border rounded-xl bg-muted/30">
          <PromptInputTextarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask about this deal..."
            className="min-h-[44px] max-h-[120px] text-sm py-3 px-3 resize-none"
          />
        </PromptInputBody>
        <PromptInputFooter className="mt-2 flex items-center justify-between">
          <PromptInputTools className="gap-1">
            <PromptInputButton variant="ghost" className="h-8 w-8 p-0">
              <Mic className="w-4 h-4" />
            </PromptInputButton>
          </PromptInputTools>
          <PromptInputSubmit className="h-8 w-8 bg-purple-600 hover:bg-purple-700" />
        </PromptInputFooter>
      </PromptInput>
    </div>
  </div>
);

// --- Floating Mobile Chat Input ---
const MobileChatInput = ({
  chatInput,
  setChatInput,
  onSubmit,
  onOpenDetails,
}: {
  chatInput: string;
  setChatInput: (v: string) => void;
  onSubmit: (message: PromptInputMessage) => void;
  onOpenDetails: () => void;
}) => (
  <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t safe-area-inset-bottom z-30">
    <div className="p-3">
      <PromptInput onSubmit={onSubmit} className="shadow-none border-0 p-0">
        <PromptInputBody className="border rounded-xl bg-muted/30">
          <PromptInputTextarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask Bobo about this deal..."
            className="min-h-[44px] max-h-[80px] text-sm py-3 px-3 resize-none"
          />
        </PromptInputBody>
        <PromptInputFooter className="mt-2 flex items-center justify-between">
          <PromptInputTools className="gap-1">
            <PromptInputButton
              variant="ghost"
              className="h-9 px-3 gap-1.5"
              onClick={(e) => {
                e.preventDefault();
                onOpenDetails();
              }}
            >
              <Info className="w-4 h-4" />
              <span className="text-xs">Details</span>
            </PromptInputButton>
          </PromptInputTools>
          <div className="flex items-center gap-2">
            <PromptInputButton variant="ghost" className="h-9 w-9 p-0">
              <Mic className="w-4 h-4" />
            </PromptInputButton>
            <PromptInputSubmit className="h-9 w-9 bg-purple-600 hover:bg-purple-700" />
          </div>
        </PromptInputFooter>
      </PromptInput>
    </div>
  </div>
);

function DealWorkspaceContent() {
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('activity');
  const [chatInput, setChatInput] = useState('');
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);

  const toggleLeftPanel = useCallback(() => setLeftPanelOpen(prev => !prev), []);
  const toggleRightPanel = useCallback(() => setRightPanelOpen(prev => !prev), []);

  const handleChatSubmit = useCallback((message: PromptInputMessage) => {
    console.log('Chat submitted:', message);
    setChatInput('');
    // Handle chat submission here
  }, []);

  return (
    <AppSidebar>
      <div className="flex h-[100dvh] flex-col bg-background overflow-hidden">

        {/* Header - Mobile Optimized */}
        <header className="h-14 md:h-12 border-b flex items-center justify-between px-3 md:px-4 shrink-0 bg-background z-20 safe-area-inset-top">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 md:h-8 md:w-auto md:gap-1.5 md:px-2 text-muted-foreground hover:text-foreground shrink-0"
            >
              <ChevronLeft className="w-5 h-5 md:w-4 md:h-4" />
              <span className="hidden md:inline text-sm">Deals</span>
            </Button>

            <div className="hidden md:block h-4 w-px bg-border" />

            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 md:w-7 md:h-7 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 md:w-3.5 md:h-3.5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-semibold flex items-center gap-2 truncate">
                  {dealData.name}
                  <Badge
                    variant="secondary"
                    className="font-normal text-[10px] h-5 bg-blue-50 text-blue-700 hover:bg-blue-100 shrink-0"
                  >
                    {dealData.stage}
                  </Badge>
                </h1>
                <p className="text-xs text-muted-foreground md:hidden">{dealData.amount}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            {/* Desktop keyboard shortcut hint */}
            <div className="hidden lg:flex items-center gap-1 text-xs text-muted-foreground mr-2">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>

            {/* Mobile: Mark Won button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 text-green-600"
            >
              <CheckCircle className="w-5 h-5" />
            </Button>

            <Button variant="ghost" size="icon" className="h-9 w-9 md:h-8 md:w-8">
              <MoreHorizontal className="w-5 h-5 md:w-4 md:h-4" />
            </Button>

            {/* Desktop only - Mark Won button */}
            <Button
              size="sm"
              className="hidden md:flex h-8 bg-green-600 hover:bg-green-700 text-white gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Mark Won
            </Button>
          </div>
        </header>

        {/* Main Workspace */}
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT PANEL - Desktop Only */}
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

          {/* Toggle button when left panel closed - Desktop only */}
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

          {/* CENTER PANEL - Timeline & Activity */}
          <main className="flex-1 flex flex-col min-w-0 bg-background">

            {/* Quick Actions Bar - Responsive */}
            <div className="border-b px-2 md:px-4 py-2 md:py-0 md:h-12 flex items-center justify-between bg-background shrink-0">
              {/* Mobile: Horizontal scroll actions */}
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide md:overflow-visible">
                <QuickActionButton icon={Phone} label="Call" color="text-blue-600" />
                <QuickActionButton icon={Mail} label="Email" color="text-purple-600" />
                <QuickActionButton icon={Calendar} label="Meet" color="text-orange-600" />
                <QuickActionButton icon={FileText} label="Note" color="text-gray-600" />
                <QuickActionButton icon={CheckSquare} label="Task" color="text-green-600" />
              </div>

              {/* Desktop only: Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden md:block">
                <TabsList className="h-8 bg-muted/50 p-0.5">
                  <TabsTrigger value="activity" className="h-7 text-xs px-3 data-[state=active]:shadow-sm">
                    Activity
                  </TabsTrigger>
                  <TabsTrigger value="overview" className="h-7 text-xs px-3 data-[state=active]:shadow-sm">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="h-7 text-xs px-3 data-[state=active]:shadow-sm">
                    Notes
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Content Area */}
            <ScrollArea className="flex-1">
              <div className="max-w-3xl mx-auto p-4 md:p-6 pb-32 md:pb-6">

                {/* Mobile: Tabs below quick actions */}
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
                  </TabsList>
                </Tabs>

                <Tabs value={activeTab} className="space-y-4 md:space-y-6">

                  <TabsContent value="activity" className="mt-0 space-y-4 md:space-y-6">

                    {/* AI Suggestion Card */}
                    <div className="p-4 rounded-xl md:rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                          <Lightbulb className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-blue-900 mb-1">
                            Suggested Next Step
                          </h3>
                          <p className="text-sm text-blue-700 mb-3">
                            It&apos;s been 3 days since your last call. Schedule a follow-up to discuss the term sheet.
                          </p>
                          <Button size="sm" className="h-8 md:h-7 bg-blue-600 hover:bg-blue-700 text-white">
                            Schedule Follow-up
                          </Button>
                        </div>
                      </div>
                    </div>

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
                        {activities.map(activity => (
                          <ActivityCard key={activity.id} activity={activity} />
                        ))}
                      </div>
                    </div>

                    {/* Stage History */}
                    <div className="p-4 rounded-xl md:rounded-lg border bg-muted/5">
                      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                        Stage History
                      </h3>
                      <StageIndicator stages={stageHistory} />
                    </div>

                  </TabsContent>

                  <TabsContent value="overview" className="mt-0">
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="w-8 h-8 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Overview content coming soon</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="notes" className="mt-0">
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Notes content coming soon</p>
                    </div>
                  </TabsContent>

                </Tabs>

              </div>
            </ScrollArea>
          </main>

          {/* Toggle button when right panel closed - Desktop only */}
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

          {/* RIGHT PANEL - Desktop Only */}
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

            <RightPanelContent
              chatInput={chatInput}
              setChatInput={setChatInput}
              onSubmit={handleChatSubmit}
            />
          </aside>

        </div>

        {/* Mobile: Floating Chat Input at Bottom */}
        <MobileChatInput
          chatInput={chatInput}
          setChatInput={setChatInput}
          onSubmit={handleChatSubmit}
          onOpenDetails={() => setMobileDetailsOpen(true)}
        />

        {/* Mobile Sheets */}
        <Sheet open={mobileDetailsOpen} onOpenChange={setMobileDetailsOpen}>
          <SheetContent side="left" className="w-[85vw] sm:w-[350px] p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="text-left">Deal Details</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-60px)]">
              <LeftPanelContent />
            </ScrollArea>
          </SheetContent>
        </Sheet>

      </div>
    </AppSidebar>
  );
}

export default function DealWorkspacePage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading deal workspace...</div>}>
      <DealWorkspaceContent />
    </Suspense>
  );
}
