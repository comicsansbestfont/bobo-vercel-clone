import crypto from 'crypto';
import { supabase, DEFAULT_USER_ID } from '@/lib/db/client';
import { MemoryEntry, MemoryCategory } from '@/lib/db/types';
import { createMemory } from '@/lib/db/queries';

export type ExtractedFact = {
  category: MemoryCategory;
  subcategory: string | null;
  content: string;
  summary: string | null;
  confidence: number;
  source_message_id: string;
  time_period: 'current' | 'recent' | 'past' | 'long_ago';
  reasoning: string;
};

export const generateContentHash = (content: string): string => {
  return crypto
    .createHash('sha256')
    .update(content.toLowerCase().trim())
    .digest('hex');
};

export async function findExactDuplicate(
  userId: string,
  category: MemoryCategory,
  contentHash: string
): Promise<MemoryEntry | null> {
  const { data } = await supabase
    .from('memory_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('category', category)
    .eq('content_hash', contentHash)
    .single();

  return data;
}

export async function findFuzzyDuplicates(
  userId: string,
  category: MemoryCategory,
  content: string,
  threshold = 0.9
): Promise<MemoryEntry[]> {
  const { data } = await supabase.rpc('find_similar_memories', {
    p_user_id: userId,
    p_category: category,
    p_content: content,
    p_threshold: threshold,
  });

  // Fetch full objects for the results (RPC only returns id, content, score)
  if (!data || data.length === 0) return [];
  
  const ids = (data as { id: string }[]).map((d) => d.id);
  const { data: fullMemories } = await supabase
    .from('memory_entries')
    .select('*')
    .in('id', ids);

  return fullMemories || [];
}

export async function mergeDuplicateMemories(
  existing: MemoryEntry,
  newMemory: Partial<MemoryEntry>
): Promise<MemoryEntry | null> {
  const sourceChatIds = newMemory.source_chat_ids || [];
  const combinedChatIds = Array.from(new Set([...existing.source_chat_ids, ...sourceChatIds]));
  
  const updates: Partial<MemoryEntry> = {
    source_chat_ids: combinedChatIds,
    source_message_count: (existing.source_message_count || 0) + 1,
    last_mentioned: new Date().toISOString(),
  };

  if ((newMemory.confidence || 0) > existing.confidence) {
    // New is more confident, replace content but keep sources
    updates.content = newMemory.content;
    updates.confidence = newMemory.confidence;
    updates.last_updated = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('memory_entries')
    .update(updates)
    .eq('id', existing.id)
    .select()
    .single();
    
  if (error) {
    console.error('Error merging memory:', error);
    return null;
  }
  
  return data;
}

export async function deduplicateFacts(
  facts: ExtractedFact[],
  chatId: string
): Promise<MemoryEntry[]> {
  const results: MemoryEntry[] = [];
  const userId = DEFAULT_USER_ID;

  for (const fact of facts) {
    const contentHash = generateContentHash(fact.content);

    // Check exact duplicate
    const exactDupe = await findExactDuplicate(
      userId,
      fact.category,
      contentHash
    );

    if (exactDupe) {
      // Merge with existing
      const merged = await mergeDuplicateMemories(exactDupe, {
        ...fact,
        source_chat_ids: [chatId],
        content_hash: contentHash,
      });
      if (merged) results.push(merged);
      continue;
    }

    // Check fuzzy duplicates
    const fuzzyDupes = await findFuzzyDuplicates(
      userId,
      fact.category,
      fact.content
    );

    if (fuzzyDupes.length > 0) {
      // Merge with best match
      const bestMatch = fuzzyDupes[0];
      const merged = await mergeDuplicateMemories(bestMatch, {
        ...fact,
        source_chat_ids: [chatId],
        content_hash: contentHash,
      });
      if (merged) results.push(merged);
      continue;
    }

    // No duplicate, create new
    const newMemory = await createMemory({
      category: fact.category,
      subcategory: fact.subcategory,
      content: fact.content,
      summary: fact.summary,
      confidence: fact.confidence,
      source_type: 'extracted',
      source_chat_ids: [chatId],
      source_project_ids: [], // TODO: Get project ID
      source_message_count: 1,
      time_period: fact.time_period,
      relevance_score: 1.0,
      content_hash: contentHash,
    });
    
    if (newMemory) results.push(newMemory);
  }

  return results;
}
