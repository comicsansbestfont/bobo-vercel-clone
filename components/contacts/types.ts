/**
 * Contact Types
 * TypeScript interfaces for contact-related components
 */

export interface Contact {
  id: string;
  user_id: string;
  company_id: string | null;
  name: string;
  name_structured: { firstName: string; lastName: string } | null;
  email: string | null;
  emails: { primaryEmail: string | null; additionalEmails: string[] } | null;
  phone: string | null;
  phones: { primaryPhoneNumber: string | null; additionalPhones: string[] } | null;
  linkedin_url: string | null;
  role: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactWithCompany extends Contact {
  company?: {
    id: string;
    name: string;
    website: string | null;
    industry: string | null;
  } | null;
}

export interface ContactActivity {
  id: string;
  activity_type: string;
  title: string | null;
  activity_date: string;
  summary: string | null;
  channel: string | null;
  direction: string | null;
}

export interface ContactEngagement {
  id: string;
  name: string;
  engagement_type: 'lead' | 'deal' | 'client';
  stage: string;
  deal_value: number | null;
  close_date: string | null;
}

export interface ContactDetail extends ContactWithCompany {
  activities: ContactActivity[];
  engagements: ContactEngagement[];
}

export interface CreateContactInput {
  name: string;
  name_structured?: { firstName: string; lastName: string };
  email?: string;
  phone?: string;
  linkedin_url?: string;
  role?: string;
  company_id?: string;
  is_primary?: boolean;
}

export interface UpdateContactInput {
  name?: string;
  name_structured?: { firstName: string; lastName: string };
  email?: string;
  phone?: string;
  linkedin_url?: string;
  role?: string;
  company_id?: string | null;
  is_primary?: boolean;
}
