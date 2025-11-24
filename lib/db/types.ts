/**
 * Database Type Definitions
 *
 * TypeScript types matching the Supabase database schema.
 * These types ensure type safety when querying the database.
 */

/**
 * Message content structure matching Vercel AI SDK UIMessage format
 * Extended with inline citation support for Double-Loop architecture
 */
export type MessagePart = {
  type: 'text' | 'reasoning' | 'source-url' | 'tool-result' | 'project-source' | 'global-source';
  text?: string;
  url?: string;
  result?: string;

  // Citation metadata (for project-source and global-source types)
  sourceId?: string;           // file_id or message_id from database
  sourceType?: 'project-file' | 'global-file' | 'global-message';
  sourceTitle?: string;        // filename or message preview
  projectId?: string;          // for global sources, which project they came from
  projectName?: string;        // for global sources, project display name
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
  role: 'user' | 'assistant' | 'system';
  content: MessageContent;
  token_count: number;
  created_at: string;
  sequence_number: number;
  embedding?: string | number[]; // Vector embedding
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
  source_type: 'manual' | 'extracted' | 'suggested';
  source_chat_ids: string[];
  source_project_ids: string[];
  source_message_count: number;
  time_period: 'current' | 'recent' | 'past' | 'long_ago';
  relevance_score: number;
  last_updated: string;
  last_mentioned: string;
  created_at: string;
  content_hash: string;
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
 * Insert types (for creating new rows)
 * Omits auto-generated fields like id, timestamps
 */
export type UserInsert = Omit<User, 'id' | 'created_at' | 'updated_at'> & {
  id?: string; // Optional for explicit UUID
};

export type ProjectInsert = Omit<Project, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type ChatInsert = Omit<
  Chat,
  'id' | 'created_at' | 'updated_at' | 'last_message_at'
> & {
  id?: string;
};

export type MessageInsert = Omit<Message, 'id' | 'created_at'> & {
  id?: string;
};

export type FileInsert = Omit<File, 'id' | 'created_at'> & {
  id?: string;
};

export type UserProfileInsert = Omit<UserProfile, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type MemoryEntryInsert = Omit<
  MemoryEntry,
  'id' | 'created_at' | 'last_updated' | 'last_mentioned'
> & {
  id?: string;
  last_updated?: string;
  last_mentioned?: string;
};

export type MemoryConsolidationLogInsert = Omit<MemoryConsolidationLog, 'id' | 'created_at'> & {
  id?: string;
};

export type MemorySuggestionInsert = Omit<MemorySuggestion, 'id' | 'created_at'> & {
  id?: string;
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
  Omit<Message, 'id' | 'chat_id' | 'created_at'>
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
    };
    Enums: {};
  };
};
