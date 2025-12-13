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
  DealCard,
  type Activity,
  type Deal,
} from '@/components/crm';
import {
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckSquare,
  Sparkles,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Building2,
  Lightbulb,
  MessageSquare,
  PanelLeftClose,
  PanelRightClose,
  Linkedin,
  Star,
  Briefcase,
  Clock,
  MapPin,
  ExternalLink,
  Edit,
  Command,
  Info,
  Mic,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Mock Data ---

const contactData = {
  name: 'Mikaela Greene',
  role: 'Founder & CEO',
  company: 'MyTab',
  email: 'mikaela@mytab.app',
  phone: '+61 4XX XXX XXX',
  linkedin: 'linkedin.com/in/mikaelagreene',
  location: 'Perth, WA',
  timezone: 'AWST (UTC+8)',
  initials: 'MG',
  avatar: '',
  tags: ['Decision Maker', 'Founder', 'Technical'],
  notes: 'Strong technical background. Previously worked at Atlassian. Focused on hospitality tech innovation.',
  firstContact: 'Nov 6, 2025',
  lastContact: 'Dec 10, 2025',
};

const relatedDeals: Deal[] = [
  { id: '1', name: 'MyTab', stage: 'Proposal', amount: '$45,000', role: 'Primary Contact' },
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
    deal: 'MyTab',
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
    deal: 'MyTab',
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
    deal: 'MyTab',
    metadata: { duration: '1h 03m', attendees: '2' },
  },
  {
    id: 4,
    type: 'email',
    title: 'Initial outreach response',
    date: 'Nov 8',
    time: '9:45 AM',
    sortDate: '2025-11-08T09:45:00Z',
    content: 'Mikaela responded to LinkedIn outreach. Expressed interest in advisory services.',
    deal: 'MyTab',
    metadata: { direction: 'Inbound' },
  },
];

const suggestedActions = [
  { id: 1, text: 'Schedule follow-up call post-VC pitch', priority: 'high' },
  { id: 2, text: 'Send congratulations on product launch', priority: 'medium' },
];

// --- Left Panel Content ---
const LeftPanelContent = () => (
  <div className="p-4 md:p-3 space-y-6">
    {/* Contact Card */}
    <div className="text-center">
      <Avatar className="h-20 w-20 mx-auto mb-3 ring-4 ring-background shadow-lg">
        <AvatarImage src={contactData.avatar} />
        <AvatarFallback className="text-xl font-semibold bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          {contactData.initials}
        </AvatarFallback>
      </Avatar>
      <h2 className="text-lg font-semibold">{contactData.name}</h2>
      <p className="text-sm text-muted-foreground">{contactData.role}</p>
      <p className="text-sm text-muted-foreground">{contactData.company}</p>

      {/* Tags */}
      <div className="flex flex-wrap justify-center gap-1.5 mt-3">
        {contactData.tags.map(tag => (
          <Badge key={tag} variant="secondary" className="text-[10px]">
            {tag}
          </Badge>
        ))}
      </div>

      {/* Quick Contact Actions */}
      <div className="flex justify-center gap-2 mt-4">
        <Button size="sm" variant="outline" className="h-8 gap-1.5">
          <Mail className="w-3.5 h-3.5" />
          Email
        </Button>
        <Button size="sm" variant="outline" className="h-8 gap-1.5">
          <Phone className="w-3.5 h-3.5" />
          Call
        </Button>
      </div>
    </div>

    <Separator />

    {/* Contact Info */}
    <div>
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
        Contact Info
      </h3>
      <div className="space-y-0.5">
        <PropertyItem icon={Mail} label="Email" value={contactData.email} link />
        <PropertyItem icon={Phone} label="Phone" value={contactData.phone} />
        <PropertyItem icon={Linkedin} label="LinkedIn" value="View Profile" link />
        <PropertyItem icon={MapPin} label="Location" value={contactData.location} />
        <PropertyItem icon={Clock} label="Timezone" value={contactData.timezone} />
      </div>
    </div>

    <Separator />

    {/* Company */}
    <div>
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
        Company
      </h3>
      <div className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
        <div className="w-9 h-9 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{contactData.company}</div>
          <div className="text-xs text-muted-foreground">Hospitality Tech</div>
        </div>
        <ExternalLink className="w-4 h-4 text-muted-foreground" />
      </div>
    </div>

    <Separator />

    {/* Related Deals */}
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Deals ({relatedDeals.length})
        </h3>
      </div>
      <div className="space-y-1">
        {relatedDeals.map(deal => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>
    </div>

    <Separator />

    {/* Relationship Timeline */}
    <div>
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
        Relationship
      </h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">First Contact</span>
          <span className="font-medium">{contactData.firstContact}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Last Contact</span>
          <span className="font-medium">{contactData.lastContact}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Interactions</span>
          <span className="font-medium">{activities.length}</span>
        </div>
      </div>
    </div>

    <Separator />

    {/* Notes */}
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Notes
        </h3>
        <Button variant="ghost" size="icon" className="h-5 w-5">
          <Edit className="w-3 h-3" />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {contactData.notes}
      </p>
    </div>
  </div>
);

// --- Right Panel Content ---
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
              Tell me about my relationship with Mikaela
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
              <p><strong>Mikaela Greene</strong> is the Founder & CEO of MyTab.</p>
              <ul className="text-muted-foreground space-y-1 text-sm">
                <li>• First connected via LinkedIn (Nov 6)</li>
                <li>• 4 interactions over 5 weeks</li>
                <li>• Primary contact for $45K deal</li>
                <li>• Strong engagement, responds quickly</li>
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

        {/* Relationship Health */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Relationship Health
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Engagement</span>
                <span className="font-medium text-green-600">85%</span>
              </div>
              <div className="h-2 md:h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-[85%] bg-green-500 rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Responsiveness</span>
                <span className="font-medium text-green-600">90%</span>
              </div>
              <div className="h-2 md:h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-[90%] bg-green-500 rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Recency</span>
                <span className="font-medium text-yellow-600">70%</span>
              </div>
              <div className="h-2 md:h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-[70%] bg-yellow-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Key Insights */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Key Insights
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2 p-2 rounded-lg bg-blue-50/50 border border-blue-100">
              <Star className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <span className="text-blue-900">Decision maker for all MyTab deals</span>
            </div>
            <div className="flex items-start gap-2 p-2 rounded-lg bg-green-50/50 border border-green-100">
              <Lightbulb className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <span className="text-green-900">Prefers morning calls (AWST)</span>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>

    {/* Chat Input */}
    <div className="p-3 border-t shrink-0">
      <PromptInput onSubmit={onSubmit} className="shadow-none border-0 p-0">
        <PromptInputBody className="border rounded-xl bg-muted/30">
          <PromptInputTextarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask about this contact..."
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
            placeholder="Ask Bobo about this contact..."
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

function ContactWorkspaceContent() {
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
              <span className="hidden md:inline text-sm">Contacts</span>
            </Button>

            <div className="hidden md:block h-4 w-px bg-border" />

            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-8 w-8 md:h-7 md:w-7">
                <AvatarImage src={contactData.avatar} />
                <AvatarFallback className="text-xs bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  {contactData.initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h1 className="text-sm font-semibold truncate">
                  {contactData.name}
                </h1>
                <p className="text-xs text-muted-foreground md:hidden truncate">
                  {contactData.role} @ {contactData.company}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            {/* Desktop keyboard shortcut hint */}
            <div className="hidden lg:flex items-center gap-1 text-xs text-muted-foreground mr-2">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>

            <Button variant="ghost" size="icon" className="h-9 w-9 md:h-8 md:w-8">
              <Star className="w-5 h-5 md:w-4 md:h-4" />
            </Button>

            <Button variant="ghost" size="icon" className="h-9 w-9 md:h-8 md:w-8">
              <MoreHorizontal className="w-5 h-5 md:w-4 md:h-4" />
            </Button>

            {/* Desktop only - Edit button */}
            <Button
              size="sm"
              variant="outline"
              className="hidden md:flex h-8 gap-1.5"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit
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
                Profile
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

          {/* Toggle button when left panel closed */}
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

          {/* CENTER PANEL - Activity Timeline */}
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

              {/* Desktop only: Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden md:block">
                <TabsList className="h-8 bg-muted/50 p-0.5">
                  <TabsTrigger value="activity" className="h-7 text-xs px-3 data-[state=active]:shadow-sm">
                    Activity
                  </TabsTrigger>
                  <TabsTrigger value="deals" className="h-7 text-xs px-3 data-[state=active]:shadow-sm">
                    Deals
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

                {/* Mobile: Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="md:hidden mb-4">
                  <TabsList className="w-full h-10 bg-muted/50 p-1">
                    <TabsTrigger value="activity" className="flex-1 h-8 text-sm data-[state=active]:shadow-sm">
                      Activity
                    </TabsTrigger>
                    <TabsTrigger value="deals" className="flex-1 h-8 text-sm data-[state=active]:shadow-sm">
                      Deals
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="flex-1 h-8 text-sm data-[state=active]:shadow-sm">
                      Notes
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <Tabs value={activeTab} className="space-y-4 md:space-y-6">

                  <TabsContent value="activity" className="mt-0 space-y-4 md:space-y-6">

                    {/* AI Suggestion Card */}
                    <div className="p-4 rounded-xl md:rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                          <Lightbulb className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-purple-900 mb-1">
                            Relationship Insight
                          </h3>
                          <p className="text-sm text-purple-700 mb-3">
                            Mikaela typically responds within 2 hours. Her VC pitch is scheduled for Dec 18 - consider reaching out after.
                          </p>
                          <Button size="sm" className="h-8 md:h-7 bg-purple-600 hover:bg-purple-700 text-white">
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

                  </TabsContent>

                  <TabsContent value="deals" className="mt-0">
                    <div className="space-y-4">
                      <h2 className="text-sm font-medium text-foreground">
                        Associated Deals
                        <span className="text-muted-foreground font-normal ml-2">
                          {relatedDeals.length} deal{relatedDeals.length !== 1 ? 's' : ''}
                        </span>
                      </h2>
                      {relatedDeals.map(deal => (
                        <div key={deal.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                <Briefcase className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <h3 className="text-sm font-medium">{deal.name}</h3>
                                <p className="text-xs text-muted-foreground">{deal.role}</p>
                              </div>
                            </div>
                            <Badge variant="secondary">{deal.stage}</Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Deal Value</span>
                            <span className="font-semibold">{deal.amount}</span>
                          </div>
                        </div>
                      ))}
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

          {/* Toggle button when right panel closed */}
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

        {/* Mobile: Floating Chat Input */}
        <MobileChatInput
          chatInput={chatInput}
          setChatInput={setChatInput}
          onSubmit={handleChatSubmit}
          onOpenDetails={() => setMobileDetailsOpen(true)}
        />

        {/* Mobile Sheet */}
        <Sheet open={mobileDetailsOpen} onOpenChange={setMobileDetailsOpen}>
          <SheetContent side="left" className="w-[85vw] sm:w-[350px] p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="text-left">Contact Details</SheetTitle>
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

export default function ContactWorkspacePage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading contact workspace...</div>}>
      <ContactWorkspaceContent />
    </Suspense>
  );
}
