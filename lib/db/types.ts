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
    };
    Enums: {};
  };
};
