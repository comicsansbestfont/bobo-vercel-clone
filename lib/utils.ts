import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a unique message ID (UUID v4)
 * Used for progressive saving where we need to pre-generate IDs
 */
export function generateMessageId(): string {
  return crypto.randomUUID()
}

