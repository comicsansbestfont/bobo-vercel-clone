/**
 * M4-3: Memory Integration for Agent SDK
 *
 * Injects user memory (M3) into the agent's system prompt context.
 */

import { getUserProfile, getUserMemories } from '@/lib/db';
import { chatLogger } from '@/lib/logger';

/**
 * Build memory context string from user profile and automatic memories
 */
export async function buildMemoryContext(): Promise<string> {
  const parts: string[] = [];

  // Get user profile (manual entries)
  try {
    const profile = await getUserProfile();
    if (profile) {
      const profileParts: string[] = [];
      if (profile.bio) profileParts.push(`BIO:\n${profile.bio}`);
      if (profile.background) profileParts.push(`BACKGROUND & EXPERTISE:\n${profile.background}`);
      if (profile.preferences) profileParts.push(`PREFERENCES:\n${profile.preferences}`);
      if (profile.technical_context) profileParts.push(`TECHNICAL CONTEXT:\n${profile.technical_context}`);

      if (profileParts.length > 0) {
        parts.push(`### ABOUT THE USER (Profile)\n${profileParts.join('\n\n')}`);
      }
    }
  } catch (err) {
    chatLogger.error('Failed to load user profile for agent:', err);
  }

  // Get automatic memories (M3-02)
  try {
    const memories = await getUserMemories({ relevance_threshold: 0.2, limit: 50 });

    if (memories.length > 0) {
      const sections: Record<string, string[]> = {
        work_context: [],
        personal_context: [],
        top_of_mind: [],
        brief_history: [],
        long_term_background: [],
        other_instructions: [],
      };

      // Group by category
      for (const memory of memories) {
        if (sections[memory.category]) {
          sections[memory.category].push(`- ${memory.content}`);
        }
      }

      const memoryParts: string[] = [];

      if (sections.work_context.length > 0) {
        memoryParts.push(`WORK CONTEXT:\n${sections.work_context.slice(0, 5).join('\n')}`);
      }
      if (sections.personal_context.length > 0) {
        memoryParts.push(`PERSONAL CONTEXT:\n${sections.personal_context.slice(0, 5).join('\n')}`);
      }
      if (sections.top_of_mind.length > 0) {
        memoryParts.push(`TOP OF MIND:\n${sections.top_of_mind.slice(0, 5).join('\n')}`);
      }
      if (sections.brief_history.length > 0) {
        memoryParts.push(`BRIEF HISTORY:\n${sections.brief_history.slice(0, 5).join('\n')}`);
      }
      if (sections.long_term_background.length > 0) {
        memoryParts.push(`BACKGROUND:\n${sections.long_term_background.slice(0, 5).join('\n')}`);
      }
      if (sections.other_instructions.length > 0) {
        memoryParts.push(`PREFERENCES:\n${sections.other_instructions.slice(0, 5).join('\n')}`);
      }

      if (memoryParts.length > 0) {
        parts.push(`### USER MEMORY (Automatic)\n${memoryParts.join('\n\n')}`);
      }
    }
  } catch (err) {
    chatLogger.error('Failed to fetch user memories for agent:', err);
  }

  return parts.join('\n\n');
}

/**
 * Format a category name for display
 */
export function formatCategoryName(category: string): string {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
