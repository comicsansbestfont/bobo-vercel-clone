import { useCallback } from 'react';
import { chatLogger } from '@/lib/logger';
import { toast } from 'sonner';
import type { ToolStep } from './useToolSteps';

/**
 * Options for useStreamData hook
 */
export interface UseStreamDataOptions {
  /** Callback to update a tool step */
  onToolStep: (step: ToolStep) => void;
  /** Callback when timeout warning is received */
  onTimeoutWarning: () => void;
  /** Callback when continuation token is received */
  onContinuationToken: (token: string) => void;
}

/**
 * Return type for useStreamData hook
 */
export interface UseStreamDataReturn {
  /** Handler for stream data chunks */
  handleStreamData: (data: unknown) => void;
}

/**
 * Hook for handling stream data chunks from the chat API
 * Processes tool steps, timeout warnings, and continuation tokens
 */
export function useStreamData(options: UseStreamDataOptions): UseStreamDataReturn {
  const { onToolStep, onTimeoutWarning, onContinuationToken } = options;

  const handleStreamData = useCallback((data: unknown) => {
    const dataChunk = data as { type?: string; data?: Record<string, unknown>; token?: string; message?: string };

    // Handle timeout warning event
    if (dataChunk?.type === 'timeout-warning') {
      chatLogger.warn('[Timeout] Response truncated due to timeout');
      onTimeoutWarning();
      toast.warning('Response timeout', {
        description: dataChunk.message || 'Response was truncated. Click "Continue" to resume.',
        duration: 10000,
      });
      return;
    }

    // Handle continuation available event
    if (dataChunk?.type === 'continuation-available') {
      const token = dataChunk.token as string;
      if (token) {
        chatLogger.info('[Continuation] Token received:', token.substring(0, 8) + '...');
        onContinuationToken(token);
      }
      return;
    }

    // Handle tool step data
    if (dataChunk?.type !== 'data-tool-step' || !dataChunk.data) {
      return;
    }

    const payload = dataChunk.data as {
      id?: string;
      toolName?: string;
      status?: ToolStep['status'];
      success?: boolean;
      input?: Record<string, unknown>;
      output?: string;
      duration?: number;
    };

    if (!payload?.id) return;

    const nextStep: ToolStep = {
      id: payload.id,
      toolName: payload.toolName,
      status: payload.status || 'pending',
      success: payload.success,
      input: payload.input,
      output: payload.output,
      duration: payload.duration,
    };

    onToolStep(nextStep);
  }, [onToolStep, onTimeoutWarning, onContinuationToken]);

  return {
    handleStreamData,
  };
}
