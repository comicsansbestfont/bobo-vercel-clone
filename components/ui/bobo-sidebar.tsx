"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import React, { useState } from "react";
import { motion } from "motion/react";
import {
  IconMessagePlus,
  IconChevronDown,
  IconChevronRight,
  IconMessage,
  IconFolder,
  IconSettings,
  IconUser,
  IconDots,
  IconTrash,
  IconEdit,
  IconPlus,
  IconBrain, // Using Brain icon for Memory
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
}

interface Project {
  id: string;
  name: string;
  description?: string;
  chats: Chat[];
}

// Mock data
const mockChats: Chat[] = [
  {
    id: "1",
    title: "React Best Practices",
    lastMessage: "How do I optimize re-renders?",
    updatedAt: new Date("2025-01-20"),
  },
  {
    id: "2",
    title: "TypeScript Tips",
    lastMessage: "Explain generics",
    updatedAt: new Date("2025-01-19"),
  },
  {
    id: "3",
    title: "API Design Discussion",
    lastMessage: "REST vs GraphQL",
    updatedAt: new Date("2025-01-18"),
  },
];

const mockProjects: Project[] = [
  {
    id: "proj-1",
    name: "E-Commerce Redesign",
    description: "Frontend architecture project",
    chats: [
      {
        id: "p1-c1",
        title: "Homepage Layout",
        updatedAt: new Date("2025-01-20"),
      },
      {
        id: "p1-c2",
        title: "Cart Flow",
        updatedAt: new Date("2025-01-19"),
      },
    ],
  },
  {
    id: "proj-2",
    name: "ML Research",
    description: "Machine learning experiments",
    chats: [
      {
        id: "p2-c1",
        title: "Model Architecture",
        updatedAt: new Date("2025-01-18"),
      },
    ],
  },
];

// Collapsible Section Component
const CollapsibleSection = ({
  title,
  icon,
  children,
  actionIcon,
  onAction,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { open: sidebarOpen } = useSidebar();

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between px-2 py-1.5">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 flex-1 text-xs font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          {isOpen ? (
            <IconChevronDown className="h-3 w-3" />
          ) : (
            <IconChevronRight className="h-3 w-3" />
          )}
          {icon}
          <motion.span
            animate={{
              display: sidebarOpen ? "inline-block" : "none",
              opacity: sidebarOpen ? 1 : 0,
            }}
            className="uppercase tracking-wide"
          >
            {title}
          </motion.span>
        </button>
        {actionIcon && onAction && sidebarOpen && (
          <button
            onClick={onAction}
            className="p-1 hover:bg-neutral-100 rounded dark:hover:bg-neutral-800"
          >
            {actionIcon}
          </button>
        )}
      </div>
      {isOpen && <div className="mt-1">{children}</div>}
    </div>
  );
};

// Chat Item Component
const ChatItem = ({
  chat,
  isActive = false,
}: {
  chat: Chat;
  isActive?: boolean;
}) => {
  const { open: sidebarOpen } = useSidebar();
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={cn(
        "group relative flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800",
        isActive && "bg-neutral-100 dark:bg-neutral-800",
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <IconMessage className="h-4 w-4 flex-shrink-0 text-neutral-600 dark:text-neutral-400" />
      <motion.span
        animate={{
          display: sidebarOpen ? "inline-block" : "none",
          opacity: sidebarOpen ? 1 : 0,
        }}
        className="flex-1 truncate text-neutral-700 dark:text-neutral-200"
      >
        {chat.title}
      </motion.span>
      {showActions && sidebarOpen && (
        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-neutral-200 rounded dark:hover:bg-neutral-700">
            <IconEdit className="h-3 w-3" />
          </button>
          <button className="p-1 hover:bg-neutral-200 rounded dark:hover:bg-neutral-700">
            <IconTrash className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};

// Project Item Component
const ProjectItem = ({ project }: { project: Project }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { open: sidebarOpen } = useSidebar();

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        {isExpanded ? (
          <IconChevronDown className="h-3 w-3" />
        ) : (
          <IconChevronRight className="h-3 w-3" />
        )}
        <IconFolder className="h-4 w-4 flex-shrink-0 text-neutral-600 dark:text-neutral-400" />
        <motion.span
          animate={{
            display: sidebarOpen ? "inline-block" : "none",
            opacity: sidebarOpen ? 1 : 0,
          }}
          className="flex-1 truncate text-left text-neutral-700 dark:text-neutral-200"
        >
          {project.name}
        </motion.span>
      </button>
      {isExpanded && sidebarOpen && (
        <div className="ml-4 mt-1 space-y-1">
          {project.chats.map((chat) => (
            <ChatItem key={chat.id} chat={chat} />
          ))}
        </div>
      )}
    </div>
  );
};

// Main Bobo Sidebar Component
export function BoboSidebar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-100 dark:bg-neutral-800">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-4">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {/* Logo */}
            <div className="mb-4">{open ? <Logo /> : <LogoIcon />}</div>

            {/* New Chat Button */}
            <motion.button
              animate={{
                width: open ? "100%" : "auto",
              }}
              className={cn(
                "mb-6 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90",
                !open && "px-2",
              )}
            >
              <IconMessagePlus className="h-5 w-5 flex-shrink-0" />
              <motion.span
                animate={{
                  display: open ? "inline-block" : "none",
                  opacity: open ? 1 : 0,
                }}
              >
                New Chat
              </motion.span>
            </motion.button>

            <SidebarLink
              link={{
                label: "Memory",
                href: "/memory",
                icon: (
                  <IconBrain className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
                ),
              }}
            />

            {/* Chats Section */}
            <CollapsibleSection
              title="Chats"
              icon={<IconMessage className="h-3 w-3" />}
              actionIcon={<IconPlus className="h-3 w-3" />}
              onAction={() => {}}
            >
              <div className="space-y-1">
                {mockChats.map((chat) => (
                  <ChatItem key={chat.id} chat={chat} />
                ))}
              </div>
            </CollapsibleSection>

            {/* Projects Section */}
            <CollapsibleSection
              title="Projects"
              icon={<IconFolder className="h-3 w-3" />}
              actionIcon={<IconPlus className="h-3 w-3" />}
              onAction={() => {}}
            >
              <div className="space-y-1">
                {mockProjects.map((project) => (
                  <ProjectItem key={project.id} project={project} />
                ))}
              </div>
            </CollapsibleSection>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-neutral-200 pt-4 dark:border-neutral-700">
            <SidebarLink
              link={{
                label: "Home",
                href: "/",
                icon: (
                  <IconMessagePlus className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
                ),
              }}
            />
            <SidebarLink
              link={{
                label: "Profile",
                href: "/settings/profile",
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