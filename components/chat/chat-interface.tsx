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

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import rehypeRaw from 'rehype-raw';
import type { Pluggable } from 'unified';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import type { Message as DBMessage, MessagePart } from '@/lib/db/types';

import { CopyIcon, GlobeIcon, RefreshCcwIcon, ChevronDownIcon, ArrowUpIcon } from 'lucide-react';

import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/sources';

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
import { getContextUsage, formatTokenCount } from '@/lib/context-tracker';
import { cn } from '@/lib/utils';
import { compressHistory } from '@/lib/memory-manager';
import { toast } from 'sonner';
import { chatLogger } from '@/lib/logger';
import { ChatHeader } from './chat-header';

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
  const chatIdFromUrl = searchParams?.get('chatId');

  const [input, setInput] = useState('');
  const [model, setModel] = useState<string>(models[0].value);
  const [webSearch, setWebSearch] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [chatId, setChatId] = useState<string | null>(chatIdFromUrl);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [chatTitle, setChatTitle] = useState<string | null>(null);
  const [chatProjectId, setChatProjectId] = useState<string | null>(projectId || null);
  const [chatProjectName, setChatProjectName] = useState<string | null>(null);

  // Track which message we've auto-submitted to prevent duplicates
  const autoSubmittedMessageRef = useRef<string | null>(null);

  // Track if we just submitted a message to prevent history loading before DB persistence
  const justSubmittedRef = useRef(false);
  const persistenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { messages, sendMessage, status, regenerate, error, setMessages, stop } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      // Custom fetch to intercept response headers
      fetch: async (input, init) => {
        const response = await fetch(input, init);

        // Extract chat ID from header if creating new chat
        const responseChatId = response.headers.get('X-Chat-Id');
        if (responseChatId && !chatId) {
          // Mark that we're creating a new chat to prevent history loading
          justSubmittedRef.current = true;
          chatLogger.info('🆕 New chat created - blocking history loads until persistence completes');

          // Update state first
          setChatId(responseChatId);

          // Update URL with Next.js router (keeps router in sync)
          const params = new URLSearchParams(window.location.search);
          params.set('chatId', responseChatId);
          router.replace(`?${params.toString()}`, { scroll: false });
        }

        return response;
      },
    }),
    onError: (error) => {
      console.error('Chat error:', error);
      toast.error('Chat error', {
        description: error.message || 'An error occurred while processing your message.',
      });
    },
    onFinish: (message) => {
      // Message finished streaming and is now in the messages array
      console.log('Message finished:', message);

      // Clear the previous timeout if it exists
      if (persistenceTimeoutRef.current) {
        clearTimeout(persistenceTimeoutRef.current);
      }

      // Wait 1.5 seconds for database persistence to complete before allowing history loads
      persistenceTimeoutRef.current = setTimeout(() => {
        chatLogger.info('✅ Database persistence window complete - allowing history loads');
        justSubmittedRef.current = false;
      }, 1500);
    },
  });

  // Keep local chatId in sync with URL when navigating between chats
  useEffect(() => {
    if (!chatIdFromUrl || chatIdFromUrl === chatId) {
      return;
    }

    // Only sync when we're not in the middle of sending/streaming a message
    if (status === 'submitted' || status === 'streaming' || justSubmittedRef.current) {
      return;
    }

    chatLogger.info('🔁 Syncing chatId from URL', { chatIdFromUrl });

    setChatId(chatIdFromUrl);
    setMessages([]);
  }, [chatIdFromUrl, chatId, status, setMessages]);

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
    if (chatId !== chatIdFromUrl) return;

    // Don't load history if we already have messages (they're from streaming)
    if (messages.length > 0) {
      chatLogger.info('⏭️  Skipping history load - messages already present');
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

    async function loadChatHistory() {
      chatLogger.info('📚 Loading chat history for chatId:', chatId);
      setIsLoadingHistory(true);
      try {
        const res = await fetch(`/api/chats/${chatId}`);
        if (!res.ok) {
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

        chatLogger.success(`✅ Loaded ${uiMessages.length} messages`);
        setMessages(uiMessages);

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
        chatLogger.info('✅ Chat history loading complete - isLoadingHistory = false');
        setIsLoadingHistory(false);
      }
    }

    loadChatHistory();
  }, [chatIdFromUrl, setMessages, chatId, messages.length, status]);

  // Auto-submit initial message from URL parameter
  useEffect(() => {
    chatLogger.info('🔄 Auto-submit useEffect triggered');

    const initialMessage = searchParams?.get('message');

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

      // Decode the message (it was encoded in the URL)
      const decodedMessage = decodeURIComponent(initialMessage);
      chatLogger.debug('Decoded message:', decodedMessage);

      // Mark this message as submitted
      autoSubmittedMessageRef.current = initialMessage;

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

      // Clear the message parameter from URL
      const params = new URLSearchParams(window.location.search);
      params.delete('message');
      router.replace(`?${params.toString()}`, { scroll: false });
      chatLogger.info('🧹 Cleared message parameter from URL');
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
        console.error('History compression failed', compressionError);
      } finally {
        setIsCompressing(false);
      }
    }

    // Mark that we just submitted a message to prevent race conditions with history loading
    justSubmittedRef.current = true;
    chatLogger.info('🚀 Message submitted - blocking history loads until persistence completes');

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

  // Empty state: Centered input layout with greeting
  if (messages.length === 0 && !isLoadingHistory) {
    // Project variant: minimal empty state without Bobo
    if (variant === 'project') {
      return (
        <div className={cn("flex flex-col h-full items-center justify-center p-3 md:p-6", className)}>
          <div className="w-full max-w-3xl">
            {promptInputElement}
          </div>
        </div>
      );
    }

    // Default variant: Show Bobo character and greeting
    return (
      <div className={cn("flex flex-col h-full items-center justify-center p-3 md:p-6", className)}>
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
      console.error('Error refreshing chat metadata:', error);
    }
  };

  return (
    <div className={cn("flex flex-col h-full p-3 md:p-6", className)}>
      {/* Chat Header - only show when we have a chat with title */}
      {chatId && chatTitle && (
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
      )}

      <Conversation className="h-full">
        <ConversationContent>
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

                        return (
                          <Message key={`${message.id}-${i}-text-${j}`} from={message.role}>
                            <MessageContent>
                              <MessageResponse
                                rehypePlugins={[rehypeRaw as Pluggable]}
                                components={citationComponents}
                              >
                                {textWithSupTags}
                              </MessageResponse>
                            </MessageContent>
                            {message.role === 'assistant' && isLastPartOfLastMessage && j === parsedContent.length - 1 && (
                              <MessageActions>
                                <MessageAction
                                  onClick={() => regenerate()}
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
          {status === 'submitted' && <Loader />}
          {error && (
            <Message from="assistant">
              <MessageContent>
                <MessageResponse>
                  {`Error: ${error.message || 'An error occurred'}`}
                </MessageResponse>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {promptInputElement}
    </div>
  );
}
