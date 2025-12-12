/**
 * Deal File Tree Component
 *
 * Wraps Kibo UI Tree for advisory file browsing
 *
 * M312B-08: Deal File Tree (Kibo wrapper)
 */

'use client';

import { useEffect, useState } from 'react';
import {
  TreeProvider,
  TreeView,
  TreeNode,
  TreeNodeTrigger,
  TreeNodeContent,
  TreeExpander,
  TreeIcon,
  TreeLabel,
} from '@/components/kibo-ui/tree';
import type { FolderNode } from '@/lib/advisory/file-reader';
import { Loader2 } from 'lucide-react';

interface DealFileTreeProps {
  folderPath: string;
  onFileSelect: (path: string) => void;
}

export function DealFileTree({ folderPath, onFileSelect }: DealFileTreeProps) {
  const [tree, setTree] = useState<FolderNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/api/advisory/tree?basePath=${encodeURIComponent(folderPath)}`)
      .then(async res => {
        if (res.ok) return res.json();

        let errorMessage = 'Failed to load files';
        try {
          const data = (await res.json()) as { error?: string };
          if (data?.error) errorMessage = data.error;
        } catch {
          // ignore
        }

        if (res.status === 404) {
          return { tree: null };
        }

        throw new Error(errorMessage);
      })
      .then(data => setTree(data.tree))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load files'))
      .finally(() => setLoading(false));
  }, [folderPath]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading files...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive p-2">
        {error}
      </div>
    );
  }

  if (!tree || !tree.children?.length) {
    return (
      <div className="text-sm text-muted-foreground p-2">
        No files found
      </div>
    );
  }

  // Start with root expanded
  const defaultExpanded = [tree.path];

  return (
    <TreeProvider
      defaultExpandedIds={defaultExpanded}
      showLines
      showIcons
      selectable={false}
      animateExpand
      indent={16}
    >
      <TreeView className="p-0">
        <RenderNode node={tree} onFileSelect={onFileSelect} isRoot />
      </TreeView>
    </TreeProvider>
  );
}

interface RenderNodeProps {
  node: FolderNode;
  onFileSelect: (path: string) => void;
  isRoot?: boolean;
  isLast?: boolean;
  level?: number;
  parentPath?: boolean[];
}

function RenderNode({
  node,
  onFileSelect,
  isRoot = false,
  isLast = false,
  level = 0,
  parentPath = [],
}: RenderNodeProps) {
  const hasChildren = node.type === 'folder' && node.children && node.children.length > 0;

  // Skip rendering root folder itself, just render children
  if (isRoot && hasChildren) {
    return (
      <>
        {node.children!.map((child, idx) => (
          <RenderNode
            key={child.path}
            node={child}
            onFileSelect={onFileSelect}
            isLast={idx === node.children!.length - 1}
            level={0}
            parentPath={[]}
          />
        ))}
      </>
    );
  }

  return (
    <TreeNode
      nodeId={node.path}
      level={level}
      isLast={isLast}
      parentPath={parentPath}
    >
      <TreeNodeTrigger
        onClick={() => node.type === 'file' && onFileSelect(node.path)}
        className={node.type === 'file' ? 'cursor-pointer' : undefined}
      >
        <TreeExpander hasChildren={hasChildren} />
        <TreeIcon hasChildren={hasChildren} />
        <TreeLabel className={node.type === 'file' ? 'hover:underline' : undefined}>
          {node.name}
        </TreeLabel>
      </TreeNodeTrigger>
      {hasChildren && (
        <TreeNodeContent hasChildren>
          {node.children!.map((child, idx) => (
            <RenderNode
              key={child.path}
              node={child}
              onFileSelect={onFileSelect}
              isLast={idx === node.children!.length - 1}
              level={level + 1}
              parentPath={[...parentPath, isLast]}
            />
          ))}
        </TreeNodeContent>
      )}
    </TreeNode>
  );
}
