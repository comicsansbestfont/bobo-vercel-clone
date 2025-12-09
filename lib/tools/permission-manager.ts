/**
 * Permission Manager for Agent SDK Tool Approvals
 *
 * Manages pending tool approval requests and stores user decisions.
 * This allows the backend to pause tool execution and wait for frontend approval.
 */

import { chatLogger } from '@/lib/logger';
import { getMemoryById } from '@/lib/db/queries';

export interface ToolApprovalRequest {
  id: string;
  chatId: string;
  toolName: string;
  toolInput: Record<string, unknown>;
  previewData?: Record<string, unknown>;
  timestamp: number;
  status: 'pending' | 'approved' | 'denied' | 'timeout';
}

export interface ApprovalDecision {
  approved: boolean;
  timestamp: number;
}

// In-memory store for pending approvals
// TODO: Consider using Redis for production with multiple server instances
const pendingApprovals = new Map<string, ToolApprovalRequest>();
const approvalDecisions = new Map<string, ApprovalDecision>();

// Timeout duration: 5 minutes
const APPROVAL_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Create a new approval request and return the request ID
 */
export async function createApprovalRequest(
  chatId: string,
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<ToolApprovalRequest> {
  const requestId = crypto.randomUUID();

  // Fetch preview data for memory tools
  let previewData: Record<string, unknown> | undefined;
  if (toolName === 'update_memory') {
    previewData = await getUpdateMemoryPreview(toolInput);
  } else if (toolName === 'forget_memory') {
    previewData = await getForgetMemoryPreview(toolInput);
  }

  const request: ToolApprovalRequest = {
    id: requestId,
    chatId,
    toolName,
    toolInput,
    previewData,
    timestamp: Date.now(),
    status: 'pending',
  };

  pendingApprovals.set(requestId, request);

  // Auto-timeout after 5 minutes
  setTimeout(() => {
    const current = pendingApprovals.get(requestId);
    if (current && current.status === 'pending') {
      current.status = 'timeout';
      approvalDecisions.set(requestId, { approved: false, timestamp: Date.now() });
      chatLogger.warn('Approval request timed out:', { requestId, toolName });
    }
  }, APPROVAL_TIMEOUT_MS);

  chatLogger.info('Created approval request:', { requestId, toolName, chatId });
  return request;
}

/**
 * Record an approval decision from the user
 */
export function recordApprovalDecision(
  requestId: string,
  approved: boolean
): boolean {
  const request = pendingApprovals.get(requestId);

  if (!request) {
    chatLogger.warn('Approval request not found:', { requestId });
    return false;
  }

  if (request.status !== 'pending') {
    chatLogger.warn('Approval request already processed:', { requestId, status: request.status });
    return false;
  }

  // Update request status
  request.status = approved ? 'approved' : 'denied';

  // Store decision
  approvalDecisions.set(requestId, { approved, timestamp: Date.now() });

  chatLogger.info('Recorded approval decision:', { requestId, approved });
  return true;
}

/**
 * Get the approval decision for a request (blocking wait with timeout)
 */
export async function waitForApproval(
  requestId: string,
  timeoutMs: number = APPROVAL_TIMEOUT_MS
): Promise<boolean> {
  const startTime = Date.now();

  // Poll for decision
  while (Date.now() - startTime < timeoutMs) {
    const decision = approvalDecisions.get(requestId);
    if (decision) {
      chatLogger.debug('Approval decision received:', { requestId, approved: decision.approved });
      return decision.approved;
    }

    // Wait 100ms before checking again
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Timeout - auto-deny
  chatLogger.warn('Approval wait timed out, auto-denying:', { requestId });
  return false;
}

/**
 * Get preview data for update_memory tool
 */
async function getUpdateMemoryPreview(
  toolInput: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const memoryId = toolInput.memoryId as string;
  const newContent = toolInput.newContent as string;
  const reason = toolInput.reason as string;

  try {
    const existing = await getMemoryById(memoryId);

    return {
      type: 'memory_update',
      oldContent: existing?.content || 'Memory not found',
      newContent,
      category: existing?.category || 'unknown',
      reason,
      isManualEntry: existing?.source_type === 'manual',
    };
  } catch (error) {
    chatLogger.error('Failed to fetch memory preview:', error);
    return {
      type: 'memory_update',
      oldContent: 'Error loading memory',
      newContent,
      reason,
    };
  }
}

/**
 * Get preview data for forget_memory tool
 */
async function getForgetMemoryPreview(
  toolInput: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const memoryId = toolInput.memoryId as string;
  const reason = toolInput.reason as string;

  try {
    const existing = await getMemoryById(memoryId);

    return {
      type: 'memory_delete',
      content: existing?.content || 'Memory not found',
      category: existing?.category || 'unknown',
      reason,
      isManualEntry: existing?.source_type === 'manual',
      confidence: existing?.confidence || 0,
      lastUpdated: existing?.last_updated || 'Unknown',
    };
  } catch (error) {
    chatLogger.error('Failed to fetch memory preview:', error);
    return {
      type: 'memory_delete',
      content: 'Error loading memory',
      reason,
    };
  }
}

/**
 * Get a pending request by ID
 */
export function getApprovalRequest(requestId: string): ToolApprovalRequest | undefined {
  return pendingApprovals.get(requestId);
}

/**
 * Clean up old requests (called periodically)
 */
export function cleanupOldRequests() {
  const now = Date.now();
  const maxAge = APPROVAL_TIMEOUT_MS * 2; // Keep for 10 minutes

  for (const [id, request] of pendingApprovals.entries()) {
    if (now - request.timestamp > maxAge) {
      pendingApprovals.delete(id);
      approvalDecisions.delete(id);
      chatLogger.debug('Cleaned up old approval request:', { id });
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupOldRequests, 5 * 60 * 1000);
