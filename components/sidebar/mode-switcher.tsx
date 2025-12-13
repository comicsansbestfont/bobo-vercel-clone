'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, BarChart3, Sparkles, ChevronDown, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { useCurrentMode, type AppMode } from '@/hooks/use-current-mode';

const modes = [
  {
    key: 'workspace' as AppMode,
    label: 'Workspace',
    description: 'AI chat & projects',
    icon: MessageSquare,
    path: '/',
    enabled: true,
  },
  {
    key: 'crm' as AppMode,
    label: 'CRM',
    description: 'Companies, contacts, deals',
    icon: BarChart3,
    path: '/crm',
    enabled: true,
  },
  {
    key: 'studio' as AppMode,
    label: 'Studio',
    description: 'Content creation',
    icon: Sparkles,
    path: '/studio',
    enabled: false, // Coming soon
  },
] as const;

export function ModeSwitcher() {
  const router = useRouter();
  const currentMode = useCurrentMode();
  const { setOpenMobile, isMobile } = useSidebar();

  const current = modes.find(m => m.key === currentMode) || modes[0];

  const handleModeChange = (mode: typeof modes[number]) => {
    if (!mode.enabled) return;
    router.push(mode.path);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <current.icon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{current.label}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {current.description}
                </span>
              </div>
              <ChevronDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            {modes.map((mode, index) => (
              <React.Fragment key={mode.key}>
                {index > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  onClick={() => handleModeChange(mode)}
                  disabled={!mode.enabled}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                    <mode.icon className="size-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{mode.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {mode.enabled ? mode.description : 'Coming soon'}
                    </div>
                  </div>
                  {currentMode === mode.key && (
                    <Check className="size-4" />
                  )}
                </DropdownMenuItem>
              </React.Fragment>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
