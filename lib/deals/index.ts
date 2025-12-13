/**
 * Deal Workspace Module
 *
 * Module: USE-002 (Deal Workspace)
 * Status: Designed - Architecture complete, implementation pending
 *
 * Centralized exports for deal workspace operations.
 */

// Types
export type {
  Activity,
  ActivityType,
  ActivityInsert,
  ActivityUpdate,
  ActionItem,
  ActionItemStatus,
  ActionItemInsert,
  ActionItemUpdate,
  Contact,
  ContactInsert,
  ContactUpdate,
  ProjectContact,
  ProjectContactInsert,
  ProjectContactUpdate,
  DealHealth,
  TimelineEvent,
  StageChange,
  StageChangeInsert,
  Channel,
  Outcome,
  Priority,
  OwnerType,
} from './types';

// Query functions
export {
  // Activities
  getActivitiesByProject,
  createActivity,
  updateActivity,
  deleteActivity,
  // Action Items
  getActionItemsByProject,
  createActionItem,
  updateActionItem,
  deleteActionItem,
  // Contacts
  getContactsByProject,
  getContacts,
  createContact,
  updateContact,
  deleteContact,
  addContactToProject,
  removeContactFromProject,
  updateProjectContact,
  // Timeline
  getDealTimeline,
  createStageChange,
  // Health
  calculateDealHealth,
} from './queries';
