"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import React, { useState } from "react";
import { motion } from "motion/react";
import {
  IconMessagePlus,
  IconFolder,
  IconSettings,
  IconUser,
  IconSearch,
  IconFolderPlus,
  IconDots,
  IconClock,
  IconCalendar,
} from "@tabler/icons-react";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  Logo,
  LogoIcon,
  useSidebar,
} from "./collapsible-sidebar";

// Mock data types
interface Chat {
  id: string;
  title: string;
  lastMessage?: string;
  updatedAt: Date;
  createdAt: Date;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  chatCount?: number;
}

// Mock data
const mockChats: Chat[] = [
  {
    id: "1",
    title: "React Best Practices",
    lastMessage: "How do I optimize re-renders?",
    updatedAt: new Date("2025-01-20"),
    createdAt: new Date("2025-01-15"),
  },
  {
    id: "2",
    title: "TypeScript Tips",
    lastMessage: "Explain generics",
    updatedAt: new Date("2025-01-19"),
    createdAt: new Date("2025-01-10"),
  },
  {
    id: "3",
    title: "API Design Discussion",
    lastMessage: "REST vs GraphQL",
    updatedAt: new Date("2025-01-18"),
    createdAt: new Date("2025-01-05"),
  },
  {
    id: "4",
    title: "Building Auth Flow",
    updatedAt: new Date("2025-01-17"),
    createdAt: new Date("2024-12-28"),
  },
  {
    id: "5",
    title: "Database Schema Help",
    updatedAt: new Date("2025-01-16"),
    createdAt: new Date("2024-12-20"),
  },
  {
    id: "6",
    title: "Context API vs Redux",
    updatedAt: new Date("2025-01-15"),
    createdAt: new Date("2024-12-15"),
  },
  {
    id: "7",
    title: "Async/Await Patterns",
    updatedAt: new Date("2025-01-14"),
    createdAt: new Date("2024-12-10"),
  },
  {
    id: "8",
    title: "Error Handling Strategies",
    updatedAt: new Date("2025-01-13"),
    createdAt: new Date("2024-12-05"),
  },
  {
    id: "9",
    title: "Testing with Jest",
    updatedAt: new Date("2025-01-12"),
    createdAt: new Date("2024-11-30"),
  },
  {
    id: "10",
    title: "Docker Setup Guide",
    updatedAt: new Date("2025-01-11"),
    createdAt: new Date("2024-11-25"),
  },
];

// Date formatting utility
function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

function formatAbsoluteDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
}

const mockProjects: Project[] = [
  {
    id: "proj-1",
    name: "E-Commerce Redesign",
    description: "Frontend architecture project",
    chatCount: 5,
  },
  {
    id: "proj-2",
    name: "ML Research",
    description: "Machine learning experiments",
    chatCount: 3,
  },
  {
    id: "proj-3",
    name: "Portfolio Redesign",
    description: "Personal website rebuild",
    chatCount: 2,
  },
  {
    id: "proj-4",
    name: "API Documentation",
    description: "REST API docs",
    chatCount: 4,
  },
  {
    id: "proj-5",
    name: "Mobile App Prototype",
    description: "React Native app",
    chatCount: 6,
  },
  {
    id: "proj-empty",
    name: "New Project",
    description: "Empty project for testing",
    chatCount: 0,
  },
];

// Search Bar Component
const SearchBar = () => {
  const { open: sidebarOpen } = useSidebar();

  return (
    <div className="relative mb-4">
      <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500 dark:text-neutral-400" />
      <input
        type="text"
        placeholder="Search"
        className={cn(
          "w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pr-3 text-sm outline-none transition-all placeholder:text-neutral-500 focus:border-neutral-300 focus:bg-white dark:border-neutral-700 dark:bg-neutral-800 dark:placeholder:text-neutral-400 dark:focus:border-neutral-600 dark:focus:bg-neutral-900",
          sidebarOpen ? "pl-9" : "pl-3",
        )}
      />
    </div>
  );
};

// Simple Chat Item (no icons) with hover dates
const SimpleChatItem = ({
  chat,
  isActive = false,
  dateMode,
}: {
  chat: Chat;
  isActive?: boolean;
  dateMode: 'updated' | 'created';
}) => {
  const { open: sidebarOpen } = useSidebar();
  const [isHovered, setIsHovered] = useState(false);

  const dateToShow = dateMode === 'updated' ? chat.updatedAt : chat.createdAt;
  const dateLabel = dateMode === 'updated' ? 'Updated' : 'Created';
  const formattedDate = formatRelativeDate(dateToShow);

  return (
    <Link
      href={`#chat-${chat.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800",
        isActive && "bg-neutral-100 dark:bg-neutral-800",
      )}
    >
      <motion.span
        animate={{
          display: sidebarOpen ? "inline-block" : "none",
          opacity: sidebarOpen ? 1 : 0,
        }}
        className="truncate text-neutral-700 dark:text-neutral-300"
      >
        {chat.title}
      </motion.span>

      {isHovered && sidebarOpen && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400"
        >
          {dateMode === 'updated' ? (
            <IconClock className="h-3 w-3" />
          ) : (
            <IconCalendar className="h-3 w-3" />
          )}
          <span className="whitespace-nowrap">{formattedDate}</span>
        </motion.div>
      )}
    </Link>
  );
};

// Inline Project Item (no expansion)
const InlineProjectItem = ({ project }: { project: Project }) => {
  const { open: sidebarOpen } = useSidebar();

  return (
    <Link
      href={`/project/${project.id}`}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
    >
      <IconFolder className="h-4 w-4 flex-shrink-0 text-neutral-600 dark:text-neutral-400" />
      <motion.span
        animate={{
          display: sidebarOpen ? "inline-block" : "none",
          opacity: sidebarOpen ? 1 : 0,
        }}
        className="flex-1 truncate text-neutral-700 dark:text-neutral-300"
      >
        {project.name}
      </motion.span>
    </Link>
  );
};

// See More Button
const SeeMoreButton = ({
  onClick,
  isExpanded,
}: {
  onClick: () => void;
  isExpanded: boolean;
}) => {
  const { open: sidebarOpen } = useSidebar();

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
    >
      <IconDots className="h-4 w-4 flex-shrink-0" />
      <motion.span
        animate={{
          display: sidebarOpen ? "inline-block" : "none",
          opacity: sidebarOpen ? 1 : 0,
        }}
      >
        {isExpanded ? "Show less" : "See more"}
      </motion.span>
    </button>
  );
};

// New Project Button
const NewProjectButton = () => {
  const { open: sidebarOpen } = useSidebar();

  return (
    <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800">
      <IconFolderPlus className="h-4 w-4 flex-shrink-0 text-neutral-600 dark:text-neutral-400" />
      <motion.span
        animate={{
          display: sidebarOpen ? "inline-block" : "none",
          opacity: sidebarOpen ? 1 : 0,
        }}
        className="text-neutral-700 dark:text-neutral-300"
      >
        New project
      </motion.span>
    </button>
  );
};

// Subtle Divider
const SubtleDivider = () => {
  return <div className="my-3 h-px bg-neutral-200/50 dark:bg-neutral-700/50" />;
};

// Date Mode Toggle
const DateModeToggle = ({
  dateMode,
  onToggle,
}: {
  dateMode: 'updated' | 'created';
  onToggle: () => void;
}) => {
  const { open: sidebarOpen } = useSidebar();

  return (
    <button
      onClick={onToggle}
      className="mb-2 flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
      title={`Showing ${dateMode === 'updated' ? 'last updated' : 'created'} dates. Click to toggle.`}
    >
      {dateMode === 'updated' ? (
        <IconClock className="h-3.5 w-3.5 flex-shrink-0" />
      ) : (
        <IconCalendar className="h-3.5 w-3.5 flex-shrink-0" />
      )}
      <motion.span
        animate={{
          display: sidebarOpen ? "inline-block" : "none",
          opacity: sidebarOpen ? 1 : 0,
        }}
        className="text-left"
      >
        {dateMode === 'updated' ? 'Show created dates' : 'Show updated dates'}
      </motion.span>
    </button>
  );
};

// Main Bobo Sidebar Option A Component
export function BoboSidebarOptionA({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [dateMode, setDateMode] = useState<'updated' | 'created'>('updated');

  const visibleProjects = showAllProjects
    ? mockProjects
    : mockProjects.slice(0, 3);

  const toggleDateMode = () => {
    setDateMode(prev => prev === 'updated' ? 'created' : 'updated');
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-100 dark:bg-neutral-800">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-0">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {/* Logo and New Chat Button Row */}
            <div className="mb-4 flex items-center justify-between gap-2">
              {open ? <Logo /> : <LogoIcon />}

              {/* New Chat Button - Right aligned */}
              <button
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors",
                  !open && "px-2",
                )}
              >
                <IconMessagePlus className="h-4 w-4 flex-shrink-0" />
                {open && <span className="text-xs">New</span>}
              </button>
            </div>

            {/* Search Bar */}
            <SearchBar />

            {/* New Project Button */}
            <NewProjectButton />

            {/* Projects - Inline (no section header) */}
            <div className="mt-1 space-y-0.5">
              {visibleProjects.map((project) => (
                <InlineProjectItem key={project.id} project={project} />
              ))}
              {mockProjects.length > 4 && (
                <SeeMoreButton
                  onClick={() => setShowAllProjects(!showAllProjects)}
                  isExpanded={showAllProjects}
                />
              )}
            </div>

            {/* Subtle Divider */}
            <SubtleDivider />

            {/* Date Mode Toggle */}
            <DateModeToggle dateMode={dateMode} onToggle={toggleDateMode} />

            {/* Chats - Flat List (no section header, no icons) */}
            <div className="space-y-0.5">
              {mockChats.map((chat) => (
                <SimpleChatItem key={chat.id} chat={chat} dateMode={dateMode} />
              ))}
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-neutral-200 pt-4 dark:border-neutral-700">
            <SidebarLink
              link={{
                label: "Settings",
                href: "#settings",
                icon: (
                  <IconSettings className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
                ),
              }}
            />
            <SidebarLink
              link={{
                label: "Profile",
                href: "#profile",
                icon: (
                  <IconUser className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      {children}
    </div>
  );
}

export { mockChats, mockProjects };
export type { Chat, Project };
