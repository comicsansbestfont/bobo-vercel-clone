/**
 * Database Type Definitions
 *
 * TypeScript types matching the Supabase database schema.
 * These types ensure type safety when querying the database.
 */

// Advisory project constant UUID (M3.7)
export const ADVISORY_PROJECT_ID = '11111111-1111-1111-1111-111111111111';
export const INSPIRATION_LIBRARY_PROJECT_ID = '22222222-2222-2222-2222-222222222222';
export const REFERENCE_LIBRARY_PROJECT_ID = '33333333-3333-3333-3333-333333333333';

// M38: Entity types for project categorization
// M39: Added 'identity' for personal identity documents
export type EntityType = 'deal' | 'client' | 'personal' | 'identity';

// M3.13: Memory type for distinguishing memory kinds
export type MemoryType = 'fact' | 'question' | 'decision' | 'insight';

// M3.13: Thought thread for grouping related memories
export interface ThoughtThread {
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Message content structure matching Vercel AI SDK UIMessage format
 * Extended with inline citation support for Double-Loop architecture
 */
export type MessagePart = {
  type: 'text' | 'reasoning' | 'source-url' | 'tool-result' | 'project-source' | 'global-source' | 'project-conversation';
  text?: string;
  url?: string;
  result?: string;

  // Citation metadata (for project-source, global-source, and project-conversation types)
  sourceId?: string;           // file_id or message_id from database
  sourceType?: 'project-file' | 'global-file' | 'global-message' | 'project-conversation';
  sourceTitle?: string;        // filename or message preview
  projectId?: string;          // for global sources, which project they came from
  projectName?: string;        // for global sources, project display name
  chatId?: string;             // for project-conversation, the source chat ID
  chatTitle?: string;          // for project-conversation, the source chat title
  similarity?: number;         // relevance score (0-1) from hybrid search
  citationIndex?: number;      // position in citation list (1, 2, 3...)
};

export type MessageContent = {
  parts: MessagePart[];
};

/**
 * Database row types (what comes from the database)
 */
export type User = {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  custom_instructions: string | null;
  entity_type: EntityType;              // M38: deal, client, or personal
  advisory_folder_path: string | null;  // M38: path to advisory folder for file-reference mode
  created_at: string;
  updated_at: string;
};

export type Chat = {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  model: string;
  web_search_enabled: boolean;
  created_at: string;
  updated_at: string;
  last_message_at: string;
};

export type Message = {
  id: string;
  chat_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: MessageContent;
  token_count: number;
  created_at: string;
  sequence_number: number;
  embedding?: string | number[]; // Vector embedding
  is_partial?: boolean; // Progressive response saving
  completion_status?: 'streaming' | 'partial' | 'timeout' | 'error' | 'complete';
};

export type File = {
  id: string;
  project_id: string;
  user_id: string;
  filename: string;
  file_type: 'markdown';
  file_size: number;
  content_text: string;
  created_at: string;
  embedding?: string | number[]; // Vector embedding
  entity_type?: string | null; // M3.7: Advisory entity type
  entity_name?: string | null; // M3.7: Advisory entity name
};

export type UserProfile = {
  id: string;
  user_id: string;
  bio: string | null;
  background: string | null;
  preferences: string | null;
  technical_context: string | null;
  created_at: string;
  updated_at: string;
};

export type MemoryCategory =
  | 'work_context'
  | 'personal_context'
  | 'top_of_mind'
  | 'brief_history'
  | 'long_term_background'
  | 'other_instructions';

export type MemoryEntry = {
  id: string;
  user_id: string;
  category: MemoryCategory;
  subcategory: string | null;
  content: string;
  summary: string | null;
  confidence: number;
  source_type: 'manual' | 'extracted' | 'suggested' | 'agent_tool';
  source_chat_ids: string[];
  source_project_ids: string[];
  source_message_count: number;
  time_period: 'current' | 'recent' | 'past' | 'long_ago';
  relevance_score: number;
  last_updated: string;
  last_mentioned: string;
  created_at: string;
  content_hash: string;
  // M3.5: New fields for agent tools
  embedding?: number[] | string;
  is_active: boolean;
  deleted_reason?: string | null;
  deleted_at?: string | null;
  // M3.6-01: Access tracking fields
  last_accessed: string | null;
  access_count: number;
  // M3.6-02: Salience weighting
  importance: number;
  // M3.13: Thinking Partner fields
  memory_type?: MemoryType;
  tags?: string[];
  thread_id?: string;
};

export type MemoryConsolidationLog = {
  id: string;
  user_id: string;
  duplicates_merged: number;
  memories_archived: number;
  memories_updated: number;
  created_at: string;
};

export type MemorySettings = {
  user_id: string;
  auto_extraction_enabled: boolean;
  extraction_frequency: 'realtime' | 'daily' | 'weekly' | 'manual';
  enabled_categories: string[];
  token_budget: number;
  updated_at: string;
};

export type MemorySettingsInsert = Omit<MemorySettings, 'updated_at'> & {
  updated_at?: string;
};

export type MemorySettingsUpdate = Partial<Omit<MemorySettings, 'user_id'>>;

export type MemorySuggestion = {
  id: string;
  user_id: string;
  category: MemoryCategory;
  subcategory: string | null;
  content: string;
  summary: string | null;
  confidence: number;
  source_chat_id: string | null;
  source_chat_name: string | null;
  time_period: 'current' | 'recent' | 'past' | 'long_ago';
  status: 'pending' | 'accepted' | 'dismissed';
  created_at: string;
};

/**
 * Message continuation state for resuming interrupted AI responses
 * Used in progressive response saving to handle timeout scenarios
 */
export type MessageContinuation = {
  id: string;
  chat_id: string;
  message_id: string | null;
  accumulated_text: string;
  accumulated_parts: MessagePart[] | null;
  continuation_token: string;
  iteration_state: {
    iteration: number;
    tool_results?: Array<{ tool_use_id: string; content: string }>;
    messages_snapshot?: unknown[];
  } | null;
  created_at: string;
  expires_at: string;
  used_at: string | null;
};

/**
 * Insert types (for creating new rows)
 * Omits auto-generated fields like id, timestamps
 */
export type UserInsert = Omit<User, 'id' | 'created_at' | 'updated_at'> & {
  id?: string; // Optional for explicit UUID
};

export type ProjectInsert = Omit<Project, 'id' | 'created_at' | 'updated_at' | 'entity_type' | 'advisory_folder_path'> & {
  id?: string;
  entity_type?: EntityType;              // M38: Optional, defaults to 'personal'
  advisory_folder_path?: string | null;  // M38: Optional, NULL for non-advisory projects
};

export type ChatInsert = Omit<
  Chat,
  'id' | 'created_at' | 'updated_at' | 'last_message_at'
> & {
  id?: string;
};

export type MessageInsert = Omit<Message, 'id' | 'user_id' | 'created_at' | 'token_count' | 'is_partial' | 'completion_status'> & {
  id?: string;
  user_id?: string;
  token_count?: number;
  is_partial?: boolean;
  completion_status?: 'streaming' | 'partial' | 'timeout' | 'error' | 'complete';
};

export type FileInsert = Omit<File, 'id' | 'created_at'> & {
  id?: string;
};

export type UserProfileInsert = Omit<UserProfile, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type MemoryEntryInsert = Omit<
  MemoryEntry,
  'id' | 'created_at' | 'last_updated' | 'last_mentioned' | 'is_active' | 'deleted_reason' | 'deleted_at' | 'last_accessed' | 'access_count' | 'importance'
> & {
  id?: string;
  last_updated?: string;
  last_mentioned?: string;
  // M3.5: These fields have database defaults
  is_active?: boolean;
  deleted_reason?: string | null;
  deleted_at?: string | null;
  // M3.6-01: Access tracking fields have database defaults
  last_accessed?: string | null;
  access_count?: number;
  // M3.6-02: Importance has database default (0.5)
  importance?: number;
};

export type MemoryConsolidationLogInsert = Omit<MemoryConsolidationLog, 'id' | 'created_at'> & {
  id?: string;
};

export type MemorySuggestionInsert = Omit<MemorySuggestion, 'id' | 'created_at'> & {
  id?: string;
};

export type MessageContinuationInsert = Omit<MessageContinuation, 'id' | 'created_at' | 'used_at'> & {
  id?: string;
  used_at?: string | null;
};

/**
 * Update types (for updating existing rows)
 * All fields optional except what's required for the update
 */
export type UserUpdate = Partial<Omit<User, 'id' | 'created_at'>>;
export type ProjectUpdate = Partial<Omit<Project, 'id' | 'user_id' | 'created_at'>>;
export type ChatUpdate = Partial<
  Omit<Chat, 'id' | 'user_id' | 'created_at'>
>;
export type MessageUpdate = Partial<
  Omit<Message, 'id' | 'user_id' | 'chat_id' | 'created_at'>
>;

export type FileUpdate = Partial<
  Omit<File, 'id' | 'project_id' | 'user_id' | 'created_at'>
>;

export type UserProfileUpdate = Partial<
  Omit<UserProfile, 'id' | 'user_id' | 'created_at'>
>;

export type MemoryEntryUpdate = Partial<
  Omit<MemoryEntry, 'id' | 'user_id' | 'created_at'>
>;

export type MemorySuggestionUpdate = Partial<
  Omit<MemorySuggestion, 'id' | 'user_id' | 'created_at'>
>;

export type MessageContinuationUpdate = Partial<
  Omit<MessageContinuation, 'id' | 'chat_id' | 'created_at'>
>;

/**
 * View types (from database views)
 */
export type ChatWithProject = Chat & {
  project_name: string | null;
  message_count: number;
};

export type ProjectWithStats = Project & {
  chat_count: number;
  last_activity_at: string | null;
};

export type SearchResult = {
  id: string;
  content: string;
  similarity: number;
  source_type: 'project' | 'global';
};

/**
 * Result from intra-project message search
 * Used for cross-chat context sharing within the same project
 */
export type ProjectMessageSearchResult = {
  message_id: string;
  chat_id: string;
  chat_title: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  similarity: number;
  created_at: string;
};

/**
 * Advisory search result type (M3.7)
 * Used for searching advisory files with entity filtering
 */
export type AdvisorySearchResult = {
  id: string;
  filename: string;
  content_text: string;
  entity_type: string | null;
  entity_name: string | null;
  file_type: string;
  vector_score: number;
  text_score: number;
  combined_score: number;
};

/**
 * Supabase Database Type
 * Used by Supabase client for type inference
 */
export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: UserInsert;
        Update: UserUpdate;
        Relationships: [];
      };
      projects: {
        Row: Project;
        Insert: ProjectInsert;
        Update: ProjectUpdate;
        Relationships: [
          {
            foreignKeyName: 'projects_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      chats: {
        Row: Chat;
        Insert: ChatInsert;
        Update: ChatUpdate;
        Relationships: [
          {
            foreignKeyName: 'chats_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'chats_project_id_fkey';
            columns: ['project_id'];
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };
      messages: {
        Row: Message;
        Insert: MessageInsert;
        Update: MessageUpdate;
        Relationships: [
          {
            foreignKeyName: 'messages_chat_id_fkey';
            columns: ['chat_id'];
            referencedRelation: 'chats';
            referencedColumns: ['id'];
          }
        ];
      };
      files: {
        Row: File;
        Insert: FileInsert;
        Update: FileUpdate;
        Relationships: [
          {
            foreignKeyName: 'files_project_id_fkey';
            columns: ['project_id'];
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'files_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      user_profiles: {
        Row: UserProfile;
        Insert: UserProfileInsert;
        Update: UserProfileUpdate;
        Relationships: [
          {
            foreignKeyName: 'user_profiles_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      memory_entries: {
        Row: MemoryEntry;
        Insert: MemoryEntryInsert;
        Update: MemoryEntryUpdate;
        Relationships: [
          {
            foreignKeyName: 'memory_entries_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      memory_consolidation_log: {
        Row: MemoryConsolidationLog;
        Insert: MemoryConsolidationLogInsert;
        Update: never;
        Relationships: [
          {
            foreignKeyName: 'memory_consolidation_log_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      memory_settings: {
        Row: MemorySettings;
        Insert: MemorySettingsInsert;
        Update: MemorySettingsUpdate;
        Relationships: [
          {
            foreignKeyName: 'memory_settings_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      memory_suggestions: {
        Row: MemorySuggestion;
        Insert: MemorySuggestionInsert;
        Update: MemorySuggestionUpdate;
        Relationships: [
          {
            foreignKeyName: 'memory_suggestions_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'memory_suggestions_source_chat_id_fkey';
            columns: ['source_chat_id'];
            referencedRelation: 'chats';
            referencedColumns: ['id'];
          }
        ];
      };
      message_continuations: {
        Row: MessageContinuation;
        Insert: MessageContinuationInsert;
        Update: MessageContinuationUpdate;
        Relationships: [
          {
            foreignKeyName: 'message_continuations_chat_id_fkey';
            columns: ['chat_id'];
            referencedRelation: 'chats';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'message_continuations_message_id_fkey';
            columns: ['message_id'];
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      chats_with_projects: {
        Row: ChatWithProject;
        Relationships: [];
      };
      projects_with_stats: {
        Row: ProjectWithStats;
        Relationships: [];
      };
    };
    Functions: {
      hybrid_search: {
        Args: {
          p_query_embedding: number[];
          p_match_threshold: number;
          p_match_count: number;
          p_active_project_id: string;
        };
        Returns: {
          result_id: string;
          result_content: string;
          result_similarity: number;
          result_source_type: 'project' | 'global';
        }[];
      };
      find_similar_memories: {
        Args: {
          p_user_id: string;
          p_category: string;
          p_content: string;
          p_threshold?: number;
        };
        Returns: {
          id: string;
          content: string;
          similarity_score: number;
        }[];
      };
      find_duplicate_pairs: {
        Args: {
          p_user_id: string;
          p_threshold?: number;
        };
        Returns: {
          id1: string;
          id2: string;
          similarity_score: number;
        }[];
      };
      search_project_messages: {
        Args: {
          p_project_id: string | null;
          p_current_chat_id: string | null;
          p_query_embedding: number[];
          p_match_threshold?: number;
          p_match_count?: number;
        };
        Returns: {
          message_id: string;
          chat_id: string;
          chat_title: string;
          role: string;
          content: string;
          similarity: number;
          created_at: string;
        }[];
      };
      // M3.5: Memory agent tool functions
      hybrid_memory_search: {
        Args: {
          query_embedding: number[];
          query_text: string;
          match_count?: number;
          vector_weight?: number;
          text_weight?: number;
          p_user_id?: string;
          p_category?: string;
        };
        Returns: {
          id: string;
          category: string;
          content: string;
          confidence: number;
          last_updated: string;
          similarity: number;
        }[];
      };
      find_memories_by_embedding: {
        Args: {
          query_embedding: number[];
          similarity_threshold?: number;
          p_user_id?: string;
          match_count?: number;
        };
        Returns: {
          id: string;
          category: string;
          content: string;
          confidence: number;
          source_type: string;
          similarity: number;
        }[];
      };
      // M3.6-01: Access tracking RPC
      update_memory_access: {
        Args: {
          p_memory_ids: string[];
        };
        Returns: void;
      };
      // M3.6-02: Enhanced memory search with temporal weighting
      enhanced_memory_search: {
        Args: {
          query_embedding: number[];
          query_text: string;
          match_count?: number;
          vector_weight?: number;
          text_weight?: number;
          recency_weight?: number;
          frequency_weight?: number;
          confidence_weight?: number;
          recency_half_life_days?: number;
          min_vector_similarity?: number;
          p_user_id?: string;
          p_category?: string;
        };
        Returns: {
          id: string;
          category: string;
          content: string;
          confidence: number;
          source_type: string;
          last_accessed: string | null;
          access_count: number;
          importance: number;
          vector_score: number;
          text_score: number;
          recency_score: number;
          frequency_score: number;
          combined_score: number;
        }[];
      };
      // M3.7: Advisory file search
      search_advisory_files: {
        Args: {
          query_embedding: number[];
          query_text: string;
          p_project_id?: string;
          entity_type_filter?: string;
          entity_name_filter?: string;
          match_count?: number;
          vector_weight?: number;
          text_weight?: number;
          min_similarity?: number;
        };
        Returns: {
          id: string;
          filename: string;
          content_text: string;
          entity_type: string | null;
          entity_name: string | null;
          file_type: string;
          vector_score: number;
          text_score: number;
          combined_score: number;
        }[];
      };
    };
    Enums: Record<string, never>;
  };
};
