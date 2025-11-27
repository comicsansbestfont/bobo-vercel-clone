/**
 * M4-10: Safety Hooks for Agent SDK
 *
 * PreToolUse hooks that block dangerous commands and protect sensitive files.
 *
 * M4-11: Fixed path traversal vulnerability by using path.resolve() instead
 * of string prefix matching to properly canonicalize paths.
 */

import type {
  Options as AgentOptions,
  HookCallback,
  PreToolUseHookInput,
  SyncHookJSONOutput,
} from '@anthropic-ai/claude-agent-sdk';
import { chatLogger } from '@/lib/logger';
import path from 'path';
import fs from 'fs';

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
 * Safe bash commands that can be auto-approved
 */
const SAFE_BASH_COMMANDS = [
  'ls',
  'pwd',
  'cat',
  'head',
  'tail',
  'echo',
  'which',
  'npm list',
  'npm run',
  'npm test',
  'npm run build',
  'npm run dev',
  'git status',
  'git log',
  'git diff',
  'git branch',
  'node --version',
  'npm --version',
  'npx tsc --noEmit',
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

// Type for hook input - using a flexible type since SDK types may vary
type HookInput = Record<string, unknown>;

/**
 * Bash safety hook - blocks dangerous commands
 */
function checkBashSafety(input: HookInput): { allowed: boolean; reason?: string } {
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

  // Auto-approve safe commands
  for (const safeCmd of SAFE_BASH_COMMANDS) {
    if (command.startsWith(safeCmd)) {
      return { allowed: true };
    }
  }

  // Everything else needs user confirmation (handled by permission mode)
  return { allowed: true };
}

/**
 * File write safety hook - prevents writes to protected files/directories
 *
 * M4-11: Uses path.resolve() to canonicalize paths and prevent path traversal
 * attacks using ".." sequences. Also handles symlink resolution.
 */
function checkWriteSafety(input: HookInput): { allowed: boolean; reason?: string } {
  const rawFilePath = String(input.file_path || input.path || '');
  const cwd = process.cwd();

  // Resolve to absolute path and canonicalize (removes ..)
  const resolvedPath = path.resolve(cwd, rawFilePath);

  // Use realpath for symlink resolution (if parent directory exists)
  let canonicalPath = resolvedPath;
  try {
    // Check parent directory to handle new files in existing directories
    const parentDir = path.dirname(resolvedPath);
    if (fs.existsSync(parentDir)) {
      const resolvedParent = fs.realpathSync(parentDir);
      canonicalPath = path.join(resolvedParent, path.basename(resolvedPath));
    }
  } catch {
    // Parent doesn't exist or can't be resolved, use the resolved path
  }

  // Check if canonical path is within project directory
  // Must be either exactly cwd or start with cwd + separator
  if (canonicalPath !== cwd && !canonicalPath.startsWith(cwd + path.sep)) {
    chatLogger.warn('Blocked write outside project (path traversal attempt):', {
      rawPath: rawFilePath,
      canonicalPath,
      cwd,
    });
    return {
      allowed: false,
      reason: `Cannot write outside project directory`,
    };
  }

  // Block writes to protected files (check against canonical path)
  for (const protectedFile of PROTECTED_FILES) {
    if (canonicalPath.endsWith(protectedFile) || canonicalPath.includes(`${path.sep}${protectedFile}`)) {
      chatLogger.warn('Blocked write to protected file:', { canonicalPath, protectedFile });
      return {
        allowed: false,
        reason: `Cannot modify protected file: ${protectedFile}`,
      };
    }
  }

  // Block writes to protected directories (check against canonical path)
  for (const protectedDir of PROTECTED_DIRECTORIES) {
    // Remove trailing slash for consistent checking
    const dirName = protectedDir.replace(/\/$/, '');
    if (canonicalPath.includes(`${path.sep}${dirName}${path.sep}`) ||
        canonicalPath.endsWith(`${path.sep}${dirName}`)) {
      chatLogger.warn('Blocked write to protected directory:', { canonicalPath, protectedDir });
      return {
        allowed: false,
        reason: `Cannot write to protected directory: ${protectedDir}`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Custom permission handler for the Agent SDK
 * This is called before each tool use to determine if it should proceed
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
      // All other tools (including memory tools) are checked in agent-handler
      return { allowed: true };
  }
}

/**
 * PreToolUse hook callback for blocking dangerous operations
 * Uses the SDK's HookCallback signature
 *
 * NOTE: Memory tools (update_memory, forget_memory) are NOT blocked here.
 * They are handled separately in the agent-handler with a custom approval flow.
 */
const preToolUseHook: HookCallback = async (
  input,
  _toolUseID,
  _options
): Promise<SyncHookJSONOutput> => {
  // Type guard: only process PreToolUse events
  if (input.hook_event_name !== 'PreToolUse') {
    return {};
  }

  const preToolInput = input as PreToolUseHookInput;
  const toolName = preToolInput.tool_name;
  const toolInput = (preToolInput.tool_input as Record<string, unknown>) || {};

  const result = await canUseTool(toolName, toolInput);

  if (!result.allowed) {
    chatLogger.warn('Tool blocked by safety hooks:', { toolName, reason: result.reason });
    // Return block decision with reason
    return {
      decision: 'block',
      reason: result.reason || 'Operation blocked by safety hooks',
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: result.reason,
      },
    };
  }

  // Allow tool to proceed
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow',
    },
  };
};

/**
 * Safety hooks configuration for Agent SDK
 * Implements PreToolUse hook to block dangerous operations
 */
export const SAFETY_HOOKS: AgentOptions['hooks'] = {
  PreToolUse: [
    {
      hooks: [preToolUseHook],
    },
  ],
};

/**
 * Export the permission check function for use in agent handler
 */
export { checkBashSafety, checkWriteSafety };
