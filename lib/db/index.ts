/**
 * Database Module
 *
 * Centralized exports for database operations.
 * Import from here to access all database functionality.
 */

// Client
export { supabase, supabaseAdmin, DEFAULT_USER_ID } from './client';

// Types
export type {
  User,
  Project,
  Chat,
  Message,
  File,
  ProjectInsert,
  ProjectUpdate,
  ChatInsert,
  ChatUpdate,
  MessageInsert,
  MessageUpdate,
  FileInsert,
  FileUpdate,
  ChatWithProject,
  ProjectWithStats,
  MessageContent,
  MessagePart,
  Database,
} from './types';

// Query functions
export {
  // Users
  getDefaultUser,
  // Projects
  getProjects,
  getProjectsWithStats,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  // Chats
  getChats,
  getChatsWithProjects,
  getChatsByProject,
  getStandaloneChats,
  getChat,
  createChat,
  updateChat,
  deleteChat,
  addChatToProject,
  removeChatFromProject,
  // Messages
  getMessages,
  getMessage,
  createMessage,
  createMessages,
  updateMessage,
  deleteMessage,
  deleteAllMessages,
  // Files
  getFilesByProject,
  getFile,
  createFile,
  updateFile,
  deleteFile,
} from './queries';
