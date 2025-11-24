/**
 * Database Query Functions
 *
 * CRUD operations for all database tables.
 * These functions provide a clean API for database interactions.
 */

import { supabase, supabaseAdmin, DEFAULT_USER_ID } from './client';
import type {
  User,
  Project,
  ProjectInsert,
  ProjectUpdate,
  Chat,
  ChatInsert,
  ChatUpdate,
  Message,
  MessageInsert,
  MessageUpdate,
  File,
  FileInsert,
  FileUpdate,
  UserProfile,
  UserProfileInsert,
  UserProfileUpdate,
  ChatWithProject,
  ProjectWithStats,
  SearchResult,
} from './types';

// ============================================================================
// USER QUERIES
// ============================================================================

/**
 * Get the default user (single-user MVP)
 */
export async function getDefaultUser(): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', DEFAULT_USER_ID)
    .single();

  if (error) {
    console.error('Error fetching default user:', error);
    return null;
  }

  return data;
}

/**
 * Get the user profile for the default user
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', DEFAULT_USER_ID)
    .single();

  if (error) {
    // If no profile exists, that's expected (returns null)
    if (error.code === 'PGRST116') return null;
    
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

/**
 * Upsert (create or update) user profile
 */
export async function upsertUserProfile(
  profile: Omit<UserProfileInsert, 'user_id'>
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({
      ...profile,
      user_id: DEFAULT_USER_ID,
    }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error('Error upserting user profile:', error);
    return null;
  }

  return data;
}

// ============================================================================
// PROJECT QUERIES
// ============================================================================

/**
 * Get all projects for the default user
 */
export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', DEFAULT_USER_ID)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }

  return data || [];
}

/**
 * Get projects with stats (chat count, last activity)
 */
export async function getProjectsWithStats(): Promise<ProjectWithStats[]> {
  const { data, error } = await supabase
    .from('projects_with_stats')
    .select('*')
    .eq('user_id', DEFAULT_USER_ID)
    .order('last_activity_at', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('Error fetching projects with stats:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a single project by ID
 */
export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', DEFAULT_USER_ID)
    .single();

  if (error) {
    console.error('Error fetching project:', error);
    return null;
  }

  return data;
}

/**
 * Create a new project
 */
export async function createProject(
  project: Omit<ProjectInsert, 'user_id'>
): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      ...project,
      user_id: DEFAULT_USER_ID,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating project:', error);
    return null;
  }

  return data;
}

/**
 * Update a project
 */
export async function updateProject(
  id: string,
  updates: ProjectUpdate
): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .eq('user_id', DEFAULT_USER_ID)
    .select()
    .single();

  if (error) {
    console.error('Error updating project:', error);
    return null;
  }

  return data;
}

/**
 * Delete a project (soft delete - sets project_id to NULL on chats)
 */
export async function deleteProject(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', DEFAULT_USER_ID);

  if (error) {
    console.error('Error deleting project:', error);
    return false;
  }

  return true;
}

// ============================================================================
// CHAT QUERIES
// ============================================================================

/**
 * Get all chats for the default user
 */
export async function getChats(): Promise<Chat[]> {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('user_id', DEFAULT_USER_ID)
    .order('last_message_at', { ascending: false });

  if (error) {
    console.error('Error fetching chats:', error);
    return [];
  }

  return data || [];
}

/**
 * Get chats with project information
 */
export async function getChatsWithProjects(): Promise<ChatWithProject[]> {
  const { data, error } = await supabase
    .from('chats_with_projects')
    .select('*')
    .eq('user_id', DEFAULT_USER_ID)
    .order('last_message_at', { ascending: false });

  if (error) {
    console.error('Error fetching chats with projects:', error);
    return [];
  }

  return data || [];
}

/**
 * Get chats in a specific project
 */
export async function getChatsByProject(projectId: string): Promise<Chat[]> {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('user_id', DEFAULT_USER_ID)
    .eq('project_id', projectId)
    .order('last_message_at', { ascending: false });

  if (error) {
    console.error('Error fetching project chats:', error);
    return [];
  }

  return data || [];
}

/**
 * Get standalone chats (not in any project)
 */
export async function getStandaloneChats(): Promise<Chat[]> {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('user_id', DEFAULT_USER_ID)
    .is('project_id', null)
    .order('last_message_at', { ascending: false });

  if (error) {
    console.error('Error fetching standalone chats:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a single chat by ID
 */
export async function getChat(id: string): Promise<Chat | null> {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('id', id)
    .eq('user_id', DEFAULT_USER_ID)
    .single();

  if (error) {
    console.error('Error fetching chat:', error);
    return null;
  }

  return data;
}

/**
 * Create a new chat
 */
export async function createChat(
  chat: Omit<ChatInsert, 'user_id'>
): Promise<Chat | null> {
  const { data, error } = await supabase
    .from('chats')
    .insert({
      ...chat,
      user_id: DEFAULT_USER_ID,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating chat:', error);
    return null;
  }

  return data;
}

/**
 * Update a chat
 */
export async function updateChat(
  id: string,
  updates: ChatUpdate
): Promise<Chat | null> {
  const { data, error } = await supabase
    .from('chats')
    .update(updates)
    .eq('id', id)
    .eq('user_id', DEFAULT_USER_ID)
    .select()
    .single();

  if (error) {
    console.error('Error updating chat:', error);
    return null;
  }

  return data;
}

/**
 * Delete a chat (cascades to messages)
 */
export async function deleteChat(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('chats')
    .delete()
    .eq('id', id)
    .eq('user_id', DEFAULT_USER_ID);

  if (error) {
    console.error('Error deleting chat:', error);
    return false;
  }

  return true;
}

/**
 * Add a chat to a project
 */
export async function addChatToProject(
  chatId: string,
  projectId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('chats')
    .update({ project_id: projectId })
    .eq('id', chatId)
    .eq('user_id', DEFAULT_USER_ID);

  if (error) {
    console.error('Error adding chat to project:', error);
    return false;
  }

  return true;
}

/**
 * Remove a chat from a project (make it standalone)
 */
export async function removeChatFromProject(chatId: string): Promise<boolean> {
  const { error } = await supabase
    .from('chats')
    .update({ project_id: null })
    .eq('id', chatId)
    .eq('user_id', DEFAULT_USER_ID);

  if (error) {
    console.error('Error removing chat from project:', error);
    return false;
  }

  return true;
}

// ============================================================================
// MESSAGE QUERIES
// ============================================================================

/**
 * Get all messages for a chat (ordered by sequence)
 */
export async function getMessages(chatId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('sequence_number', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a single message by ID
 */
export async function getMessage(id: string): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching message:', error);
    return null;
  }

  return data;
}

/**
 * Create a new message
 * Automatically determines sequence_number
 */
export async function createMessage(
  message: Omit<MessageInsert, 'sequence_number'> & { sequence_number?: number }
): Promise<Message | null> {
  // If sequence_number not provided, get the next one
  let sequenceNumber = message.sequence_number;

  if (sequenceNumber === undefined) {
    const { data: lastMessage } = await supabase
      .from('messages')
      .select('sequence_number')
      .eq('chat_id', message.chat_id)
      .order('sequence_number', { ascending: false })
      .limit(1)
      .single();

    sequenceNumber = (lastMessage?.sequence_number || 0) + 1;
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      ...message,
      sequence_number: sequenceNumber,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating message:', error);
    return null;
  }

  return data;
}

/**
 * Create multiple messages at once (batch insert)
 */
export async function createMessages(
  messages: Array<Omit<MessageInsert, 'sequence_number'>>
): Promise<Message[]> {
  if (messages.length === 0) return [];

  // All messages should be for the same chat
  const chatId = messages[0].chat_id;

  // Get the next sequence number
  const { data: lastMessage } = await supabase
    .from('messages')
    .select('sequence_number')
    .eq('chat_id', chatId)
    .order('sequence_number', { ascending: false })
    .limit(1)
    .single();

  const startSequence = (lastMessage?.sequence_number || 0) + 1;

  // Add sequence numbers
  const messagesWithSequence = messages.map((msg, index) => ({
    ...msg,
    sequence_number: startSequence + index,
  }));

  const { data, error } = await supabase
    .from('messages')
    .insert(messagesWithSequence)
    .select();

  if (error) {
    console.error('Error creating messages:', error);
    return [];
  }

  return data || [];
}

/**
 * Update a message
 */
export async function updateMessage(
  id: string,
  updates: MessageUpdate
): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating message:', error);
    return null;
  }

  return data;
}

/**
 * Delete a message
 */
export async function deleteMessage(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting message:', error);
    return false;
  }

  return true;
}

/**
 * Delete all messages in a chat
 */
export async function deleteAllMessages(chatId: string): Promise<boolean> {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('chat_id', chatId);

  if (error) {
    console.error('Error deleting all messages:', error);
    return false;
  }

  return true;
}

// ============================================================================
// FILE QUERIES (M2 Phase 1)
// ============================================================================

/**
 * Get all files for a project
 */
export async function getFilesByProject(projectId: string): Promise<File[]> {
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', DEFAULT_USER_ID)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching files:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a single file by ID
 */
export async function getFile(id: string): Promise<File | null> {
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('id', id)
    .eq('user_id', DEFAULT_USER_ID)
    .single();

  if (error) {
    console.error('Error fetching file:', error);
    return null;
  }

  return data;
}

/**
 * Create a new file
 */
export async function createFile(
  file: Omit<FileInsert, 'user_id'>
): Promise<File | null> {
  const { data, error } = await supabase
    .from('files')
    .insert({
      ...file,
      user_id: DEFAULT_USER_ID,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating file:', error);
    return null;
  }

  return data;
}

/**
 * Update a file
 */
export async function updateFile(
  id: string,
  updates: FileUpdate
): Promise<File | null> {
  const { data, error } = await supabase
    .from('files')
    .update(updates)
    .eq('id', id)
    .eq('user_id', DEFAULT_USER_ID)
    .select()
    .single();

  if (error) {
    console.error('Error updating file:', error);
    return null;
  }

  return data;
}

/**
 * Delete a file
 */
export async function deleteFile(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('files')
    .delete()
    .eq('id', id)
    .eq('user_id', DEFAULT_USER_ID);

  if (error) {
    console.error('Error deleting file:', error);
    return false;
  }

  return true;
}
// ============================================================================
// SEARCH QUERIES (M2 Phase 2)
// ============================================================================

/**
 * Hybrid search for global context
 */
export async function hybridSearch(
  queryEmbedding: number[],
  threshold: number,
  limit: number,
  activeProjectId: string
): Promise<SearchResult[]> {
  const { data, error } = await supabase.rpc('hybrid_search', {
    p_query_embedding: queryEmbedding,
    p_match_threshold: threshold,
    p_match_count: limit,
    p_active_project_id: activeProjectId,
  });

  if (error) {
    console.error('Error performing hybrid search:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.result_id,
    content: row.result_content,
    similarity: row.result_similarity,
    source_type: row.result_source_type
  }));
}
