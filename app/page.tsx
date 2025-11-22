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
  PromptInputHeader,
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
} from '@/components/ai-elements/prompt-input';

import { Suspense, useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import type { Message as DBMessage } from '@/lib/db/types';

import { CopyIcon, GlobeIcon, RefreshCcwIcon } from 'lucide-react';

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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { compressHistory } from '@/lib/memory-manager';
import { BoboSidebarOptionA } from '@/components/ui/bobo-sidebar-option-a';
import { toast } from 'sonner';

const models = [
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
    name: 'GPT 5.1 Thinking',
    value: 'openai/gpt-5.1-thinking',
  },
  {
    name: 'GPT 5.1 Instant',
    value: 'openai/gpt-5.1-instant',
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

const ChatBotDemo = () => {
  const searchParams = useSearchParams();
  const chatIdFromUrl = searchParams?.get('chatId');

  const [input, setInput] = useState('');
  const [model, setModel] = useState<string>(models[0].value);
  const [webSearch, setWebSearch] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [chatId, setChatId] = useState<string | null>(chatIdFromUrl);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const { messages, sendMessage, status, regenerate, error, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      // Custom fetch to intercept response headers
      fetch: async (input, init) => {
        const response = await fetch(input, init);

        // Extract chat ID from header if creating new chat
        const responseChatId = response.headers.get('X-Chat-Id');
        if (responseChatId && !chatId) {
          setChatId(responseChatId);
          // Update URL without reload
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('chatId', responseChatId);
            window.history.pushState({}, '', url.toString());
          }
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
    },
  });

  // Load chat history when chatId changes
  useEffect(() => {
    if (!chatId) return;

    // Only load if chatId is from URL (not just set from response)
    if (chatId !== chatIdFromUrl) return;

    async function loadChatHistory() {
      setIsLoadingHistory(true);
      try {
        const res = await fetch(`/api/chats/${chatId}`);
        if (!res.ok) {
          console.error('Failed to load chat');
          toast.error('Failed to load chat', {
            description: 'The chat could not be found or loaded.',
          });
          // Reset chatId if chat not found
          setChatId(null);
          return;
        }

        const data = await res.json();

        // Convert database messages to UIMessage format
        const uiMessages = data.messages.map((msg: DBMessage) => ({
          id: msg.id,
          role: msg.role,
          parts: msg.content.parts,
        }));

        setMessages(uiMessages);

        // Update model and webSearch from chat settings
        if (data.chat.model) {
          setModel(data.chat.model);
        }
        if (typeof data.chat.web_search_enabled === 'boolean') {
          setWebSearch(data.chat.web_search_enabled);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
        toast.error('Failed to load chat history', {
          description: 'An error occurred while loading the chat history.',
        });
        setChatId(null);
      } finally {
        setIsLoadingHistory(false);
      }
    }

    loadChatHistory();
  }, [chatIdFromUrl, setMessages]);

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

    // Send the message - AI SDK expects { text: string } as first parameter
    // The body in options contains custom data sent to the backend
    sendMessage(
      { text: message.text || 'Sent with attachments' },
      {
        body: {
          model: model,
          webSearch: webSearch,
          chatId: chatId,
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
    <BoboSidebarOptionA>
      <div className="m-2 flex flex-1 flex-col rounded-2xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex flex-col h-full p-6">
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

        {/* Context Monitor */}
        <div className="mt-2 space-y-2 rounded-lg border border-border/60 bg-background/60 p-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium uppercase tracking-wide">Context</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    'cursor-help text-sm font-semibold',
                    usageMeta.usageTextColor
                  )}
                >
                  {`Using ~${formatTokenCount(
                    contextUsage.tokensUsed
                  )} / ${formatTokenCount(contextUsage.contextLimit)} tokens`}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                Approximated usage. Older messages are summarized once the bar
                is full.
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="flex h-full w-full">
              {usageMeta.segments.map((segment) => (
                <div
                  key={segment.key}
                  className={cn(segment.color, 'h-full')}
                  style={{ width: `${segment.width}%` }}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            {usageMeta.segments.map((segment) => (
              <div key={segment.key} className="flex items-center gap-1.5">
                <span
                  className={cn('h-2 w-2 rounded-full', segment.dot)}
                  aria-hidden
                />
                <span>
                  {segment.label} · {formatTokenCount(segment.tokens)} tokens
                </span>
              </div>
            ))}
          </div>
          {isCompressing && (
            <p className="text-[11px] font-medium text-muted-foreground">
              Compressing history…
            </p>
          )}
        </div>

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
            </PromptInputTools>
            <PromptInputSubmit disabled={(!input && !status) || isCompressing} status={isCompressing ? 'submitted' : status} />
          </PromptInputFooter>
        </PromptInput>
        </div>
      </div>
    </BoboSidebarOptionA>
  );
};

export default function Page() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading chat...</div>}>
      <ChatBotDemo />
    </Suspense>
  );
}
