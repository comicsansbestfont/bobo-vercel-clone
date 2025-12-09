import { useCallback } from 'react';
import { UIMessage } from '@ai-sdk/react';

interface UseMessageEditOptions {
  messages: UIMessage[];
  setMessages: (messages: UIMessage[]) => void;
  reload: () => void;
}

export function useMessageEdit({ messages, setMessages, reload }: UseMessageEditOptions) {
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

    // Trigger regeneration (uses last user message)
    setTimeout(() => reload(), 100);
  }, [messages, setMessages, reload]);

  return { handleEdit };
}
