import { useState, useEffect, useCallback } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  FileTextIcon,
  FilePlusIcon,
  FileEditIcon,
  TerminalIcon,
  FolderSearchIcon,
  SearchIcon,
  GlobeIcon,
  DownloadIcon,
  BrainIcon,
} from 'lucide-react';

/**
 * Tool step status
 */
export type ToolStepStatus = 'pending' | 'active' | 'complete';

/**
 * Tool step data structure
 */
export interface ToolStep {
  id: string;
  toolName?: string;
  status: ToolStepStatus;
  success?: boolean;
  input?: Record<string, unknown>;
  output?: string;
  duration?: number;
}

/**
 * Return type for useToolSteps hook
 */
export interface UseToolStepsReturn {
  /** Current tool steps */
  toolSteps: ToolStep[];
  /** Add or update a tool step */
  updateToolStep: (step: ToolStep) => void;
  /** Clear all tool steps */
  clearToolSteps: () => void;
  /** Get icon for a tool name */
  getToolIcon: (toolName?: string) => LucideIcon;
}

/**
 * Tool icon mapping
 */
const TOOL_ICON_MAP: Record<string, LucideIcon> = {
  Read: FileTextIcon,
  Write: FilePlusIcon,
  Edit: FileEditIcon,
  Bash: TerminalIcon,
  Glob: FolderSearchIcon,
  Grep: SearchIcon,
  WebSearch: GlobeIcon,
  WebFetch: DownloadIcon,
  search_memory: BrainIcon,
  remember_fact: BrainIcon,
  update_memory: BrainIcon,
  forget_memory: BrainIcon,
};

/**
 * Hook for managing tool execution steps
 * Tracks tool calls and their status during agent execution
 */
export function useToolSteps(chatId: string | null): UseToolStepsReturn {
  const [toolSteps, setToolSteps] = useState<ToolStep[]>([]);

  // Get icon for a tool name
  const getToolIcon = useCallback((toolName?: string): LucideIcon => {
    if (!toolName) return FileTextIcon;
    return TOOL_ICON_MAP[toolName] || FileTextIcon;
  }, []);

  // Update a tool step
  const updateToolStep = useCallback((payload: Partial<ToolStep> & { id: string }) => {
    if (!payload?.id) return;

    setToolSteps((prev) => {
      const existingIndex = prev.findIndex((step) => step.id === payload.id);
      const nextStep: ToolStep = {
        id: payload.id,
        toolName: payload.toolName,
        status: payload.status || 'pending',
        success: payload.success,
        input: payload.input,
        output: payload.output,
        duration: payload.duration,
      };

      if (existingIndex === -1) {
        return [...prev, nextStep];
      }

      const updated = [...prev];
      updated[existingIndex] = {
        ...updated[existingIndex],
        ...nextStep,
      };
      return updated;
    });
  }, []);

  // Clear all tool steps
  const clearToolSteps = useCallback(() => {
    setToolSteps([]);
  }, []);

  // Reset tool steps when switching chats
  useEffect(() => {
    setToolSteps([]);
  }, [chatId]);

  return {
    toolSteps,
    updateToolStep,
    clearToolSteps,
    getToolIcon,
  };
}
