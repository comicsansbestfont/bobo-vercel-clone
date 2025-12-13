'use client';

import { usePathname } from 'next/navigation';

export type AppMode = 'workspace' | 'crm' | 'studio';

/**
 * Hook to derive the current app mode from the URL pathname.
 *
 * Routes:
 * - /crm/*     → CRM mode (companies, contacts, deals)
 * - /studio/*  → Studio mode (future: content creation)
 * - default    → Workspace mode (chat, projects, memory)
 */
export function useCurrentMode(): AppMode {
  const pathname = usePathname();

  if (pathname.startsWith('/crm')) return 'crm';
  if (pathname.startsWith('/studio')) return 'studio';
  return 'workspace';
}

/**
 * Check if current pathname is in CRM mode
 */
export function useIsCRMMode(): boolean {
  const mode = useCurrentMode();
  return mode === 'crm';
}

/**
 * Check if current pathname is in Studio mode
 */
export function useIsStudioMode(): boolean {
  const mode = useCurrentMode();
  return mode === 'studio';
}

/**
 * Check if current pathname is in Workspace mode
 */
export function useIsWorkspaceMode(): boolean {
  const mode = useCurrentMode();
  return mode === 'workspace';
}
