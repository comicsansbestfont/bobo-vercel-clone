'use client';

import { useState, useEffect } from 'react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { MemoryCard } from './memory-card';
import { AddMemoryModal } from './add-memory-modal';
import { MemoryEntry, MemoryCategory } from '@/lib/db/types';

interface MemorySectionProps {
  category: MemoryCategory;
  title: string;
  description: string;
  memories: MemoryEntry[];
  icon: string;
  hasSubcategories?: boolean;
  decayBadge?: boolean;
}

export function MemorySection({
  category,
  title,
  description,
  memories,
  icon,
  hasSubcategories = false,
  decayBadge = false,
}: MemorySectionProps) {
  // Load initial state from localStorage
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`memory-section-${category}`);
      return stored ? JSON.parse(stored) : false;
    }
    return false;
  });

  const [showAddModal, setShowAddModal] = useState(false);

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem(`memory-section-${category}`, JSON.stringify(isExpanded));
  }, [isExpanded, category]);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent section toggle
    setShowAddModal(true);
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="border border-border rounded-lg overflow-hidden bg-card shadow-sm">
        <div className="flex items-center p-3 md:p-4 hover:bg-accent/50 transition-colors">
          <CollapsibleTrigger asChild>
            <button className="flex-1 flex items-center gap-2 md:gap-3 min-w-0 text-left">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />
              )}
              <span className="text-xl md:text-2xl flex-shrink-0">{icon}</span>
              <div className="text-left flex-1 min-w-0">
                <h2 className="text-base md:text-lg font-semibold truncate">{title}</h2>
                <p className="text-xs md:text-sm text-muted-foreground hidden md:block truncate">{description}</p>
              </div>
              <Badge variant="secondary" className="ml-1 md:ml-2 flex-shrink-0 text-xs">
                {memories.length}
              </Badge>
            </button>
          </CollapsibleTrigger>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddClick}
            className="ml-2 h-8 md:h-9 flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 md:mr-1" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </div>

        <CollapsibleContent className="border-t border-border">
          <div className="p-4 space-y-3 bg-background/50">
            {memories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-lg">
                No memories in this category yet.
                <br />
                <Button variant="link" onClick={handleAddClick} className="mt-2">
                  + Add your first memory
                </Button>
              </p>
            ) : hasSubcategories ? (
              <BriefHistorySubsections memories={memories} decayBadge={decayBadge} />
            ) : (
              memories.map(memory => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  decayBadge={decayBadge}
                />
              ))
            )}
          </div>
        </CollapsibleContent>
      </div>

      {showAddModal && (
        <AddMemoryModal
          category={category}
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </Collapsible>
  );
}

// Brief History subsections component
function BriefHistorySubsections({ memories, decayBadge }: { memories: MemoryEntry[], decayBadge: boolean }) {
  const recentMonths = memories.filter(m => m.subcategory === 'recent_months');
  const earlier = memories.filter(m => m.subcategory === 'earlier');
  const longTerm = memories.filter(m => m.subcategory === 'long_term');
  const uncategorized = memories.filter(m => !m.subcategory);

  return (
    <div className="space-y-6">
      {recentMonths.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider pl-1">Recent Months (0-3 months ago)</h3>
          <div className="space-y-3">
            {recentMonths.map(memory => (
              <MemoryCard key={memory.id} memory={memory} decayBadge={decayBadge} />
            ))}
          </div>
        </div>
      )}

      {earlier.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider pl-1">Earlier (3-12 months ago)</h3>
          <div className="space-y-3">
            {earlier.map(memory => (
              <MemoryCard key={memory.id} memory={memory} decayBadge={decayBadge} />
            ))}
          </div>
        </div>
      )}

      {longTerm.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider pl-1">Long Term (1+ year ago)</h3>
          <div className="space-y-3">
            {longTerm.map(memory => (
              <MemoryCard key={memory.id} memory={memory} decayBadge={decayBadge} />
            ))}
          </div>
        </div>
      )}
      
      {uncategorized.length > 0 && (
        <div>
           <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider pl-1">Uncategorized</h3>
           <div className="space-y-3">
            {uncategorized.map(memory => (
              <MemoryCard key={memory.id} memory={memory} decayBadge={decayBadge} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
