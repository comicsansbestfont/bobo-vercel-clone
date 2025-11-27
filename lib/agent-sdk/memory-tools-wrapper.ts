/**
 * Memory Tools Wrapper with Approval Flow
 *
 * Wraps update_memory and forget_memory to require user confirmation.
 * This provides a layer BEFORE the actual tool executes.
 */

import {
  updateMemoryTool,
  forgetMemoryTool,
  rememberFactTool,
  searchMemoryTool,
} from './memory-tools';
import { createApprovalRequest, waitForApproval } from './permission-manager';
import { chatLogger } from '@/lib/logger';

/**
 * Wrapped update_memory tool - requires user approval
 */
export const wrappedUpdateMemoryTool = {
  ...updateMemoryTool,
  execute: async (params: {
    memoryId: string;
    newContent: string;
    reason: string;
    chatId?: string; // Injected by agent-handler
  }): Promise<string> => {
    const { chatId, ...toolParams } = params;

    if (!chatId) {
      chatLogger.error('update_memory called without chatId');
      return 'Error: Missing chat context. Cannot process memory update.';
    }

    chatLogger.info('[update_memory] Creating approval request...', { memoryId: params.memoryId });

    // Create approval request
    const approvalRequest = await createApprovalRequest(
      chatId,
      'update_memory',
      toolParams
    );

    // TODO: Emit tool-approval-request event in stream
    // For now, we'll just log and auto-deny (safer default)
    chatLogger.warn('[update_memory] Approval flow not yet implemented in stream - auto-denying for safety');

    // Wait for approval (will timeout after 5 minutes)
    const approved = await waitForApproval(approvalRequest.id);

    if (!approved) {
      chatLogger.info('[update_memory] User denied approval', { memoryId: params.memoryId });
      return 'Memory update cancelled by user.';
    }

    // User approved - execute the actual tool
    chatLogger.info('[update_memory] User approved - executing tool', { memoryId: params.memoryId });
    return updateMemoryTool.execute(toolParams);
  },
};

/**
 * Wrapped forget_memory tool - requires user approval
 */
export const wrappedForgetMemoryTool = {
  ...forgetMemoryTool,
  execute: async (params: {
    memoryId: string;
    reason: string;
    chatId?: string; // Injected by agent-handler
  }): Promise<string> => {
    const { chatId, ...toolParams } = params;

    if (!chatId) {
      chatLogger.error('forget_memory called without chatId');
      return 'Error: Missing chat context. Cannot process memory deletion.';
    }

    chatLogger.info('[forget_memory] Creating approval request...', { memoryId: params.memoryId });

    // Create approval request
    const approvalRequest = await createApprovalRequest(
      chatId,
      'forget_memory',
      toolParams
    );

    // TODO: Emit tool-approval-request event in stream
    chatLogger.warn('[forget_memory] Approval flow not yet implemented in stream - auto-denying for safety');

    // Wait for approval (will timeout after 5 minutes)
    const approved = await waitForApproval(approvalRequest.id);

    if (!approved) {
      chatLogger.info('[forget_memory] User denied approval', { memoryId: params.memoryId });
      return 'Memory deletion cancelled by user.';
    }

    // User approved - execute the actual tool
    chatLogger.info('[forget_memory] User approved - executing tool', { memoryId: params.memoryId });
    return forgetMemoryTool.execute(toolParams);
  },
};

/**
 * Re-export safe tools as-is (no wrapping needed)
 */
export const wrappedSearchMemoryTool = searchMemoryTool;
export const wrappedRememberFactTool = rememberFactTool;

/**
 * All wrapped memory tools for agent use
 */
export const wrappedMemoryTools = {
  search_memory: wrappedSearchMemoryTool,
  remember_fact: wrappedRememberFactTool,
  update_memory: wrappedUpdateMemoryTool,
  forget_memory: wrappedForgetMemoryTool,
};
