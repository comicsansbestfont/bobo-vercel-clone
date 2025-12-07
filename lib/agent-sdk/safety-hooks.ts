/**
 * M4-10: Safety Hooks for Agent SDK
 *
 * DISABLED: Agent SDK is not available in Vercel deployments.
 * These utility functions are retained for potential local development use.
 */

import { chatLogger } from '@/lib/logger';
import path from 'path';
import fs from 'fs';

// Stub types to replace SDK imports
type HookInput = Record<string, unknown>;

/**
 * Dangerous bash command patterns that should always be blocked
 */
const BLOCKED_BASH_PATTERNS: RegExp[] = [
  /rm\s+-rf\s+[\/~]/,           // rm -rf / or ~
  /sudo\s+rm/,                   // sudo rm
  />\s*\/dev\/sd/,               // write to disk devices
  /mkfs/,                        // format filesystem
  /dd\s+if=/,                    // disk destroyer
  /:()\{\s*:\|:&\s*\};:/,        // fork bomb
  /chmod\s+-R\s+777\s+\//,       // recursive chmod on root
  /chown\s+-R.*\//,              // recursive chown on root
  /wget.*\|\s*sh/,               // download and execute
  /curl.*\|\s*sh/,               // download and execute
  />\s*\/etc\//,                 // write to /etc
  /rm\s+.*\/\*/,                 // rm with wildcards at root level
];

/**
 * Protected files that cannot be modified
 */
const PROTECTED_FILES = [
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
];

/**
 * Protected directories that cannot be written to
 */
const PROTECTED_DIRECTORIES = [
  'node_modules/',
  '.git/',
  '.next/',
  'dist/',
  'build/',
];

/**
 * Bash safety hook - blocks dangerous commands
 */
export function checkBashSafety(input: HookInput): { allowed: boolean; reason?: string } {
  const command = String(input.command || '');

  // Check for blocked patterns
  for (const pattern of BLOCKED_BASH_PATTERNS) {
    if (pattern.test(command)) {
      chatLogger.warn('Blocked dangerous bash command:', { command, pattern: pattern.source });
      return {
        allowed: false,
        reason: `Blocked dangerous command pattern: ${pattern.source}`,
      };
    }
  }

  return { allowed: true };
}

/**
 * File write safety hook - prevents writes to protected files/directories
 */
export function checkWriteSafety(input: HookInput): { allowed: boolean; reason?: string } {
  const rawFilePath = String(input.file_path || input.path || '');
  const cwd = process.cwd();

  // Resolve to absolute path and canonicalize (removes ..)
  const resolvedPath = path.resolve(cwd, rawFilePath);

  // Use realpath for symlink resolution (if parent directory exists)
  let canonicalPath = resolvedPath;
  try {
    const parentDir = path.dirname(resolvedPath);
    if (fs.existsSync(parentDir)) {
      const resolvedParent = fs.realpathSync(parentDir);
      canonicalPath = path.join(resolvedParent, path.basename(resolvedPath));
    }
  } catch {
    // Parent doesn't exist or can't be resolved, use the resolved path
  }

  // Check if canonical path is within project directory
  if (canonicalPath !== cwd && !canonicalPath.startsWith(cwd + path.sep)) {
    chatLogger.warn('Blocked write outside project:', { rawPath: rawFilePath, canonicalPath, cwd });
    return {
      allowed: false,
      reason: `Cannot write outside project directory`,
    };
  }

  // Block writes to protected files
  for (const protectedFile of PROTECTED_FILES) {
    if (canonicalPath.endsWith(protectedFile) || canonicalPath.includes(`${path.sep}${protectedFile}`)) {
      return {
        allowed: false,
        reason: `Cannot modify protected file: ${protectedFile}`,
      };
    }
  }

  // Block writes to protected directories
  for (const protectedDir of PROTECTED_DIRECTORIES) {
    const dirName = protectedDir.replace(/\/$/, '');
    if (canonicalPath.includes(`${path.sep}${dirName}${path.sep}`) ||
        canonicalPath.endsWith(`${path.sep}${dirName}`)) {
      return {
        allowed: false,
        reason: `Cannot write to protected directory: ${protectedDir}`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Permission check function
 */
export async function canUseTool(
  toolName: string,
  input: HookInput
): Promise<{ allowed: boolean; reason?: string }> {
  switch (toolName) {
    case 'Bash':
      return checkBashSafety(input);
    case 'Write':
    case 'Edit':
      return checkWriteSafety(input);
    default:
      return { allowed: true };
  }
}

/**
 * Safety hooks configuration - DISABLED (stub)
 */
export const SAFETY_HOOKS = {};
