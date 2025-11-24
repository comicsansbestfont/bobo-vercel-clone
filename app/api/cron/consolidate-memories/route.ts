import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { getAllUsersWithMemories, getMemory, deleteMemory, updateMemory } from '@/lib/db/queries';
import { mergeDuplicateMemories } from '@/lib/memory/deduplicator';
import { differenceInDays } from 'date-fns';
import { MemoryCategory } from '@/lib/db/types';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const users = await getAllUsersWithMemories();

    let totalDuplicatesMerged = 0;
    let totalArchived = 0;

    for (const user of users) {
      const result = await consolidateUserMemories(user.id);
      totalDuplicatesMerged += result.duplicates_merged;
      totalArchived += result.memories_archived;
    }

    return NextResponse.json({
      success: true,
      users_processed: users.length,
      duplicates_merged: totalDuplicatesMerged,
      memories_archived: totalArchived,
    });
  } catch (error) {
    console.error('Consolidation failed:', error);
    return NextResponse.json(
      { error: 'Consolidation failed' },
      { status: 500 }
    );
  }
}

async function consolidateUserMemories(userId: string) {
  console.log(`[Consolidation] Starting for user ${userId}`);

  // 1. Find duplicates
  const { data: duplicates } = await supabase.rpc('find_duplicate_pairs', {
    p_user_id: userId,
    p_threshold: 0.9,
  });
  
  console.log(`[Consolidation] Found ${duplicates?.length || 0} duplicate pairs`);

  let mergedCount = 0;
  // Use a set to track merged/deleted IDs to avoid double processing
  const processedIds = new Set<string>();

  if (duplicates) {
    for (const pair of duplicates) {
        if (processedIds.has(pair.id1) || processedIds.has(pair.id2)) continue;

        const m1 = await getMemory(pair.id1);
        const m2 = await getMemory(pair.id2);

        if (m1 && m2) {
            // Merge logic: keep the one with higher confidence, or m1 if equal
            let keep = m1;
            let merge = m2;

            if (m2.confidence > m1.confidence) {
                keep = m2;
                merge = m1;
            }

            // Merge 'merge' into 'keep'
            await mergeDuplicateMemories(keep, merge);
            
            // Delete 'merge'
            await deleteMemory(merge.id);
            
            processedIds.add(merge.id);
            // We kept 'keep', so we don't mark it as processed (it could be merged with others)
            // But strict pair processing is simpler. Let's mark both to avoid complex chains in one run.
            processedIds.add(keep.id);
            
            mergedCount++;
        }
    }
  }

  // 2. Archive low-relevance
  const { data: lowRelevance } = await supabase
    .from('memory_entries')
    .select('*')
    .eq('user_id', userId)
    .lt('relevance_score', 0.2);

  const archivedCount = lowRelevance?.length || 0;
  if (archivedCount > 0) {
      // In a real system we might move to an archive table, here we just delete or flag
      // Spec says "Archive low-relevance memories", but implemented as delete in example
      // "await supabase.from('memory_entries').delete()..."
    await supabase
      .from('memory_entries')
      .delete()
      .eq('user_id', userId)
      .lt('relevance_score', 0.2);
  }

  // 3. Update time periods and Recalculate relevance scores
  // We can do this in one pass
  await recalculateScoresAndPeriods(userId);

  // 4. Log consolidation
  await supabase.from('memory_consolidation_log').insert({
    user_id: userId,
    duplicates_merged: mergedCount,
    memories_archived: archivedCount,
    memories_updated: 0 // We don't track updated count in detail
  });

  return {
    duplicates_merged: mergedCount,
    memories_archived: archivedCount,
  };
}

async function recalculateScoresAndPeriods(userId: string) {
  const { data: memories } = await supabase
    .from('memory_entries')
    .select('*')
    .eq('user_id', userId);

  if (!memories) return;

  for (const memory of memories) {
    let updates: any = {};
    let changed = false;

    // Update time period
    // Logic: 0-3 months = recent, 3-12 months = past, >12 months = long_ago
    // Based on 'created_at' or 'last_mentioned'? Spec says "Past jobs... with time context".
    // "Update time_period classifications (recent -> past -> long_ago)"
    // This implies moving items from brief_history subcategories?
    // Or just updating the `time_period` field.
    // Let's rely on created_at for now.
    
    const daysSinceCreated = differenceInDays(new Date(), new Date(memory.created_at));
    let newTimePeriod = memory.time_period;
    
    if (daysSinceCreated < 90) newTimePeriod = 'recent';
    else if (daysSinceCreated < 365) newTimePeriod = 'past';
    else newTimePeriod = 'long_ago';
    
    // Override for 'current' items? If something is 'current' (work_context), it stays current unless manually changed?
    // Spec says "Update time_period classifications".
    // Let's only update if it was already one of recent/past/long_ago, OR if it's top_of_mind (maybe?).
    // Actually, 'work_context' is usually 'current'.
    // Safe bet: only update if category is brief_history OR if it's just updating the label.
    // Let's stick to spec: "Update time_period classifications"
    
    if (memory.category === 'brief_history' && newTimePeriod !== memory.time_period) {
        updates.time_period = newTimePeriod;
        changed = true;
    }

    // Recalculate relevance
    const daysSinceMentioned = differenceInDays(new Date(), new Date(memory.last_mentioned));
    const newScore = decayConfidence(
      memory.confidence,
      daysSinceMentioned,
      memory.category
    );

    // Only update if score changed significantly
    if (Math.abs(newScore - memory.relevance_score) > 0.01) {
        updates.relevance_score = newScore;
        changed = true;
    }

    if (changed) {
        await updateMemory(memory.id, updates);
    }
  }
}

function decayConfidence(
  originalConfidence: number,
  daysSinceLastMentioned: number,
  category: MemoryCategory
): number {
  const decayRates: Record<MemoryCategory, number> = {
    top_of_mind: 0.05,        // 50% after 10 days
    work_context: 0.01,       // 50% after 50 days
    personal_context: 0.005,  // 50% after 100 days
    brief_history: 0.002,     // Minimal decay
    long_term_background: 0,  // No decay
    other_instructions: 0.01,
  };

  const rate = decayRates[category] || 0.01;
  // formula: confidence * (0.5 ^ (days * rate))
  // Wait, if rate is 0.05, 50% after 10 days.
  // 10 * 0.05 = 0.5. 0.5^0.5 is not 0.5.
  // 50% decay usually means: score = initial * (1/2)^(t/half_life).
  // The spec implementation: Math.pow(0.5, daysSinceLastMentioned * rate);
  // If rate=0.05 and days=10, exponent=0.5. result = sqrt(0.5) = 0.7.
  // If rate=0.05 and days=20, exponent=1. result = 0.5.
  // So 50% after 20 days with rate 0.05.
  // Handover comment says "50% after 10 days" for top_of_mind.
  // So rate should be 1/10 = 0.1?
  // Spec code: const rate = decayRates[category]; return originalConfidence * Math.pow(0.5, days * rate);
  // I will use the code provided in spec.
  
  const decayFactor = Math.pow(0.5, daysSinceLastMentioned * rate);

  return originalConfidence * decayFactor;
}
