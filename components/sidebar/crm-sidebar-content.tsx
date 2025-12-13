'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  Users,
  Kanban,
  ChevronRight,
} from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

const crmNavItems = [
  {
    title: 'Companies',
    icon: Building2,
    href: '/crm/companies',
    description: 'View and manage companies',
  },
  {
    title: 'Contacts',
    icon: Users,
    href: '/crm/contacts',
    description: 'View and manage contacts',
  },
  {
    title: 'Deals',
    icon: Kanban,
    href: '/crm/deals',
    description: 'Pipeline and deals',
  },
];

export function CRMSidebarContent() {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <SidebarGroup>
        <SidebarGroupLabel>CRM</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {crmNavItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.title}
                  >
                    <Link href={item.href} onClick={handleClick}>
                      <item.icon className="h-4 w-4" />
                      <span className="flex-1">{item.title}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover/menu-item:opacity-100 transition-opacity" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Quick Stats - placeholder for future enhancement */}
      <SidebarGroup className="mt-auto">
        <SidebarGroupLabel>Quick Stats</SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="px-2 py-3 text-sm text-muted-foreground">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-semibold text-foreground">-</div>
                <div className="text-xs">Companies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-foreground">-</div>
                <div className="text-xs">Contacts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-foreground">-</div>
                <div className="text-xs">Open Deals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-foreground">-</div>
                <div className="text-xs">Won Deals</div>
              </div>
            </div>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    </div>
  );
}
