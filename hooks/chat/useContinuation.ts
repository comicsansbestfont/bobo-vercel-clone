import { useState, useEffect, useCallback } from 'react';
import type { Message as DBMessage } from '@/lib/db/types';
import { chatLogger } from '@/lib/logger';
import { toast } from 'sonner';

/**
 * Options for useContinuation hook
 */
export interface UseContinuationOptions {
  /** Current chat ID */
  chatId: string | null;
  /** Current model */
  model: string;
  /** Setter for messages array */
  setMessages: (messages: any[]) => void;
  /** Ref to setMessages to avoid stale closures */
  setMessagesRef?: React.MutableRefObject<(messages: any[]) => void>;
}

/**
 * Return type for useContinuation hook
 */
export interface UseContinuationReturn {
  /** Continuation token from the backend */
  continuationToken: string | null;
  /** Whether a timeout occurred */
  timeoutOccurred: boolean;
  /** Whether we're currently continuing */
  isContinuing: boolean;
  /** Handle continuation button click */
  handleContinue: () => Promise<void>;
  /** Clear continuation state */
  clearContinuation: () => void;
  /** Set continuation token */
  setContinuationToken: (token: string | null) => void;
  /** Set timeout occurred */
  setTimeoutOccurred: (occurred: boolean) => void;
}

/**
 * Hook for managing response continuation after timeouts
 * Handles timeout warnings and continuation tokens from the backend
 */
export function useContinuation(options: UseContinuationOptions): UseContinuationReturn {
  const { chatId, model, setMessages, setMessagesRef } = options;

  const [continuationToken, setContinuationToken] = useState<string | null>(null);
  const [timeoutOccurred, setTimeoutOccurred] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);

  // Handle continuation - resume a timed-out response
  const handleContinue = useCallback(async () => {
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
              // Use ref if available, otherwise fall back to prop
              const setMessagesFn = setMessagesRef?.current || setMessages;
              setMessagesFn(uiMessages);
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
  }, [continuationToken, isContinuing, model, chatId, setMessages, setMessagesRef]);

  // Clear continuation state
  const clearContinuation = useCallback(() => {
    setContinuationToken(null);
    setTimeoutOccurred(false);
    setIsContinuing(false);
  }, []);

  // Reset continuation state when switching chats
  useEffect(() => {
    clearContinuation();
  }, [chatId, clearContinuation]);

  return {
    continuationToken,
    timeoutOccurred,
    isContinuing,
    handleContinue,
    clearContinuation,
    setContinuationToken,
    setTimeoutOccurred,
  };
}
