import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { chatLogger } from '@/lib/logger';

/**
 * Options for useAutoSubmit hook
 */
export interface UseAutoSubmitOptions {
  /** Current chat ID */
  chatId: string | null;
  /** Whether history is loading */
  isLoadingHistory: boolean;
  /** Number of messages in the conversation */
  messagesLength: number;
  /** Chat status from useChat */
  status: string;
  /** Function to send a message */
  sendMessage: (message: { text: string }, options: any) => void;
  /** Current model */
  model: string;
  /** Whether web search is enabled */
  webSearch: boolean;
  /** Project ID if any */
  projectId?: string;
  /** Callback when message is submitted */
  onMessageSubmitted?: () => void;
}

/**
 * Hook for auto-submitting initial messages from URL parameters
 * Handles the ?message= URL parameter for direct message submission
 */
export function useAutoSubmit(options: UseAutoSubmitOptions): void {
  const {
    chatId,
    isLoadingHistory,
    messagesLength,
    status,
    sendMessage,
    model,
    webSearch,
    projectId,
    onMessageSubmitted,
  } = options;

  const searchParams = useSearchParams();

  // Track which message we've auto-submitted to prevent duplicates
  const autoSubmittedMessageRef = useRef<string | null>(null);

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
      messagesLength,
      status: status,
      alreadySubmitted: autoSubmittedMessageRef.current === initialMessage,
    });

    chatLogger.info(`🔍 Status check: status="${status}" (will proceed if status is "ready")`);

    // Check if we've already auto-submitted this exact message
    if (initialMessage && autoSubmittedMessageRef.current === initialMessage) {
      chatLogger.info('⏭️  Already auto-submitted this message, skipping');
      return;
    }

    if (initialMessage && chatId && !isLoadingHistory && messagesLength === 0 && status === 'ready') {
      chatLogger.success('✅ All conditions met - auto-submitting message');

      // URLSearchParams.get() already returns a decoded string
      const decodedMessage = initialMessage;
      chatLogger.debug('Initial message from URL (decoded by URLSearchParams):', decodedMessage);

      // Mark this message as submitted
      autoSubmittedMessageRef.current = decodedMessage;

      // Notify that we're submitting
      if (onMessageSubmitted) {
        onMessageSubmitted();
      }

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
  }, [
    searchParams,
    chatId,
    isLoadingHistory,
    messagesLength,
    status,
    sendMessage,
    model,
    webSearch,
    projectId,
    onMessageSubmitted,
  ]);
}
