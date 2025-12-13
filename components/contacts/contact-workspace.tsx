'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  MoreHorizontal,
  Sparkles,
  Send,
  PanelLeftClose,
  PanelRightClose,
  ChevronRight,
  User,
  Edit,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ContactInfoPanel } from './contact-info-panel';
import { ContactActivityFeed } from './contact-activity-feed';
import type { ContactDetail } from './types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ContactWorkspaceProps {
  contact: ContactDetail;
}

export function ContactWorkspace({ contact }: ContactWorkspaceProps) {
  const router = useRouter();
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('activity');
  const [chatInput, setChatInput] = useState('');
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const [mobileAIOpen, setMobileAIOpen] = useState(false);

  const toggleLeftPanel = useCallback(() => setLeftPanelOpen((prev) => !prev), []);
  const toggleRightPanel = useCallback(() => setRightPanelOpen((prev) => !prev), []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete contact');

      toast.success('Contact deleted');
      router.push('/contacts');
    } catch {
      toast.error('Failed to delete contact');
    }
  };

  // Right Panel Content (AI Assistant)
  const RightPanelContent = () => (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Chat Messages Placeholder */}
          <div className="space-y-4">
            {/* User message */}
            <div className="flex flex-col items-end">
              <div className="bg-blue-600 text-white text-sm px-3 py-2 rounded-2xl rounded-tr-md max-w-[85%]">
                Brief me on this contact
              </div>
              <span className="text-[10px] text-muted-foreground mt-1">Now</span>
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
                <p>
                  <strong>{contact.name}</strong> is{' '}
                  {contact.role ? `a ${contact.role}` : 'a contact'}
                  {contact.company && ` at ${contact.company.name}`}.
                </p>
                <ul className="text-muted-foreground space-y-1 text-sm">
                  {contact.email && <li>• Email: {contact.email}</li>}
                  {contact.phone && <li>• Phone: {contact.phone}</li>}
                  <li>• Activities: {contact.activities?.length || 0} recorded</li>
                  {contact.engagements && contact.engagements.length > 0 && (
                    <li>• Engagements: {contact.engagements.length} active</li>
                  )}
                </ul>
              </div>
              <span className="text-[10px] text-muted-foreground mt-1">Now</span>
            </div>
          </div>

          <Separator />

          {/* Quick Prompts */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Suggestions
            </h3>
            <div className="space-y-2">
              {[
                'Draft a follow-up email',
                'What is our history with this contact?',
                'Prepare talking points for a call',
              ].map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setChatInput(prompt)}
                  className="w-full text-left p-2 rounded-lg border hover:border-purple-200 hover:bg-purple-50/50 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
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
            placeholder="Ask about this contact..."
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
    <div className="flex h-[100dvh] flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="h-14 md:h-12 border-b flex items-center justify-between px-3 md:px-4 shrink-0 bg-background z-20 safe-area-inset-top">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:h-8 md:w-auto md:gap-1.5 md:px-2 text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => router.push('/contacts')}
          >
            <ChevronLeft className="w-5 h-5 md:w-4 md:h-4" />
            <span className="hidden md:inline text-sm">Contacts</span>
          </Button>

          <div className="hidden md:block h-4 w-px bg-border" />

          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-8 w-8 md:h-7 md:w-7">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                {getInitials(contact.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold flex items-center gap-2 truncate">
                {contact.name}
                {contact.is_primary && (
                  <Badge variant="outline" className="text-[10px] h-5">
                    Primary
                  </Badge>
                )}
              </h1>
              {contact.role && (
                <p className="text-xs text-muted-foreground md:hidden">{contact.role}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 md:h-8 md:w-8">
                <MoreHorizontal className="w-5 h-5 md:w-4 md:h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit Contact
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Contact
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL */}
        <aside
          className={cn(
            'hidden md:flex border-r flex-col bg-muted/5 transition-all duration-200',
            leftPanelOpen ? 'w-[280px]' : 'w-0 overflow-hidden'
          )}
        >
          <div className="flex items-center justify-between h-10 px-3 border-b">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Details
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleLeftPanel}>
              <PanelLeftClose className="w-3.5 h-3.5" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <ContactInfoPanel contact={contact} />
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
          {/* Tabs Header */}
          <div className="border-b px-4 h-12 flex items-center">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-8 bg-muted/50 p-0.5">
                <TabsTrigger value="activity" className="h-7 text-xs px-3 data-[state=active]:shadow-sm">
                  Activity ({contact.activities?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="notes" className="h-7 text-xs px-3 data-[state=active]:shadow-sm">
                  Notes
                </TabsTrigger>
                <TabsTrigger value="emails" className="h-7 text-xs px-3 data-[state=active]:shadow-sm">
                  Emails
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Content Area */}
          <ScrollArea className="flex-1">
            <div className="max-w-3xl mx-auto p-4 md:p-6 pb-24 md:pb-6">
              <Tabs value={activeTab} className="space-y-4 md:space-y-6">
                <TabsContent value="activity" className="mt-0">
                  <ContactActivityFeed activities={contact.activities || []} />
                </TabsContent>

                <TabsContent value="notes" className="mt-0">
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <p className="text-sm">Notes feature coming soon</p>
                  </div>
                </TabsContent>

                <TabsContent value="emails" className="mt-0">
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <p className="text-sm">Email threads coming soon</p>
                  </div>
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
        <aside
          className={cn(
            'hidden md:flex border-l flex-col bg-background transition-all duration-200',
            rightPanelOpen ? 'w-[360px]' : 'w-0 overflow-hidden'
          )}
        >
          <div className="flex items-center justify-between h-12 px-4 border-b shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium">Bobo Assistant</span>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleRightPanel}>
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
                <User className="w-5 h-5" />
                <span className="text-[10px] font-medium">Details</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] sm:w-[350px] p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="text-left">Contact Details</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-60px)]">
                <ContactInfoPanel contact={contact} />
              </ScrollArea>
            </SheetContent>
          </Sheet>

          <Sheet open={mobileAIOpen} onOpenChange={setMobileAIOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center gap-1 py-2 px-4 text-purple-600 hover:text-purple-700 transition-colors">
                <Sparkles className="w-5 h-5" />
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
  );
}
