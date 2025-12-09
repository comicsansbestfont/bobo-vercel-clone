/**
 * Advisory Folder Browser Tree View
 *
 * Recursive tree component for browsing advisory folder structure
 *
 * M312A-05: Advisory Folder Browser Tree View
 */

'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FolderNode } from '@/lib/advisory/file-reader';

interface FolderBrowserProps {
  tree: FolderNode;
  selectedPath?: string;
  onFileSelect?: (path: string) => void;
}

export function FolderBrowser({ tree, selectedPath, onFileSelect }: FolderBrowserProps) {
  return (
    <div className="h-full overflow-auto p-4">
      <TreeNode
        node={tree}
        selectedPath={selectedPath}
        onFileSelect={onFileSelect}
        level={0}
      />
    </div>
  );
}

interface TreeNodeProps {
  node: FolderNode;
  selectedPath?: string;
  onFileSelect?: (path: string) => void;
  level: number;
}

function TreeNode({ node, selectedPath, onFileSelect, level }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels

  const isSelected = selectedPath === node.path;
  const isFolder = node.type === 'folder';

  const handleClick = () => {
    if (isFolder) {
      setIsExpanded(!isExpanded);
    } else {
      onFileSelect?.(node.path);
    }
  };

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer hover:bg-accent transition-colors',
          isSelected && 'bg-accent font-medium'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        {isFolder ? (
          <>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            )}
            <Folder className="h-4 w-4 flex-shrink-0 text-blue-500" />
          </>
        ) : (
          <>
            <div className="w-4 flex-shrink-0" />
            <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          </>
        )}
        <span className="text-sm truncate">{node.name}</span>
      </div>

      {isFolder && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              selectedPath={selectedPath}
              onFileSelect={onFileSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
