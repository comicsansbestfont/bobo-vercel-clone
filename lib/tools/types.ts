/**
 * Shared types for tool system
 *
 * This file contains type definitions used across all tool modules.
 */

import type { Tool } from '@anthropic-ai/sdk/resources/messages';

/**
 * Context passed to tools that need conversation/project awareness
 * Used by second-opinion tools (ask_gemini, ask_chatgpt) to include chat history and project files
 */
export interface ToolExecutionContext {
  /** Recent messages from current conversation */
  messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  /** Project context files (if active project) */
  projectContext?: {
    projectId: string;
    projectName?: string;
    /** Custom project-level instructions (if any) */
    customInstructions?: string;
    files?: Array<{ filename: string; content_text: string }>;
  };
  /**
   * Claude's latest reply in the CURRENT turn (draft text from the tool-using iteration).
   * Useful when requesting a second opinion on Claude's just-generated answer.
   */
  claudeLatestReply?: string;
}

/**
 * Tool executor function signature
 */
export type ToolExecutor = (
  input: Record<string, unknown>,
  context?: ToolExecutionContext
) => Promise<string>;

/**
 * Tool definition with executor
 */
export interface ToolDefinition {
  definition: Tool;
  execute: ToolExecutor;
}

/**
 * Tool module - a collection of related tools
 */
export interface ToolModule {
  name: string;
  description: string;
  tools: ToolDefinition[];
}

/**
 * Tool registry organizing all tools by module
 */
export interface ToolRegistry {
  [moduleName: string]: ToolModule;
}
