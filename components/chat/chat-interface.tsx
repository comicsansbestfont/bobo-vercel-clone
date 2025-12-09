'use client';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';

import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from '@/components/ai-elements/message';

import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  type PromptInputMessage,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputHeader,
} from '@/components/ai-elements/prompt-input';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { ComponentType } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import rehypeRaw from 'rehype-raw';
import type { Pluggable } from 'unified';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import type { Message as DBMessage, MessagePart } from '@/lib/db/types';

import { CopyIcon, GlobeIcon, RefreshCcwIcon, ChevronDownIcon, ArrowUpIcon, RotateCcwIcon } from 'lucide-react';
import {
  FileTextIcon,
  FilePlusIcon,
  FileEditIcon,
  TerminalIcon,
  FolderSearchIcon,
  SearchIcon,
  DownloadIcon,
  BrainIcon,
  AlertTriangleIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/sources';

import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought';

import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';

import {
  Context,
  ContextTrigger,
  ContextContent,
  ContextContentHeader,
  ContextContentBody,
  ContextContentFooter,
  ContextInputUsage,
  ContextOutputUsage,
} from '@/components/ai-elements/context';

import {
  CitationMarker,
  CitationsList,
} from '@/components/ai-elements/inline-citations';

import { Loader } from '@/components/ai-elements/loader';
import { ContinueButton, TimeoutWarning } from '@/components/ai-elements/continue-button';
import { Button } from '@/components/ui/button';
import { getContextUsage, formatTokenCount } from '@/lib/context-tracker';
import { cn } from '@/lib/utils';
import { compressHistory } from '@/lib/memory-manager';
import { toast } from 'sonner';
import { chatLogger } from '@/lib/logger';
import { ChatHeader } from './chat-header';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { isClaudeModel } from '@/lib/agent-sdk/utils';

/**
 * Parse message content to extract thinking blocks for Reasoning component
 * Used for Agent Mode where thinking is streamed as <thinking> blocks in text
 */
function parseMessageContent(text: string): Array<{ type: 'text' | 'thinking'; content: string }> {
  const thinkingRegex = /<thinking>([\s\S]*?)<\/thinking>/g;
  const parts: Array<{ type: 'text' | 'thinking'; content: string }> = [];

  let lastIndex = 0;
  let match;
  while ((match = thinkingRegex.exec(text)) !== null) {
    // Add text before the thinking block
    if (match.index > lastIndex) {
      const textContent = text.slice(lastIndex, match.index).trim();
      if (textContent) {
        parts.push({ type: 'text', content: textContent });
      }
    }
    // Add the thinking block
    const thinkingContent = match[1].trim();
    if (thinkingContent) {
      parts.push({ type: 'thinking', content: thinkingContent });
    }
    lastIndex = match.index + match[0].length;
  }
  // Add remaining text after the last thinking block
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex).trim();
    if (remainingText) {
      parts.push({ type: 'text', content: remainingText });
    }
  }

  // If no thinking blocks found, return original text
  if (parts.length === 0 && text.trim()) {
    return [{ type: 'text', content: text }];
  }

  return parts;
}

/**
 * Check if the last assistant message has visible text content
 * Returns false if no assistant message exists or if text is empty/only whitespace
 */
function hasVisibleAssistantText(messages: Array<{ role: string; parts: Array<{ type: string; text?: string }> }>): boolean {
  const lastMessage = messages.at(-1);
  if (!lastMessage || lastMessage.role !== 'assistant') return false;

  // Check if any text part has non-empty, non-thinking content
  for (const part of lastMessage.parts) {
    if (part.type === 'text' && part.text) {
      // Remove thinking blocks and check if anything remains
      const textWithoutThinking = part.text.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim();
      if (textWithoutThinking) return true;
    }
  }
  return false;
}

/**
 * Check if the last message is an orphaned user message (no assistant response)
 * This happens when the API crashes silently
 */
function isOrphanedUserMessage(
  messages: Array<{ role: string; parts: Array<{ type: string; text?: string }> }>,
  status: string,
  hasError: boolean
): boolean {
  if (messages.length === 0) return false;
  const lastMessage = messages.at(-1);

  // Only flag as orphaned if:
  // 1. Last message is from user
  // 2. We're not currently submitting/streaming
  // 3. There was an error OR we're in ready state with no response
  return (
    lastMessage?.role === 'user' &&
    status === 'ready' &&
    hasError
  );
}

type ToolStep = {
  id: string;
  toolName?: string;
  status: 'pending' | 'active' | 'complete';
  success?: boolean;
  input?: Record<string, unknown>;
  output?: string;
  duration?: number;
};

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

function getToolIcon(toolName?: string): LucideIcon {
  if (!toolName) return FileTextIcon;
  return TOOL_ICON_MAP[toolName] || FileTextIcon;
}

type StreamingMessageResponseProps = {
  text: string;
  rehypePlugins?: Pluggable[];
  components?: Record<string, ComponentType<any>>;
};

function StreamingMessageResponse({ text, rehypePlugins, components }: StreamingMessageResponseProps) {
  // Direct passthrough - no artificial typewriter delay
  // The backend already streams text incrementally via SSE
  const textWithSupTags = useMemo(
    () => text.replace(/\[(\d+)\]/g, '<sup class="citation-marker">[$1]</sup>'),
    [text]
  );

  return (
    <MessageResponse rehypePlugins={rehypePlugins} components={components}>
      {textWithSupTags}
    </MessageResponse>
  );
}

const models = [
  {
    name: 'Claude Sonnet 4.5',
    value: 'anthropic/claude-sonnet-4-5-20250929',
  },
  {
    name: 'Claude Opus 4.5',
    value: 'anthropic/claude-opus-4-5-20251101',
  },
  {
    name: 'Claude Haiku 4.5',
    value: 'anthropic/claude-haiku-4-5-20251001',
  },
];

interface ChatInterfaceProps {
  projectId?: string;
  className?: string;
  /** Custom placeholder text for the input */
  placeholder?: string;
  /** Variant affects empty state rendering: 'default' shows Bobo, 'project' shows minimal */
  variant?: 'default' | 'project';
  /** Project name for contextual placeholder in project variant */
  projectName?: string;
}

export function ChatInterface({
  projectId,
  className,
  placeholder,
  variant = 'default',
  projectName,
}: ChatInterfaceProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isMobile, state } = useSidebar();
  // Show trigger on mobile OR when sidebar is collapsed on desktop
  const showTrigger = isMobile || state === 'collapsed';

  const chatIdFromUrl = searchParams?.get('chatId');

  const [input, setInput] = useState('');
  const [model, setModel] = useState<string>('anthropic/claude-opus-4-5-20251101');
  const [webSearch, setWebSearch] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [toolSteps, setToolSteps] = useState<ToolStep[]>([]);
  // Continuation state for handling timeouts
  const [continuationToken, setContinuationToken] = useState<string | null>(null);
  const [timeoutOccurred, setTimeoutOccurred] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  // Initialize chatId from URL directly to avoid Next.js searchParams hydration delay
  const [chatId, setChatId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('chatId');
    }
    return chatIdFromUrl;
  });
  // Track if we've synced chatId with URL to handle hydration edge cases
  const [chatIdSynced, setChatIdSynced] = useState(false);
  // Initialize to true when chatId is present to prevent empty state flash during page load
  // Check both sources to handle SSR/hydration timing
  const [isLoadingHistory, setIsLoadingHistory] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return Boolean(params.get('chatId'));
    }
    return Boolean(chatIdFromUrl);
  });
  const [chatTitle, setChatTitle] = useState<string | null>(null);
  const [chatProjectId, setChatProjectId] = useState<string | null>(projectId || null);
  const [chatProjectName, setChatProjectName] = useState<string | null>(null);

  const handleStreamData = useCallback((data: unknown) => {
    const dataChunk = data as { type?: string; data?: Record<string, unknown>; token?: string; message?: string };

    // Handle timeout warning event
    if (dataChunk?.type === 'timeout-warning') {
      chatLogger.warn('[Timeout] Response truncated due to timeout');
      setTimeoutOccurred(true);
      toast.warning('Response timeout', {
        description: dataChunk.message || 'Response was truncated. Click "Continue" to resume.',
        duration: 10000,
      });
      return;
    }

    // Handle continuation available event
    if (dataChunk?.type === 'continuation-available') {
      const token = dataChunk.token as string;
      if (token) {
        chatLogger.info('[Continuation] Token received:', token.substring(0, 8) + '...');
        setContinuationToken(token);
      }
      return;
    }

    // Handle tool step data (existing logic)
    if (dataChunk?.type !== 'data-tool-step' || !dataChunk.data) {
      return;
    }

    const payload = dataChunk.data as {
      id?: string;
      toolName?: string;
      status?: ToolStep['status'];
      success?: boolean;
      input?: Record<string, unknown>;
      output?: string;
      duration?: number;
    };

    if (!payload?.id) return;

    setToolSteps((prev) => {
      const existingIndex = prev.findIndex((step) => step.id === payload.id);
      const nextStep: ToolStep = {
        // payload.id is guaranteed by the guard above
        id: payload.id as string,
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

  // Track which message we've auto-submitted to prevent duplicates
  const autoSubmittedMessageRef = useRef<string | null>(null);

  // Track if we just submitted a message to prevent history loading before DB persistence
  const justSubmittedRef = useRef(false);

  // Track which chatId we've successfully loaded history for
  // This prevents the race condition where stale messages from a previous chat
  // cause us to skip loading history for the new chat
  const loadedHistoryForChatIdRef = useRef<string | null>(null);
  const persistenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Track when we're auto-generating a chatId to prevent the sync effect from clearing it
  const isAutoGeneratingChatIdRef = useRef(false);

  const { messages, sendMessage, status, regenerate, error, setMessages, stop } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      // Custom fetch to intercept response headers
      fetch: async (input, init) => {
        const response = await fetch(input, init);

        // Extract chat ID from header if creating new chat
        const responseChatId = response.headers.get('X-Chat-Id');

        // Check URL directly instead of stale state variable to prevent redundant updates
        const urlParams = new URLSearchParams(window.location.search);
        const urlChatId = urlParams.get('chatId');

        if (responseChatId && !urlChatId) {
          // Mark that we're creating a new chat to prevent history loading
          justSubmittedRef.current = true;
          chatLogger.info('🆕 New chat created - blocking history loads until persistence completes');

          // Update state
          setChatId(responseChatId);

          // Use history.replaceState instead of router.replace to avoid React re-renders
          const params = new URLSearchParams(window.location.search);
          params.set('chatId', responseChatId);
          window.history.replaceState({}, '', `?${params.toString()}`);
        }

        return response;
      },
    }),
    onError: (error) => {
      toast.error('Chat error', {
        description: error.message || 'An error occurred while processing your message.',
      });
    },
    onData: handleStreamData,
    onFinish: () => {
      // Message finished streaming and is now in the messages array
      // Clear the previous timeout if it exists
      if (persistenceTimeoutRef.current) {
        clearTimeout(persistenceTimeoutRef.current);
      }

      // Wait 3 seconds for database persistence to complete before allowing history loads
      // Increased from 1.5s to account for slower persistence under load
      persistenceTimeoutRef.current = setTimeout(() => {
        chatLogger.info('✅ Database persistence window complete - allowing history loads');
        justSubmittedRef.current = false;
      }, 3000);
    },
  });

  // Auto-generate chatId if missing (enables chat to work without URL parameter)
  useEffect(() => {
    // Skip if we already have a chatId (from URL or previous generation)
    if (chatId || chatIdFromUrl) {
      // Clear the flag once URL is synced
      if (chatIdFromUrl && isAutoGeneratingChatIdRef.current) {
        isAutoGeneratingChatIdRef.current = false;
      }
      return;
    }

    // Generate a new chatId and update URL
    const newChatId = crypto.randomUUID();
    chatLogger.info('[Chat] Auto-generating chatId:', newChatId);

    // Mark that we're auto-generating to prevent the sync effect from clearing
    isAutoGeneratingChatIdRef.current = true;

    // Update state
    setChatId(newChatId);

    // Preserve existing search params (model, projectId, etc.)
    const params = new URLSearchParams(window.location.search);
    params.set('chatId', newChatId);

    // Use Next.js router to properly update URL and searchParams
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [chatId, chatIdFromUrl, router]);

  // Reset tool steps and continuation state when switching chats
  useEffect(() => {
    setToolSteps([]);
    setContinuationToken(null);
    setTimeoutOccurred(false);
  }, [chatId]);

  // Keep local chatId in sync with URL when navigating between chats
  useEffect(() => {
    // Mark that we've done initial sync
    if (!chatIdSynced) {
      setChatIdSynced(true);
    }

    // Handle navigation away from a chat (chatId cleared)
    // BUT skip if we're auto-generating a chatId (URL hasn't synced yet)
    if (!chatIdFromUrl && chatId) {
      if (isAutoGeneratingChatIdRef.current) {
        chatLogger.info('⏭️ Skipping chat close - auto-generating chatId in progress');
        return;
      }
      chatLogger.info('🔁 Chat closed, clearing state');
      loadedHistoryForChatIdRef.current = null;
      setChatId(null);
      setMessages([]);
      setIsLoadingHistory(false);
      setChatTitle(null);
      setChatProjectName(null);
      return;
    }

    if (!chatIdFromUrl || chatIdFromUrl === chatId) {
      return;
    }

    // Only sync when we're not in the middle of sending/streaming a message
    // Also check if messages exist - don't clear them during active conversation
    if (status === 'submitted' || status === 'streaming' || justSubmittedRef.current) {
      chatLogger.info('⏭️  Skipping chatId sync - message in progress');
      return;
    }

    chatLogger.info('🔁 Syncing chatId from URL', { chatIdFromUrl });

    // Reset the loaded history ref to allow loading for the new chat
    loadedHistoryForChatIdRef.current = null;

    setChatId(chatIdFromUrl);
    setMessages([]);
    setChatTitle(null);
    setChatProjectName(null);
    // Set loading state to prevent empty state flash
    setIsLoadingHistory(true);
  }, [chatIdFromUrl, chatId, status, setMessages, chatIdSynced]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (persistenceTimeoutRef.current) {
        clearTimeout(persistenceTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!chatId) return;

    // Handle hydration: chatIdFromUrl might be undefined during initial hydration
    // but chatId was set from window.location.search. In that case, wait for
    // chatIdFromUrl to sync, OR if chatIdSynced is true but they still don't match,
    // use chatId directly
    const urlChatId = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('chatId')
      : chatIdFromUrl;

    if (chatId !== urlChatId && chatId !== chatIdFromUrl) {
      chatLogger.info('⏭️  Skipping history load - chatId mismatch (hydration)', { chatId, chatIdFromUrl, urlChatId });
      return;
    }

    // Don't load history if we've already loaded it for this specific chat
    // Using a ref instead of messages.length to avoid race condition where
    // stale messages from a previous chat haven't been cleared yet
    if (loadedHistoryForChatIdRef.current === chatId) {
      chatLogger.info('⏭️  Skipping history load - already loaded for this chatId');
      setIsLoadingHistory(false);
      return;
    }

    // Don't load history if a message is currently being sent/streamed
    if (status === 'submitted' || status === 'streaming') {
      chatLogger.info('⏭️  Skipping history load - message in progress');
      return;
    }

    // Don't load history if we just submitted a message (waiting for DB persistence)
    if (justSubmittedRef.current) {
      chatLogger.info('⏭️  Skipping history load - waiting for database persistence');
      return;
    }

    // Skip history load if there's a message param - we'll auto-submit instead
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('message')) {
      chatLogger.info('⏭️  Skipping history load - auto-submit pending');
      setIsLoadingHistory(false);
      return;
    }

    async function loadChatHistory(retryCount = 0) {
      const MAX_RETRIES = 2;
      const RETRY_DELAY = 1500; // 1.5 seconds between retries
      let willRetry = false;

      chatLogger.info('📚 Loading chat history for chatId:', chatId, retryCount > 0 ? `(retry ${retryCount})` : '');
      try {
        const res = await fetch(`/api/chats/${chatId}`);
        if (!res.ok) {
          // 404 means the chat doesn't exist yet (new chat) - this is OK
          if (res.status === 404) {
            chatLogger.info('✨ New chat detected (404) - starting with empty history');
            loadedHistoryForChatIdRef.current = chatId;
            setMessages([]);
            return;
          }

          // Other errors (500, etc.) are real problems
          chatLogger.error('❌ Failed to load chat - Response not OK');
          toast.error('Failed to load chat', {
            description: 'The chat could not be found or loaded.',
          });
          setChatId(null);
          return;
        }

        const data = await res.json();
        chatLogger.debug('Chat data loaded:', data);

        const uiMessages = data.messages.map((msg: DBMessage) => ({
          id: msg.id,
          role: msg.role,
          parts: msg.content.parts,
        }));

        // If chat exists but has no messages, it might be a timing issue
        // (messages not yet persisted). Retry a few times before giving up.
        if (uiMessages.length === 0 && retryCount < MAX_RETRIES) {
          chatLogger.info(`⏳ Chat exists but no messages yet - retrying in ${RETRY_DELAY}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
          willRetry = true;
          setTimeout(() => loadChatHistory(retryCount + 1), RETRY_DELAY);
          return;
        }

        chatLogger.success(`✅ Loaded ${uiMessages.length} messages`);
        setMessages(uiMessages);

        // Mark that we've loaded history for this chat to prevent duplicate loads
        loadedHistoryForChatIdRef.current = chatId;

        // Set chat metadata for header
        if (data.chat.title) {
          setChatTitle(data.chat.title);
        }
        if (data.chat.project_id !== undefined) {
          setChatProjectId(data.chat.project_id);
          // Fetch project name if chat has a project
          if (data.chat.project_id) {
            try {
              const projectRes = await fetch(`/api/projects/${data.chat.project_id}`);
              if (projectRes.ok) {
                const projectData = await projectRes.json();
                setChatProjectName(projectData.project?.name || null);
              }
            } catch {
              // Ignore project fetch errors
            }
          } else {
            setChatProjectName(null);
          }
        }

        if (data.chat.model) {
          chatLogger.debug('Setting model:', data.chat.model);
          setModel(data.chat.model);
        }
        if (typeof data.chat.web_search_enabled === 'boolean') {
          chatLogger.debug('Setting web search:', data.chat.web_search_enabled);
          setWebSearch(data.chat.web_search_enabled);
        }
      } catch (error) {
        chatLogger.error('❌ Failed to load chat history:', error);
        toast.error('Failed to load chat history', {
          description: 'An error occurred while loading the chat history.',
        });
        setChatId(null);
      } finally {
        // Only mark loading complete if we're not retrying
        if (!willRetry) {
          chatLogger.info('✅ Chat history loading complete - isLoadingHistory = false');
          setIsLoadingHistory(false);
        }
      }
    }

    loadChatHistory();
  }, [chatIdFromUrl, setMessages, chatId, status, chatIdSynced]);

  // Auto-submit initial message from URL parameter
  useEffect(() => {
    chatLogger.info('🔄 Auto-submit useEffect triggered');

    // Read directly from window.location to avoid Next.js router hydration issues
    const params = new URLSearchParams(window.location.search);
    const initialMessage = params.get('message');

    chatLogger.debug('Auto-submit conditions:', {
      hasInitialMessage: !!initialMessage,
      initialMessage,
      chatId,
      isLoadingHistory,
      messagesLength: messages.length,
      status: status,
      alreadySubmitted: autoSubmittedMessageRef.current === initialMessage,
    });

    chatLogger.info(`🔍 Status check: status="${status}" (will proceed if status is "ready")`);

    // Check if we've already auto-submitted this exact message
    if (initialMessage && autoSubmittedMessageRef.current === initialMessage) {
      chatLogger.info('⏭️  Already auto-submitted this message, skipping');
      return;
    }

    if (initialMessage && chatId && !isLoadingHistory && messages.length === 0 && status === 'ready') {
      chatLogger.success('✅ All conditions met - auto-submitting message');

      // URLSearchParams.get() already returns a decoded string
      const decodedMessage = initialMessage;
      chatLogger.debug('Initial message from URL (decoded by URLSearchParams):', decodedMessage);

      // Mark this message as submitted
      autoSubmittedMessageRef.current = decodedMessage;

      // Mark that we just submitted a message to prevent race conditions with history loading
      justSubmittedRef.current = true;
      chatLogger.info('🚀 Auto-submit - blocking history loads until persistence completes');

      // Submit the message (AI SDK expects a single message + request body)
      chatLogger.info('📤 Calling sendMessage...');
      sendMessage(
        { text: decodedMessage },
        {
          body: {
            model,
            webSearch,
            chatId,
            projectId,
          },
        },
      );

      // Clear the message parameter from URL without triggering React re-renders
      // Using window.history.replaceState instead of router.replace to avoid
      // re-render race conditions that cause the user message to disappear
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.delete('message');
      window.history.replaceState({}, '', `?${urlParams.toString()}`);
      chatLogger.info('🧹 Cleared message parameter from URL (via history.replaceState)');
    } else {
      chatLogger.warn('⏸️  Auto-submit skipped - conditions not met');
    }
  }, [searchParams, chatId, isLoadingHistory, messages.length, status, sendMessage, model, webSearch, router]);

  const handleSubmit = async (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);
    if (!(hasText || hasAttachments)) {
      return;
    }

    if (contextUsage.usageState === 'critical' && !isCompressing) {
      try {
        setIsCompressing(true);
        const { compressedMessages, wasCompressed } = await compressHistory(messages);
        if (wasCompressed) {
          setMessages(compressedMessages);
        }
      } catch (compressionError) {
        chatLogger.error('History compression failed', compressionError);
      } finally {
        setIsCompressing(false);
      }
    }

    // Mark that we just submitted a message to prevent race conditions with history loading
    justSubmittedRef.current = true;
    chatLogger.info('🚀 Message submitted - blocking history loads until persistence completes');

    // Clear previous tool steps and continuation state for new request
    setToolSteps([]);
    setContinuationToken(null);
    setTimeoutOccurred(false);

    // Send the message - AI SDK expects { text: string } as first parameter
    // The body in options contains custom data sent to the backend
    sendMessage(
      { text: message.text || 'Sent with attachments' },
      {
        body: {
          model: model,
          webSearch: webSearch,
          chatId: chatId,
          projectId: projectId,
        },
      },
    );
    // Clear input state after submission
    setInput('');
  };

  const handleRegenerate = () => {
    setToolSteps([]);
    setContinuationToken(null);
    setTimeoutOccurred(false);
    regenerate({
      body: {
        model: model,
        webSearch: webSearch,
        chatId: chatId,
        projectId: projectId,
      },
    });
  };

  // Handle continuation - resume a timed-out response
  const handleContinue = async () => {
    if (!continuationToken || isContinuing) return;

    setIsContinuing(true);
    chatLogger.info('[Continuation] Starting continuation...');

    try {
      const response = await fetch('/api/chat/continue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          continuationToken,
          model,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to continue response');
      }

      // Clear timeout state since we're continuing
      setTimeoutOccurred(false);
      setContinuationToken(null);

      // The response is an SSE stream - we need to process it
      // For now, just reload the chat to get updated content
      // In a more sophisticated implementation, we'd append the continued text
      chatLogger.info('[Continuation] Continuation started, refreshing chat...');

      // Wait a bit for the response to be saved, then reload history
      setTimeout(async () => {
        if (chatId) {
          try {
            const res = await fetch(`/api/chats/${chatId}`);
            if (res.ok) {
              const data = await res.json();
              const uiMessages = data.messages.map((msg: DBMessage) => ({
                id: msg.id,
                role: msg.role,
                parts: msg.content.parts,
              }));
              setMessages(uiMessages);
            }
          } catch (err) {
            chatLogger.error('[Continuation] Failed to reload messages:', err);
          }
        }
        setIsContinuing(false);
      }, 5000);
    } catch (err) {
      chatLogger.error('[Continuation] Failed:', err);
      toast.error('Failed to continue', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
      setIsContinuing(false);
    }
  };

  // Calculate context usage
  const contextUsage = getContextUsage(messages, input, model);

  // Reusable PromptInput component for both layouts
  const promptInputElement = (
    <PromptInput onSubmit={handleSubmit} className="mt-2 md:mt-4" globalDrop multiple>
      <PromptInputHeader>
        <PromptInputAttachments>
          {(attachment) => <PromptInputAttachment data={attachment} />}
        </PromptInputAttachments>
      </PromptInputHeader>

      <PromptInputBody>
        <PromptInputTextarea
          onChange={(e) => setInput(e.target.value)}
          value={input}
          placeholder={placeholder || (projectName ? `New chat in ${projectName}...` : "What's on your mind?")}
        />
      </PromptInputBody>

      <PromptInputFooter className="flex items-center justify-between gap-2">
        {/* Left group: Action buttons */}
        <PromptInputTools className="gap-1">
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger />
            <PromptInputActionMenuContent>
              <PromptInputActionAddAttachments />
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>
          <PromptInputButton
            variant={webSearch ? 'default' : 'ghost'}
            onClick={() => setWebSearch(!webSearch)}
            title={webSearch ? "Web search enabled" : "Enable web search"}
          >
            <GlobeIcon size={16} />
          </PromptInputButton>
          {/* Context Monitor - AI Elements Context Component */}
          <Context
            usedTokens={contextUsage.tokensUsed}
            maxTokens={contextUsage.contextLimit}
            modelId={model}
          >
            <ContextTrigger
              className={cn(
                "h-8 px-2",
                contextUsage.usageState === 'critical' && "text-destructive",
                contextUsage.usageState === 'warning' && "text-amber-600"
              )}
            />
            <ContextContent side="top" align="start">
              <ContextContentHeader />
              <ContextContentBody className="space-y-1">
                {/* Segment breakdown */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-slate-500/80" />
                      <span className="text-muted-foreground">System</span>
                    </span>
                    <span className="font-mono">{formatTokenCount(contextUsage.segments.system)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-muted-foreground">History</span>
                    </span>
                    <span className="font-mono">{formatTokenCount(contextUsage.segments.history)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      <span className="text-muted-foreground">Draft</span>
                    </span>
                    <span className="font-mono">{formatTokenCount(contextUsage.segments.draft)}</span>
                  </div>
                </div>
                {isCompressing && (
                  <p className="text-xs text-muted-foreground animate-pulse">
                    Compressing…
                  </p>
                )}
              </ContextContentBody>
              <ContextContentFooter>
                <span className="text-muted-foreground">Model</span>
                <span className="truncate max-w-32">{model.split('/').pop()}</span>
              </ContextContentFooter>
            </ContextContent>
          </Context>
        </PromptInputTools>

        {/* Right group: Model selector + Submit */}
        <div className="flex items-center gap-1">
          <PromptInputSelect
            onValueChange={(value) => {
              setModel(value);
            }}
            value={model}
          >
            <PromptInputSelectTrigger>
              <PromptInputSelectValue />
            </PromptInputSelectTrigger>
            <PromptInputSelectContent>
              {models.map((model) => (
                <PromptInputSelectItem key={model.value} value={model.value}>
                  {model.name}
                </PromptInputSelectItem>
              ))}
            </PromptInputSelectContent>
          </PromptInputSelect>
          <PromptInputSubmit
            disabled={(!input && !status) || isCompressing}
            status={isCompressing ? 'submitted' : status}
            onClick={(e) => {
              if (status === 'streaming') {
                e.preventDefault();
                stop();
              }
            }}
          />
        </div>
      </PromptInputFooter>
    </PromptInput>
  );

  // Loading state: Show while loading history or preparing auto-submit
  if (isLoadingHistory && messages.length === 0) {
    return (
      <div className={cn("flex flex-col h-full items-center justify-center p-3 md:p-6", className)}>
        <div className="flex flex-col items-center gap-3">
          <Loader className="h-8 w-8" />
          <p className="text-sm text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  // Empty state: Centered input layout with greeting
  // Don't show empty state if a message is being sent (status is submitted/streaming)
  if (messages.length === 0 && !isLoadingHistory && status !== 'submitted' && status !== 'streaming') {
    // Project variant: minimal empty state without Bobo
    if (variant === 'project') {
      return (
        <div className={cn("flex flex-col h-full p-3 md:p-6", className)}>
          {/* Sidebar trigger - shown on mobile or when sidebar is collapsed on desktop */}
          {showTrigger && (
            <div className="mb-4">
              <SidebarTrigger className="h-8 w-8 -ml-1" />
            </div>
          )}
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-3xl">
              {promptInputElement}
            </div>
          </div>
        </div>
      );
    }

    // Default variant: Show Bobo character and greeting
    return (
      <div className={cn("flex flex-col h-full p-3 md:p-6", className)}>
        {/* Sidebar trigger - shown on mobile or when sidebar is collapsed on desktop */}
        {showTrigger && (
          <div className="mb-2">
            <SidebarTrigger className="h-8 w-8 -ml-1" />
          </div>
        )}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-2xl">
            {/* Bobo Character and Greeting */}
            <div className="flex flex-col items-center mb-8">
              <img
                src="/bobo-character.svg"
                alt="Bobo"
                className="w-96 h-96 md:w-[32rem] md:h-[32rem] mb-0 md:mb-2 animate-bobo-breathe dark:drop-shadow-none drop-shadow-[0_0_30px_rgba(0,0,0,0.15)]"
              />
              <h1 className="text-2xl md:text-3xl font-light text-foreground/80">
                Tell Bobo Anything
              </h1>
            </div>
            {promptInputElement}
          </div>
        </div>
      </div>
    );
  }

  // Refresh chat metadata after rename or move
  const refreshChatMetadata = async () => {
    if (!chatId) return;
    try {
      const res = await fetch(`/api/chats/${chatId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.chat?.title) {
          setChatTitle(data.chat.title);
        }
        if (data.chat?.project_id !== undefined) {
          setChatProjectId(data.chat.project_id);
          // Fetch project name if chat has a project
          if (data.chat.project_id) {
            try {
              const projectRes = await fetch(`/api/projects/${data.chat.project_id}`);
              if (projectRes.ok) {
                const projectData = await projectRes.json();
                setChatProjectName(projectData.project?.name || null);
              }
            } catch {
              // Ignore project fetch errors
            }
          } else {
            setChatProjectName(null);
          }
        }
      }
    } catch (error) {
      chatLogger.error('Error refreshing chat metadata:', error);
    }
  };

  return (
    <div className={cn("flex flex-col h-full p-3 md:p-6", className)}>
      {/* Chat Header - only show when we have a chat with title */}
      {chatId && chatTitle ? (
        <ChatHeader
          chatId={chatId}
          title={chatTitle}
          projectId={chatProjectId}
          projectName={chatProjectName}
          onTitleChange={refreshChatMetadata}
          onDelete={() => {
            // Reset state and redirect handled by DeleteDialog
            setChatId(null);
            setChatTitle(null);
            setChatProjectName(null);
            setMessages([]);
          }}
        />
      ) : (
        /* Sidebar trigger - fallback when no ChatHeader (shown on mobile or collapsed) */
        showTrigger && (
          <div className="mb-3">
            <SidebarTrigger className="h-8 w-8 -ml-1" />
          </div>
        )
      )}

      <Conversation className="h-full">
        <ConversationContent>
          {isClaudeModel(model) && toolSteps.length > 0 && (
            <div className="mb-4">
              <ChainOfThought defaultOpen>
                <ChainOfThoughtHeader>Agent Steps</ChainOfThoughtHeader>
                <ChainOfThoughtContent>
                  {toolSteps.map((step) => {
                    const Icon = getToolIcon(step.toolName);
                    const status: 'complete' | 'active' | 'pending' =
                      step.status === 'active' ? 'active' : step.status === 'pending' ? 'pending' : 'complete';
                    const isError = step.success === false;
                    const previewInput =
                      step.input?.command ||
                      step.input?.file_path ||
                      step.input?.pattern ||
                      step.input?.query;
                    const trimmedOutput =
                      step.output && step.output.length > 800
                        ? `${step.output.slice(0, 800)}…`
                        : step.output;

                    return (
                      <ChainOfThoughtStep
                        key={step.id}
                        icon={Icon}
                        label={step.toolName || 'Tool'}
                        status={status}
                        className={cn(isError && 'text-destructive')}
                        description={previewInput ? String(previewInput) : undefined}
                      >
                        {step.duration !== undefined && (
                          <div className="text-[11px] text-muted-foreground">
                            {step.duration} ms
                          </div>
                        )}
                        {trimmedOutput && (
                          <pre className="text-xs text-muted-foreground whitespace-pre-wrap rounded-md bg-muted/50 p-2">
                            {trimmedOutput}
                          </pre>
                        )}
                        {isError && (
                          <div className="flex items-center gap-1 text-xs text-destructive">
                            <AlertTriangleIcon className="size-3" />
                            <span>Tool reported an error</span>
                          </div>
                        )}
                      </ChainOfThoughtStep>
                    );
                  })}
                </ChainOfThoughtContent>
              </ChainOfThought>
            </div>
          )}
          {messages.map((message) => (
            <div key={message.id}>
              {message.role === 'assistant' && message.parts.filter((part) => part.type === 'source-url').length > 0 && (
                <Sources>
                  <SourcesTrigger
                    count={
                      message.parts.filter(
                        (part) => part.type === 'source-url',
                      ).length
                    }
                  />
                  {message.parts.filter((part) => part.type === 'source-url').map((part, i) => (
                    <SourcesContent key={`${message.id}-${i}`}>
                      <Source
                        key={`${message.id}-${i}`}
                        href={part.url}
                        title={part.url}
                      />
                    </SourcesContent>
                  ))}
                </Sources>
              )}
              {message.parts.map((part, i) => {
                const partType = part.type as string;

                if (partType === 'text') {
                  const plainText = (part as { text?: string }).text || '';

                  // Parse text to extract thinking blocks (for Agent Mode)
                  const parsedContent = parseMessageContent(plainText);

                  // Custom component mapping to replace <sup> with CitationMarker
                  const citationComponents = {
                    sup: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
                      if (className === 'citation-marker') {
                        const text = children?.toString() || '';
                        const match = text.match(/^\[(\d+)\]$/);

                        if (match) {
                          const citationNumber = parseInt(match[1], 10);
                          return (
                            <CitationMarker
                              key={`cite-${citationNumber}`}
                              number={citationNumber}
                              onClick={() => {
                                const citationElement = document.querySelector(`[data-citation="${citationNumber}"]`);
                                citationElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                              }}
                            />
                          );
                        }
                      }

                      return <sup className={className}>{children}</sup>;
                    },
                  };

                  // Check if this is the last part of the last message (for streaming detection)
                  const isLastPartOfLastMessage = i === message.parts.length - 1 && message.id === messages.at(-1)?.id;

                  return (
                    <div key={`${message.id}-${i}`}>
                      {parsedContent.map((parsed, j) => {
                        if (parsed.type === 'thinking') {
                          // Render thinking blocks with Reasoning component
                          return (
                            <Reasoning
                              key={`${message.id}-${i}-thinking-${j}`}
                              className="w-full mb-2"
                              isStreaming={status === 'streaming' && isLastPartOfLastMessage}
                            >
                              <ReasoningTrigger>Agent Thinking</ReasoningTrigger>
                              <ReasoningContent>{parsed.content}</ReasoningContent>
                            </Reasoning>
                          );
                        }

                        // Render text content with MessageResponse
                        // Wrap [1], [2] markers in <sup> tags for citation styling
                        const textWithSupTags = parsed.content.replace(/\[(\d+)\]/g, '<sup class="citation-marker">[$1]</sup>');
                        const isStreamingResponse =
                          status === 'streaming' && isLastPartOfLastMessage && j === parsedContent.length - 1;

                        return (
                          <Message key={`${message.id}-${i}-text-${j}`} from={message.role}>
                            <MessageContent>
                              {isStreamingResponse ? (
                                <StreamingMessageResponse
                                  text={parsed.content}
                                  rehypePlugins={[rehypeRaw as Pluggable]}
                                  components={citationComponents}
                                />
                              ) : (
                                <MessageResponse
                                  rehypePlugins={[rehypeRaw as Pluggable]}
                                  components={citationComponents}
                                >
                                  {textWithSupTags}
                                </MessageResponse>
                              )}
                            </MessageContent>
                            {message.role === 'assistant' && isLastPartOfLastMessage && j === parsedContent.length - 1 && (
                              <MessageActions>
                                <MessageAction
                                  onClick={handleRegenerate}
                                  label="Retry"
                                >
                                  <RefreshCcwIcon className="size-3" />
                                </MessageAction>
                                <MessageAction
                                  onClick={() =>
                                    navigator.clipboard.writeText((part as { text?: string }).text || '')
                                  }
                                  label="Copy"
                                >
                                  <CopyIcon className="size-3" />
                                </MessageAction>
                              </MessageActions>
                            )}
                          </Message>
                        );
                      })}
                    </div>
                  );
                }

                if (partType === 'reasoning') {
                  const reasoningText = (part as { text?: string }).text ?? '';
                  return (
                    <Reasoning
                      key={`${message.id}-${i}`}
                      className="w-full"
                      isStreaming={status === 'streaming' && i === message.parts.length - 1 && message.id === messages.at(-1)?.id}
                    >
                      <ReasoningTrigger />
                      <ReasoningContent>{reasoningText}</ReasoningContent>
                    </Reasoning>
                  );
                }

                // Don't render source parts directly (they'll be in CitationsList)
                if (partType === 'project-source' || partType === 'global-source') {
                  return null;
                }

                return null;
              })}

              {/* Render citations list at bottom for assistant messages */}
              {message.role === 'assistant' && (
                <CitationsList
                  sources={
                    (message.parts as unknown as MessagePart[]).filter(
                      (p) => p.type === 'project-source' || p.type === 'global-source'
                    )
                  }
                  projectId={projectId}
                />
              )}
            </div>
          ))}
          {/* Show "Thinking" during submitted OR during streaming with no visible text yet */}
          {(status === 'submitted' || (status === 'streaming' && !hasVisibleAssistantText(messages))) && (
            <Reasoning isStreaming={true} className="w-full">
              <ReasoningTrigger />
              <ReasoningContent>{''}</ReasoningContent>
            </Reasoning>
          )}
          {error && (
            <div className="flex flex-col gap-3 w-full max-w-[80%]">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertTriangleIcon className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium text-destructive">
                    Failed to get response
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {error.message || 'An error occurred while processing your message. This might be a temporary issue.'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerate}
                    className="mt-2"
                  >
                    <RotateCcwIcon className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </div>
            </div>
          )}
          {/* Show timeout warning and continue button when response timed out */}
          {timeoutOccurred && continuationToken && status === 'ready' && (
            <div className="flex flex-col gap-3 mt-4">
              <TimeoutWarning message="Response was interrupted due to server timeout. Your partial response has been saved." />
              <ContinueButton
                continuationToken={continuationToken}
                model={model}
                onContinue={() => chatLogger.info('[UI] Continue button clicked')}
                onSuccess={() => {
                  chatLogger.info('[UI] Continuation succeeded');
                  handleContinue();
                }}
                onError={(err) => chatLogger.error('[UI] Continuation failed:', err)}
                disabled={isContinuing}
              />
            </div>
          )}
          {/* Show loading state when continuing */}
          {isContinuing && (
            <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
              <Loader className="h-4 w-4" />
              <span>Continuing response...</span>
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {promptInputElement}
    </div>
  );
}
