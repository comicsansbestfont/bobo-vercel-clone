/**
 * Chat Service Types
 *
 * Shared interfaces for the chat system modules.
 * M40-02: Refactored from monolithic route.ts
 */

import type { UIMessage } from 'ai';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';
import type {
  MessagePart,
  SearchResult,
  ProjectMessageSearchResult,
  Project,
} from '@/lib/db';
import type { ProjectContext } from '@/lib/ai/context-manager';

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface ChatRequest {
  messages: UIMessage[];
  model: string;
  webSearch: boolean;
  chatId?: string;
  projectId?: string;
  agentMode?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// ============================================================================
// CONTEXT TYPES
// ============================================================================

export interface ChatContext {
  activeChatId: string;
  activeProjectId: string | null;
  systemPrompt: string;
  projectContext: ProjectContext | null;
  projectName: string;
  searchResults: SearchResult[];
  projectChatResults: ProjectMessageSearchResult[];
  queryEmbedding: number[] | null;
  customInstructions: string;
}

export interface ContextBuildResult {
  systemPrompt: string;
  projectContext: ProjectContext | null;
  projectName: string;
  customInstructions: string;
}

export interface SearchCoordinatorResult {
  projectChatResults: ProjectMessageSearchResult[];
  searchResults: SearchResult[];
  queryEmbedding: number[] | null;
}

// ============================================================================
// PERSISTENCE TYPES
// ============================================================================

export interface PersistenceContext {
  chatId: string;
  userMessage: UIMessage;
  assistantText: string;
  assistantParts: MessagePart[];
  projectContext: ProjectContext | null;
  projectName: string;
  searchResults: SearchResult[];
  projectChatResults: ProjectMessageSearchResult[];
  activeProjectId: string | null;
  tokenCount?: number;
  /** For Claude SDK progressive saving */
  messageId?: string;
  /** Whether to use finalizeMessage (for progressive saves) vs createMessage */
  useFinalizeMessage?: boolean;
}

// ============================================================================
// HANDLER TYPES
// ============================================================================

export interface ChatHandler {
  canHandle(model: string, webSearch: boolean): boolean;
  handle(
    request: ChatRequest,
    context: ChatContext,
    normalizedMessages: UIMessage[]
  ): Promise<Response>;
}

export interface HandlerStreamResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  didTimeout: boolean;
  continuationToken: string | null;
  messageId: string;
}

// ============================================================================
// CLAUDE-SPECIFIC TYPES
// ============================================================================

export interface ClaudeToolUseBlock {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ClaudeStreamState {
  allTextContent: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  currentIteration: number;
  currentMessages: MessageParam[];
  didTimeout: boolean;
  continuationToken: string | null;
}

// ============================================================================
// TIMEOUT & PROGRESSIVE SAVE CONSTANTS
// ============================================================================

export const FUNCTION_TIMEOUT_MS = 60000;
export const SHUTDOWN_BUFFER_MS = 8000;
export const PROGRESSIVE_SAVE_INTERVAL_MS = 5000;
export const PROGRESSIVE_SAVE_THRESHOLD = 200;
export const MAX_TOOL_ITERATIONS = 3;
