/**
 * Deal Workspace Type Definitions
 *
 * TypeScript types for the Deal Workspace CRM module.
 * Supports HubSpot-style 3-column interface for managing deals.
 */

/**
 * Activity types for tracking interactions with deals
 */
export type ActivityType =
  | 'call'
  | 'email'
  | 'meeting'
  | 'note'
  | 'message'
  | 'linkedin'
  | 'task_completed';

/**
 * Communication channels for activities
 */
export type Channel =
  | 'zoom'
  | 'phone'
  | 'email'
  | 'whatsapp'
  | 'linkedin'
  | 'in_person'
  | 'slack';

/**
 * Outcome classification for activities
 */
export type Outcome =
  | 'positive'
  | 'neutral'
  | 'negative'
  | 'no_answer'
  | 'left_message';

/**
 * Priority levels for action items
 */
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Status for action items
 */
export type ActionItemStatus =
  | 'todo'
  | 'in_progress'
  | 'blocked'
  | 'completed'
  | 'cancelled';

/**
 * Owner type for action items
 */
export type OwnerType = 'user' | 'contact' | 'company';

/**
 * Activity record for tracking interactions with deals
 */
export type Activity = {
  id: string;
  project_id: string;
  user_id: string;
  activity_type: ActivityType;
  activity_date: string;
  duration_mins: number | null;
  channel: Channel | null;
  direction: 'inbound' | 'outbound' | null;
  outcome: Outcome | null;
  attendees: string[];
  summary: string;
  next_steps: string | null;
  linked_file_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

/**
 * Action item for tracking follow-ups and tasks
 */
export type ActionItem = {
  id: string;
  project_id: string;
  user_id: string;
  activity_id: string | null;
  title: string;
  description: string | null;
  owner: string;
  owner_type: OwnerType;
  due_date: string | null;
  priority: Priority;
  status: ActionItemStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Contact information
 */
export type Contact = {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  company: string | null;
  role: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Project-Contact junction table
 */
export type ProjectContact = {
  id: string;
  project_id: string;
  contact_id: string;
  role_in_deal: string | null;
  is_primary: boolean;
  created_at: string;
};

/**
 * Deal health metrics
 */
export type DealHealth = {
  engagement_score: number;
  momentum_score: number;
  risk_score: number;
  overall_score: number;
  calculated_at: string;
};

/**
 * Timeline event for deal history
 */
export type TimelineEvent = {
  id: string;
  type: 'activity' | 'stage_change';
  timestamp: string;
  summary: string;
  data: Activity | StageChange;
};

/**
 * Stage change record
 */
export type StageChange = {
  id: string;
  project_id: string;
  user_id: string;
  from_stage: string | null;
  to_stage: string;
  reason: string | null;
  changed_at: string;
};

/**
 * Insert types (omit auto-generated fields)
 */
export type ActivityInsert = Omit<
  Activity,
  'id' | 'user_id' | 'created_at' | 'updated_at'
> & {
  id?: string;
  user_id?: string;
};

export type ActionItemInsert = Omit<
  ActionItem,
  'id' | 'user_id' | 'created_at' | 'updated_at'
> & {
  id?: string;
  user_id?: string;
};

export type ContactInsert = Omit<
  Contact,
  'id' | 'user_id' | 'created_at' | 'updated_at'
> & {
  id?: string;
  user_id?: string;
};

export type ProjectContactInsert = Omit<ProjectContact, 'id' | 'created_at'> & {
  id?: string;
};

export type StageChangeInsert = Omit<
  StageChange,
  'id' | 'user_id' | 'changed_at'
> & {
  id?: string;
  user_id?: string;
};

/**
 * Update types (all fields optional)
 */
export type ActivityUpdate = Partial<
  Omit<Activity, 'id' | 'project_id' | 'user_id' | 'created_at'>
>;

export type ActionItemUpdate = Partial<
  Omit<ActionItem, 'id' | 'project_id' | 'user_id' | 'created_at'>
>;

export type ContactUpdate = Partial<
  Omit<Contact, 'id' | 'user_id' | 'created_at'>
>;

export type ProjectContactUpdate = Partial<
  Omit<ProjectContact, 'id' | 'project_id' | 'contact_id' | 'created_at'>
>;
