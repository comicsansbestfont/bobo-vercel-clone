import { z } from 'zod';

export const createMemorySchema = z.object({
  content: z.string()
    .min(10, 'Content must be at least 10 characters')
    .max(500, 'Content must be at most 500 characters'),
  category: z.enum([
    'work_context',
    'personal_context',
    'top_of_mind',
    'brief_history',
    'long_term_background',
    'other_instructions'
  ], { errorMap: () => ({ message: 'Invalid category' }) }),
  confidence: z.number()
    .min(0)
    .max(1)
    .optional()
    .default(0.8),
  source_type: z.enum(['manual', 'agent_tool', 'passive', 'extracted'])
    .optional()
    .default('manual'),
});

export const updateMemorySchema = z.object({
  content: z.string().min(10).max(500).optional(),
  category: z.enum([
    'work_context',
    'personal_context',
    'top_of_mind',
    'brief_history',
    'long_term_background',
    'other_instructions'
  ]).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export type CreateMemoryInput = z.infer<typeof createMemorySchema>;
export type UpdateMemoryInput = z.infer<typeof updateMemorySchema>;
