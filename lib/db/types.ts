/**
 * Database Type Definitions
 *
 * TypeScript types matching the Supabase database schema.
 * These types ensure type safety when querying the database.
 */

/**
 * Message content structure matching Vercel AI SDK UIMessage format
 */
export type MessagePart = {
  type: 'text' | 'reasoning' | 'source-url' | 'tool-result';
  text?: string;
  url?: string;
  result?: string;
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
      };
      projects: {
        Row: Project;
        Insert: ProjectInsert;
        Update: ProjectUpdate;
      };
      chats: {
        Row: Chat;
        Insert: ChatInsert;
        Update: ChatUpdate;
      };
      messages: {
        Row: Message;
        Insert: MessageInsert;
        Update: MessageUpdate;
      };
    };
    Views: {
      chats_with_projects: {
        Row: ChatWithProject;
      };
      projects_with_stats: {
        Row: ProjectWithStats;
      };
    };
    Functions: {};
    Enums: {};
  };
};
