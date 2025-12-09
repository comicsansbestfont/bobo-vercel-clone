import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { chatLogger } from '@/lib/logger';

/**
 * Options for useChatState hook
 */
export interface UseChatStateOptions {
  /** Project ID to associate with the chat */
  projectId?: string;
  /** Initial project name */
  projectName?: string;
}

/**
 * Return type for useChatState hook
 */
export interface UseChatStateReturn {
  // Chat ID management
  chatId: string | null;
  setChatId: (chatId: string | null) => void;
  chatIdSynced: boolean;

  // Chat metadata
  chatTitle: string | null;
  setChatTitle: (title: string | null) => void;
  chatProjectId: string | null;
  setChatProjectId: (projectId: string | null) => void;
  chatProjectName: string | null;
  setChatProjectName: (projectName: string | null) => void;

  // Helper methods
  refreshChatMetadata: () => Promise<void>;

  // Internal refs for coordination with other hooks
  isAutoGeneratingChatIdRef: React.MutableRefObject<boolean>;
}

/**
 * Hook for managing chat state (ID, title, project metadata)
 * Handles chatId generation, URL synchronization, and metadata management
 */
export function useChatState(options: UseChatStateOptions = {}): UseChatStateReturn {
  const { projectId, projectName } = options;
  const searchParams = useSearchParams();
  const router = useRouter();
  const chatIdFromUrl = searchParams?.get('chatId');

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

  // Chat metadata state
  const [chatTitle, setChatTitle] = useState<string | null>(null);
  const [chatProjectId, setChatProjectId] = useState<string | null>(projectId || null);
  const [chatProjectName, setChatProjectName] = useState<string | null>(projectName || null);

  // Track when we're auto-generating a chatId to prevent the sync effect from clearing it
  const isAutoGeneratingChatIdRef = useRef(false);

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
      setChatId(null);
      setChatTitle(null);
      setChatProjectName(null);
      return;
    }

    if (!chatIdFromUrl || chatIdFromUrl === chatId) {
      return;
    }

    chatLogger.info('🔁 Syncing chatId from URL', { chatIdFromUrl });
    setChatId(chatIdFromUrl);
    setChatTitle(null);
    setChatProjectName(null);
  }, [chatIdFromUrl, chatId, chatIdSynced]);

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

  return {
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
  };
}
