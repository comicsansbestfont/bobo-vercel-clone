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

import { useMemo, useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import type { Message as DBMessage } from '@/lib/db/types';

import { CopyIcon, GlobeIcon, RefreshCcwIcon, ChevronDownIcon } from 'lucide-react';

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

import { Loader } from '@/components/ai-elements/loader';
import { getContextUsage, formatTokenCount } from '@/lib/context-tracker';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { compressHistory } from '@/lib/memory-manager';
import { toast } from 'sonner';
import { chatLogger } from '@/lib/logger';

const models = [
  {
    name: 'GPT 5.1 Thinking',
    value: 'openai/gpt-5.1-thinking',
  },
  {
    name: 'GPT 5.1 Instant',
    value: 'openai/gpt-5.1-instant',
  },
  {
    name: 'GPT 4o',
    value: 'openai/gpt-4o',
  },
  {
    name: 'GPT 5 Pro',
    value: 'openai/gpt-5-pro',
  },
  {
    name: 'GPT 5 Mini',
    value: 'openai/gpt-5-mini',
  },
  {
    name: 'Claude Sonnet 4.5',
    value: 'anthropic/claude-sonnet-4.5',
  },
  {
    name: 'Claude Opus 4',
    value: 'anthropic/claude-opus-4',
  },
  {
    name: 'Gemini 3 Pro Preview',
    value: 'google/gemini-3-pro-preview',
  },
  {
    name: 'Gemini 2.5 Flash',
    value: 'google/gemini-2.5-flash',
  },
  {
    name: 'Deepseek R1',
    value: 'deepseek/deepseek-r1',
  },
];

interface ChatInterfaceProps {
  projectId?: string;
  className?: string;
}

export function ChatInterface({ projectId, className }: ChatInterfaceProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const chatIdFromUrl = searchParams?.get('chatId');

  const [input, setInput] = useState('');
  const [model, setModel] = useState<string>(models[0].value);
  const [webSearch, setWebSearch] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [chatId, setChatId] = useState<string | null>(chatIdFromUrl);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isContextCollapsed, setIsContextCollapsed] = useState(true);

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

    chatLogger.info(`🔍 Status check: status="${status}" (will proceed if not "in_progress")`);

    // Check if we've already auto-submitted this exact message
    if (initialMessage && autoSubmittedMessageRef.current === initialMessage) {
      chatLogger.info('⏭️  Already auto-submitted this message, skipping');
      return;
    }

    if (initialMessage && chatId && !isLoadingHistory && messages.length === 0 && status !== 'in_progress') {
      chatLogger.success('✅ All conditions met - auto-submitting message');

      const decodedMessage = decodeURIComponent(initialMessage);
      chatLogger.debug('Decoded message:', decodedMessage);

      // Mark this message as submitted
      autoSubmittedMessageRef.current = initialMessage;

      // Mark that we just submitted a message to prevent race conditions with history loading
      justSubmittedRef.current = true;
      chatLogger.info('🚀 Auto-submit - blocking history loads until persistence completes');

      // Submit the message
      chatLogger.info('📤 Calling sendMessage...');
      sendMessage({
        messages: [
          {
            id: crypto.randomUUID(),
            role: 'user',
            parts: [{ type: 'text', text: decodedMessage }],
          },
        ],
        experimental_metadata: {
          chatId,
          model,
          webSearch,
        },
      });

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

  const usageMeta = useMemo(() => {
    const segments = [
      {
        key: 'system',
        label: 'System',
        tokens: contextUsage.segments.system,
        color: 'bg-slate-500/80',
        dot: 'bg-slate-500',
      },
      {
        key: 'history',
        label: 'History',
        tokens: contextUsage.segments.history,
        color: 'bg-primary',
        dot: 'bg-primary',
      },
      {
        key: 'draft',
        label: 'Draft',
        tokens: contextUsage.segments.draft,
        color: 'bg-amber-500',
        dot: 'bg-amber-500',
      },
    ];

    const usageTextColor =
      contextUsage.usageState === 'critical'
        ? 'text-destructive'
        : contextUsage.usageState === 'warning'
        ? 'text-amber-600'
        : 'text-emerald-600';

    return {
      segments: segments.map((segment) => ({
        ...segment,
        width: Math.min(
          (segment.tokens / contextUsage.contextLimit) * 100,
          100
        ),
      })),
      usageTextColor,
    };
  }, [contextUsage]);

  return (
    <div className={cn("flex flex-col h-full p-6", className)}>
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
                switch (part.type) {
                  case 'text':
                    return (
                      <Message key={`${message.id}-${i}`} from={message.role}>
                        <MessageContent>
                          <MessageResponse>
                            {part.text}
                          </MessageResponse>
                        </MessageContent>
                        {message.role === 'assistant' && i === message.parts.length - 1 && message.id === messages.at(-1)?.id && (
                          <MessageActions>
                            <MessageAction
                              onClick={() => regenerate()}
                              label="Retry"
                            >
                              <RefreshCcwIcon className="size-3" />
                            </MessageAction>
                            <MessageAction
                              onClick={() =>
                                navigator.clipboard.writeText(part.text)
                              }
                              label="Copy"
                            >
                              <CopyIcon className="size-3" />
                            </MessageAction>
                          </MessageActions>
                        )}
                      </Message>
                    );
                  case 'reasoning':
                    return (
                      <Reasoning
                        key={`${message.id}-${i}`}
                        className="w-full"
                        isStreaming={status === 'streaming' && i === message.parts.length - 1 && message.id === messages.at(-1)?.id}
                      >
                        <ReasoningTrigger />
                        <ReasoningContent>{part.text}</ReasoningContent>
                      </Reasoning>
                    );
                  default:
                    return null;
                }
              })}
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

      <PromptInput onSubmit={handleSubmit} className="mt-4" globalDrop multiple>
        <PromptInputHeader>
          <PromptInputAttachments>
            {(attachment) => <PromptInputAttachment data={attachment} />}
          </PromptInputAttachments>
        </PromptInputHeader>

        <PromptInputBody>
          <PromptInputTextarea
            onChange={(e) => setInput(e.target.value)}
            value={input}
          />
        </PromptInputBody>

        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger />
              <PromptInputActionMenuContent>
                <PromptInputActionAddAttachments />
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
            <PromptInputButton
              variant={webSearch ? 'default' : 'ghost'}
              onClick={() => setWebSearch(!webSearch)}
            >
              <GlobeIcon size={16} />
              <span>Search</span>
            </PromptInputButton>
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

            {/* Context Monitor - Right-aligned */}
            <div className="ml-auto">
              <Collapsible
                open={!isContextCollapsed}
                onOpenChange={(open) => setIsContextCollapsed(!open)}
              >
                <CollapsibleTrigger asChild>
                  <button className="group">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
                        Context
                      </span>
                      <span className={cn('text-[10px] font-medium tabular-nums', usageMeta.usageTextColor)}>
                        {formatTokenCount(contextUsage.tokensUsed)}/{formatTokenCount(contextUsage.contextLimit)}
                      </span>
                      <ChevronDownIcon
                        className={cn(
                          'h-2.5 w-2.5 transition-all opacity-0 group-hover:opacity-60',
                          isContextCollapsed && 'rotate-180'
                        )}
                      />
                    </div>
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="absolute right-0 mt-2 p-2 rounded-lg border border-border bg-background shadow-lg z-10">
                    <div className="mb-1.5 h-0.5 w-48 overflow-hidden rounded-full bg-muted/40">
                      <div className="flex h-full w-full">
                        {usageMeta.segments.map((segment) => (
                          <div
                            key={segment.key}
                            className={cn(segment.color, 'h-full transition-all')}
                            style={{ width: `${segment.width}%` }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 text-[9px] text-muted-foreground/50">
                      {usageMeta.segments.map((segment) => (
                        <div key={segment.key} className="flex items-center gap-1">
                          <span
                            className={cn('h-1 w-1 rounded-full', segment.dot)}
                            aria-hidden
                          />
                          <span>
                            {segment.label} {formatTokenCount(segment.tokens)}
                          </span>
                        </div>
                      ))}
                    </div>
                    {isCompressing && (
                      <p className="mt-1 text-[9px] text-muted-foreground/50">
                        Compressing…
                      </p>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </PromptInputTools>
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
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
