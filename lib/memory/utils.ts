import { MemoryEntry, MemoryCategory } from '@/lib/db/types';
import { encode } from 'gpt-tokenizer';

export function calculateTokenUsage(memories: MemoryEntry[] = []): number {
  const text = memories.map(m => m.content).join('\n');
  try {
    return encode(text).length;
  } catch {
    // Fallback
    return Math.ceil(text.length / 4);
  }
}

export function filterByCategory(memories: MemoryEntry[] = [], category: MemoryCategory): MemoryEntry[] {
  return memories.filter(m => m.category === category);
}

export function getLastUpdated(memories: MemoryEntry[] = []): Date | null {
  if (memories.length === 0) return null;

  return memories.reduce((latest, current) => {
    const currentDate = new Date(current.last_updated || current.created_at);
    return currentDate > latest ? currentDate : latest;
  }, new Date(0));
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    work_context: 'Work Context',
    personal_context: 'Personal Context',
    top_of_mind: 'Top of Mind',
    brief_history: 'Brief History',
    long_term_background: 'Long-Term Background',
    other_instructions: 'Other Instructions',
  };
  return labels[category] || category;
}

export function getConfidenceBadge(confidence: number) {
  if (confidence >= 0.9) return { label: 'Very High', variant: 'default' as const };
  if (confidence >= 0.7) return { label: 'High', variant: 'secondary' as const };
  if (confidence >= 0.5) return { label: 'Medium', variant: 'outline' as const };
  return { label: 'Low', variant: 'destructive' as const };
}
