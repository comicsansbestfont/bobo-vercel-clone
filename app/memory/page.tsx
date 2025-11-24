'use client';

import { Suspense, useState } from 'react';

export const dynamic = 'force-dynamic';
import { useMemories, useMemorySettings, useMemorySuggestions } from '@/lib/memory/queries';
import { MemoryHeader } from '@/components/memory/memory-header';
import { MemorySummary } from '@/components/memory/memory-summary';
import { MemorySuggestions } from '@/components/memory/memory-suggestions';
import { MemorySection } from '@/components/memory/memory-section';
import { MemorySettingsModal } from '@/components/memory/memory-settings-modal';
import { calculateTokenUsage, filterByCategory, getLastUpdated } from '@/lib/memory/utils';
import type { MemoryEntry } from '@/lib/db/types';
import { BoboSidebarOptionA } from '@/components/ui/bobo-sidebar-option-a';

export default function MemoryPage() {
  const { data: memories, isLoading } = useMemories();
  const { data: settings } = useMemorySettings();
  const { data: suggestions } = useMemorySuggestions();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const filteredMemories = searchQuery
    ? (memories?.filter((m: MemoryEntry) => m.content.toLowerCase().includes(searchQuery.toLowerCase())) ?? [])
    : (memories ?? []);

  const exportMemories = () => {
    if (!memories) return;
    const dataStr = JSON.stringify(memories, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `bobo_memories_${new Date().toISOString()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading memory...</div>}>
      <BoboSidebarOptionA>
        {isLoading ? (
          <div className="m-2 flex flex-1 flex-col rounded-2xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900 overflow-hidden">
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                <p className="mt-3 text-muted-foreground">Loading your memories...</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="m-2 flex flex-1 flex-col rounded-2xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-3 md:p-6">
              <div className="container mx-auto max-w-6xl">
                <MemoryHeader
                  onSearch={setSearchQuery}
                  onSettingsClick={() => setShowSettings(true)}
                  onExport={exportMemories}
                />

                <MemorySummary
                  totalCount={memories?.length || 0}
                  tokenUsage={calculateTokenUsage(memories)}
                  tokenBudget={settings?.token_budget || 500}
                  lastUpdated={getLastUpdated(memories)}
                />

                {suggestions && suggestions.length > 0 && (
                  <MemorySuggestions suggestions={suggestions} />
                )}

                <div className="space-y-4 mt-6">
                  <MemorySection
                    category="work_context"
                    title="Work Context"
                    description="Your current role, skills, projects, and work preferences"
                    memories={filterByCategory(filteredMemories, 'work_context')}
                    icon="💼"
                  />

                  <MemorySection
                    category="personal_context"
                    title="Personal Context"
                    description="Your location, hobbies, family, and personal background"
                    memories={filterByCategory(filteredMemories, 'personal_context')}
                    icon="👤"
                  />

                  <MemorySection
                    category="top_of_mind"
                    title="Top of Mind"
                    description="Current priorities, recent activities, and short-term focus"
                    memories={filterByCategory(filteredMemories, 'top_of_mind')}
                    icon="🎯"
                    decayBadge={true}
                  />

                  <MemorySection
                    category="brief_history"
                    title="Brief History"
                    description="Past experiences, projects, and timeline events"
                    memories={filterByCategory(filteredMemories, 'brief_history')}
                    icon="📅"
                    hasSubcategories={true}
                  />

                  <MemorySection
                    category="long_term_background"
                    title="Long-Term Background"
                    description="Education, career history, languages, and foundational facts"
                    memories={filterByCategory(filteredMemories, 'long_term_background')}
                    icon="🎓"
                  />

                  <MemorySection
                    category="other_instructions"
                    title="Other Instructions"
                    description="Communication preferences, format preferences, and interaction patterns"
                    memories={filterByCategory(filteredMemories, 'other_instructions')}
                    icon="⚙️"
                  />
                </div>

                {showSettings && (
                  <MemorySettingsModal
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </BoboSidebarOptionA>
    </Suspense>
  );
}
