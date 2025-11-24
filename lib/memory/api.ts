import { MemoryEntry, MemorySettings, MemoryCategory } from '@/lib/db/types';

export interface CreateMemoryData {
  category: MemoryCategory;
  subcategory?: string;
  content: string;
  summary?: string;
  confidence: number;
  source_type: 'manual';
  source_chat_ids: string[];
  source_project_ids: string[];
}

export interface MemorySuggestion {
  id: string;
  user_id: string;
  category: MemoryCategory;
  subcategory?: string;
  content: string;
  summary?: string;
  confidence: number;
  source_chat_id?: string;
  source_chat_name?: string;
  time_period?: string;
  status: 'pending' | 'accepted' | 'dismissed';
  created_at: string;
}

export const memoryApi = {
  // CREATE
  async createMemory(data: CreateMemoryData) {
    const response = await fetch('/api/memory/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create memory');
    return response.json();
  },

  // UPDATE
  async updateMemory(id: string, data: Partial<MemoryEntry>) {
    const response = await fetch(`/api/memory/entries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update memory');
    return response.json();
  },

  // DELETE
  async deleteMemory(id: string) {
    const response = await fetch(`/api/memory/entries/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete memory');
    return response.json();
  },

  // GET ALL
  async getMemories() {
    const response = await fetch('/api/memory/entries');
    if (!response.ok) throw new Error('Failed to fetch memories');
    return response.json();
  },

  // SETTINGS
  async getSettings() {
    const response = await fetch('/api/memory/settings');
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json();
  },

  async updateSettings(data: Partial<MemorySettings>) {
    const response = await fetch('/api/memory/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update settings');
    return response.json();
  },

  // SUGGESTIONS
  async getSuggestions() {
    const response = await fetch('/api/memory/suggestions');
    if (!response.ok) throw new Error('Failed to fetch suggestions');
    return response.json();
  },

  async acceptSuggestion(id: string) {
    const response = await fetch(`/api/memory/suggestions/${id}/accept`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to accept suggestion');
    return response.json();
  },

  async dismissSuggestion(id: string) {
    const response = await fetch(`/api/memory/suggestions/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to dismiss suggestion');
    return response.json();
  },

  // BULK ACTIONS
  async clearAllMemories() {
    const response = await fetch('/api/memory/clear-all', {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to clear memories');
    return response.json();
  }
};
