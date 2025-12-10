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
  EditableMessageContent,
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
import { useRouter } from 'next/navigation';
import rehypeRaw from 'rehype-raw';
import type { Pluggable } from 'unified';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import type { MessagePart } from '@/lib/db/types';

import { CopyIcon, GlobeIcon, RefreshCcwIcon, ChevronDownIcon, ArrowUpIcon, RotateCcwIcon, BrainIcon } from 'lucide-react';
import {
  AlertTriangleIcon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supportsExtendedThinking, THINKING_PRESETS, type ThinkingPreset } from '@/lib/ai/claude-client';

// Import extracted hooks
import {
  useChatState,
  useChatHistory,
  useToolSteps,
  useContinuation,
  useAutoSubmit,
  useStreamData,
} from '@/hooks/chat';

// Import message edit hook
import { useMessageEdit } from '@/hooks/useMessageEdit';

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
import { isClaudeModel } from '@/lib/utils/model-helpers';

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

// ToolStep type is now imported from hooks/chat

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
  const router = useRouter();
  const { isMobile, state } = useSidebar();
  // Show trigger on mobile OR when sidebar is collapsed on desktop
  const showTrigger = isMobile || state === 'collapsed';

  const [input, setInput] = useState('');
  const [model, setModel] = useState<string>('anthropic/claude-opus-4-5-20251101');
  const [webSearch, setWebSearch] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  // M3.14: Extended thinking state
  const [thinkingEnabled, setThinkingEnabled] = useState(true);
  const [thinkingPreset, setThinkingPreset] = useState<ThinkingPreset>('standard');

  // Check if current model supports thinking
  const modelSupportsThinking = supportsExtendedThinking(model);
  const effectiveThinkingEnabled = thinkingEnabled && modelSupportsThinking;
  const thinkingBudget = THINKING_PRESETS[thinkingPreset];

  // Use extracted hooks for state management
  const {
    chatId,
    setChatId,
    chatIdSynced,
    chatTitle,
    setChatTitle,
    chatProjectId,
    setChatProjectId,
    chatProjectName,
    setChatProjectName,
    refreshChatMetadata,
    isAutoGeneratingChatIdRef,
  } = useChatState({ projectId, projectName });

  // Tool steps hook
  const { toolSteps, updateToolStep, clearToolSteps, getToolIcon } = useToolSteps(chatId);

  // Create a ref to hold setMessages for the continuation hook
  const setMessagesRef = useRef<(messages: any[]) => void>(() => {});

  // Continuation hook
  const {
    continuationToken,
    timeoutOccurred,
    isContinuing,
    handleContinue: handleContinueBase,
    clearContinuation,
    setContinuationToken,
    setTimeoutOccurred,
  } = useContinuation({ chatId, model, setMessages: setMessagesRef.current, setMessagesRef });

  // Stream data handler
  const { handleStreamData } = useStreamData({
    onToolStep: updateToolStep,
    onTimeoutWarning: () => setTimeoutOccurred(true),
    onContinuationToken: setContinuationToken,
  });

  // Chat history hook - placeholder setMessages and status, will be updated after useChat
  const {
    isLoadingHistory,
    loadedHistoryForChatIdRef,
    justSubmittedRef,
    persistenceTimeoutRef,
    markMessageSubmitted,
    clearLoadedHistory,
  } = useChatHistory({
    chatId,
    chatIdSynced,
    status: 'ready',
    setMessages: () => {},
    setMessagesRef, // Pass ref for access to actual setMessages after useChat initializes
    onTitleLoaded: setChatTitle,
    onModelLoaded: setModel,
    onWebSearchLoaded: setWebSearch,
    onProjectLoaded: (projectId, projectName) => {
      setChatProjectId(projectId);
      setChatProjectName(projectName);
    },
  });

  // Initialize useChat - now we can properly connect the hooks
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
          markMessageSubmitted();

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
    onFinish: markMessageSubmitted,
  });

  // Update the ref with the actual setMessages function SYNCHRONOUSLY
  // This must happen before useChatHistory's effects run to avoid race condition
  // where history loads but setMessagesRef.current is still the no-op initial value
  setMessagesRef.current = setMessages;

  // Auto-submit hook for URL message parameter
  useAutoSubmit({
    chatId,
    isLoadingHistory,
    messagesLength: messages.length,
    status,
    sendMessage,
    model,
    webSearch,
    projectId,
    onMessageSubmitted: markMessageSubmitted,
  });

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
    markMessageSubmitted();

    // Clear previous tool steps and continuation state for new request
    clearToolSteps();
    clearContinuation();

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
          // M3.14: Extended thinking parameters
          thinkingEnabled: effectiveThinkingEnabled,
          thinkingBudget: effectiveThinkingEnabled ? thinkingBudget : undefined,
        },
      },
    );
    // Clear input state after submission
    setInput('');
  };

  const handleRegenerate = () => {
    clearToolSteps();
    clearContinuation();
    regenerate({
      body: {
        model: model,
        webSearch: webSearch,
        chatId: chatId,
        projectId: projectId,
        // M3.14: Extended thinking parameters
        thinkingEnabled: effectiveThinkingEnabled,
        thinkingBudget: effectiveThinkingEnabled ? thinkingBudget : undefined,
      },
    });
  };

  // Use the continuation handler from the hook
  const handleContinue = handleContinueBase;

  // Message edit hook
  const { handleEdit } = useMessageEdit({
    messages,
    setMessages,
    reload: regenerate,
  });

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
          {/* M3.14: Extended Thinking Toggle + Preset */}
          {modelSupportsThinking && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <PromptInputButton
                  variant={effectiveThinkingEnabled ? 'default' : 'ghost'}
                  title={effectiveThinkingEnabled ? `Thinking: ${thinkingPreset}` : "Enable extended thinking"}
                  className={cn(
                    "gap-1.5",
                    effectiveThinkingEnabled && "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50"
                  )}
                >
                  <BrainIcon size={16} />
                  {effectiveThinkingEnabled && (
                    <span className="text-xs font-medium">
                      {thinkingPreset === 'quick' ? 'Quick' : thinkingPreset === 'deep' ? 'Deep' : 'Std'}
                    </span>
                  )}
                </PromptInputButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem
                  onClick={() => {
                    if (effectiveThinkingEnabled) {
                      setThinkingEnabled(false);
                    } else {
                      setThinkingEnabled(true);
                    }
                  }}
                >
                  {effectiveThinkingEnabled ? '⏸ Disable Thinking' : '▶ Enable Thinking'}
                </DropdownMenuItem>
                {effectiveThinkingEnabled && (
                  <>
                    <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
                      Thinking Budget
                    </div>
                    <DropdownMenuItem
                      onClick={() => setThinkingPreset('quick')}
                      className={cn(thinkingPreset === 'quick' && 'bg-accent')}
                    >
                      <span className="flex-1">⚡ Quick</span>
                      <span className="text-xs text-muted-foreground">4k tokens</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setThinkingPreset('standard')}
                      className={cn(thinkingPreset === 'standard' && 'bg-accent')}
                    >
                      <span className="flex-1">⚖ Standard</span>
                      <span className="text-xs text-muted-foreground">10k tokens</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setThinkingPreset('deep')}
                      className={cn(thinkingPreset === 'deep' && 'bg-accent')}
                    >
                      <span className="flex-1">🔬 Deep</span>
                      <span className="text-xs text-muted-foreground">16k tokens</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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
                          <Message key={`${message.id}-${i}-text-${j}`} from={message.role} messageId={message.id} onEdit={message.role === 'user' ? handleEdit : undefined}>
                            {message.role === 'user' ? (
                              <EditableMessageContent
                                messageId={message.id}
                                initialContent={parsed.content}
                                onEdit={handleEdit}
                              />
                            ) : (
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
                            )}
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
