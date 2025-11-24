'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Settings, Download } from 'lucide-react';

interface MemoryHeaderProps {
  onSearch: (query: string) => void;
  onSettingsClick: () => void;
  onExport: () => void;
}

export function MemoryHeader({ onSearch, onSettingsClick, onExport }: MemoryHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
      <h1 className="text-3xl font-bold tracking-tight">Your Memory</h1>
      
      <div className="flex items-center gap-2 w-full md:w-auto">
        <div className="relative flex-1 md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search memories..."
            className="pl-9"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        
        <Button variant="outline" size="icon" onClick={onExport} title="Export Memories">
          <Download className="h-4 w-4" />
        </Button>
        
        <Button variant="outline" size="icon" onClick={onSettingsClick} title="Settings">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
