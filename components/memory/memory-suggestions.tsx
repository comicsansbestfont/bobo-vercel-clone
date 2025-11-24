'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Sparkles } from 'lucide-react';
import { useAcceptSuggestion, useDismissSuggestion } from '@/lib/memory/queries';
import { MemorySuggestion } from '@/lib/memory/api';
import { getCategoryLabel } from '@/lib/memory/utils';

interface MemorySuggestionsProps {
  suggestions: MemorySuggestion[];
}

export function MemorySuggestions({ suggestions }: MemorySuggestionsProps) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <Card className="border-2 border-primary/20 bg-primary/5 mb-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <CardTitle>Memory Suggestions</CardTitle>
        </div>
        <CardDescription>
          We think these might be relevant memories about you. Accept or dismiss them.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.slice(0, 3).map(suggestion => (
          <SuggestionCard key={suggestion.id} suggestion={suggestion} />
        ))}
      </CardContent>
    </Card>
  );
}

function SuggestionCard({ suggestion }: { suggestion: MemorySuggestion }) {
  const acceptSuggestion = useAcceptSuggestion();
  const dismissSuggestion = useDismissSuggestion();

  const handleAccept = async () => {
    await acceptSuggestion.mutateAsync(suggestion.id);
  };

  const handleDismiss = async () => {
    await dismissSuggestion.mutateAsync(suggestion.id);
  };

  return (
    <div className="flex items-start justify-between gap-3 p-3 bg-card rounded-md border">
      <div className="flex-1">
        <p className="text-sm font-medium">{suggestion.content}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-xs">
            {getCategoryLabel(suggestion.category)}
          </Badge>
          {suggestion.source_chat_name && (
            <span className="text-xs text-muted-foreground">
              From chat "{suggestion.source_chat_name}"
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
          onClick={handleAccept}
          disabled={acceptSuggestion.isPending}
        >
          <Check className="w-4 h-4 mr-1" />
          Add
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleDismiss}
          disabled={dismissSuggestion.isPending}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
