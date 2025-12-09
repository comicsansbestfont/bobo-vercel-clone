import { useState, useEffect, useRef, type MutableRefObject } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Message as DBMessage } from '@/lib/db/types';
import { chatLogger } from '@/lib/logger';
import { toast } from 'sonner';

/**
 * Options for useChatHistory hook
 */
export interface UseChatHistoryOptions {
  /** Current chat ID */
  chatId: string | null;
  /** Whether chatId has been synced with URL */
  chatIdSynced: boolean;
  /** Chat status from useChat */
  status: string;
  /** Setter for messages array (initial value, may be no-op) */
  setMessages: (messages: any[]) => void;
  /** Ref to the actual setMessages function (updated after useChat initializes) */
  setMessagesRef?: MutableRefObject<(messages: any[]) => void>;
  /** Callback when chat title is loaded */
  onTitleLoaded?: (title: string) => void;
  /** Callback when chat model is loaded */
  onModelLoaded?: (model: string) => void;
  /** Callback when chat web search setting is loaded */
  onWebSearchLoaded?: (enabled: boolean) => void;
  /** Callback when project is loaded */
  onProjectLoaded?: (projectId: string | null, projectName: string | null) => void;
}

/**
 * Return type for useChatHistory hook
 */
export interface UseChatHistoryReturn {
  /** Whether history is currently being loaded */
  isLoadingHistory: boolean;
  /** Internal ref to track which chat we've loaded history for */
  loadedHistoryForChatIdRef: React.MutableRefObject<string | null>;
  /** Internal ref to track if we just submitted a message */
  justSubmittedRef: React.MutableRefObject<boolean>;
  /** Internal ref for persistence timeout */
  persistenceTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  /** Mark that a message was just submitted */
  markMessageSubmitted: () => void;
  /** Clear the loaded history ref (for chat switching) */
  clearLoadedHistory: () => void;
}

/**
 * Hook for managing chat history loading, persistence tracking, and synchronization
 */
export function useChatHistory(options: UseChatHistoryOptions): UseChatHistoryReturn {
  const {
    chatId,
    chatIdSynced,
    status,
    setMessages,
    setMessagesRef,
    onTitleLoaded,
    onModelLoaded,
    onWebSearchLoaded,
    onProjectLoaded,
  } = options;

  // Helper to call the most up-to-date setMessages (via ref if available)
  const callSetMessages = (messages: any[]) => {
    if (setMessagesRef?.current) {
      setMessagesRef.current(messages);
    } else {
      setMessages(messages);
    }
  };

  const searchParams = useSearchParams();
  const chatIdFromUrl = searchParams?.get('chatId');

  // Initialize to true when chatId is present to prevent empty state flash during page load
  // Check both sources to handle SSR/hydration timing
  const [isLoadingHistory, setIsLoadingHistory] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return Boolean(params.get('chatId'));
    }
    return Boolean(chatIdFromUrl);
  });

  // Track which chatId we've successfully loaded history for
  // This prevents the race condition where stale messages from a previous chat
  // cause us to skip loading history for the new chat
  const loadedHistoryForChatIdRef = useRef<string | null>(null);

  // Track if we just submitted a message to prevent history loading before DB persistence
  const justSubmittedRef = useRef(false);

  // Track persistence timeout
  const persistenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mark that a message was just submitted
  const markMessageSubmitted = () => {
    justSubmittedRef.current = true;
    chatLogger.info('🚀 Message submitted - blocking history loads until persistence completes');

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
  };

  // Clear the loaded history ref
  const clearLoadedHistory = () => {
    loadedHistoryForChatIdRef.current = null;
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (persistenceTimeoutRef.current) {
        clearTimeout(persistenceTimeoutRef.current);
      }
    };
  }, []);

  // Reset loaded history ref when chatId changes to allow loading new chat
  useEffect(() => {
    if (chatId && loadedHistoryForChatIdRef.current && loadedHistoryForChatIdRef.current !== chatId) {
      chatLogger.info('🔄 Chat changed, clearing loaded history ref', {
        from: loadedHistoryForChatIdRef.current,
        to: chatId
      });
      loadedHistoryForChatIdRef.current = null;
    }
  }, [chatId]);

  // Load chat history when chatId changes
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
            callSetMessages([]);
            return;
          }

          // Other errors (500, etc.) are real problems
          chatLogger.error('❌ Failed to load chat - Response not OK');
          toast.error('Failed to load chat', {
            description: 'The chat could not be found or loaded.',
          });
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
        callSetMessages(uiMessages);

        // Mark that we've loaded history for this chat to prevent duplicate loads
        loadedHistoryForChatIdRef.current = chatId;

        // Notify callbacks of loaded metadata
        if (data.chat.title && onTitleLoaded) {
          onTitleLoaded(data.chat.title);
        }

        if (data.chat.project_id !== undefined && onProjectLoaded) {
          // Fetch project name if chat has a project
          let projectName: string | null = null;
          if (data.chat.project_id) {
            try {
              const projectRes = await fetch(`/api/projects/${data.chat.project_id}`);
              if (projectRes.ok) {
                const projectData = await projectRes.json();
                projectName = projectData.project?.name || null;
              }
            } catch {
              // Ignore project fetch errors
            }
          }
          onProjectLoaded(data.chat.project_id, projectName);
        }

        if (data.chat.model && onModelLoaded) {
          chatLogger.debug('Setting model:', data.chat.model);
          onModelLoaded(data.chat.model);
        }

        if (typeof data.chat.web_search_enabled === 'boolean' && onWebSearchLoaded) {
          chatLogger.debug('Setting web search:', data.chat.web_search_enabled);
          onWebSearchLoaded(data.chat.web_search_enabled);
        }
      } catch (error) {
        chatLogger.error('❌ Failed to load chat history:', error);
        toast.error('Failed to load chat history', {
          description: 'An error occurred while loading the chat history.',
        });
      } finally {
        // Only mark loading complete if we're not retrying
        if (!willRetry) {
          chatLogger.info('✅ Chat history loading complete - isLoadingHistory = false');
          setIsLoadingHistory(false);
        }
      }
    }

    loadChatHistory();
  }, [
    chatIdFromUrl,
    setMessages,
    chatId,
    status,
    chatIdSynced,
    onTitleLoaded,
    onModelLoaded,
    onWebSearchLoaded,
    onProjectLoaded,
  ]);

  return {
    isLoadingHistory,
    loadedHistoryForChatIdRef,
    justSubmittedRef,
    persistenceTimeoutRef,
    markMessageSubmitted,
    clearLoadedHistory,
  };
}
