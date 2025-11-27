/**
 * Agent Tool Approval API
 *
 * Receives approval/denial decisions from the frontend for memory tools.
 * This endpoint is called when the user clicks Approve/Reject on the inline confirmation dialog.
 */

import { NextRequest, NextResponse } from 'next/server';
import { recordApprovalDecision, getApprovalRequest } from '@/lib/agent-sdk/permission-manager';
import { chatLogger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { requestId, approved } = await req.json();

    if (!requestId || typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing requestId or approved field' },
        { status: 400 }
      );
    }

    // Validate that this request exists
    const request = getApprovalRequest(requestId);
    if (!request) {
      return NextResponse.json(
        { error: 'Approval request not found or expired' },
        { status: 404 }
      );
    }

    // Record the decision
    const success = recordApprovalDecision(requestId, approved);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to record approval decision' },
        { status: 500 }
      );
    }

    chatLogger.info('Tool approval decision recorded:', {
      requestId,
      approved,
      toolName: request.toolName,
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    chatLogger.error('Approval API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
