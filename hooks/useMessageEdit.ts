import { useCallback } from 'react';
import { UIMessage } from '@ai-sdk/react';

interface UseMessageEditOptions {
  messages: UIMessage[];
  setMessages: (messages: UIMessage[]) => void;
  reload: (options?: { body?: Record<string, unknown> }) => void;
  reloadOptions?: Record<string, unknown>;
}

export function useMessageEdit({ messages, setMessages, reload, reloadOptions }: UseMessageEditOptions) {
  const handleEdit = useCallback((messageId: string, newContent: string) => {
    // Find the message index
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    // Get messages up to and including the edited message
    const messagesUpToEdit = messages.slice(0, messageIndex);

    // Create updated message
    const editedMessage: UIMessage = {
      ...messages[messageIndex],
      parts: [{ type: 'text', text: newContent }],
    };

    // Set messages (removes all messages after edited one)
    setMessages([...messagesUpToEdit, editedMessage]);

    // Trigger regeneration with required body params (uses last user message)
    setTimeout(() => reload(reloadOptions ? { body: reloadOptions } : undefined), 100);
  }, [messages, setMessages, reload, reloadOptions]);

  return { handleEdit };
}
