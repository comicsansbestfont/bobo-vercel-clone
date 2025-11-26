import { embed } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { supabase } from '@/lib/db/client';
import { embeddingLogger } from '@/lib/logger';

// Create a separate OpenAI provider instance for embeddings if needed,
// or reuse the gateway configuration.
// We'll use the gateway for consistency.
const openaiGateway = createOpenAI({
    apiKey: process.env.AI_GATEWAY_API_KEY || '',
    baseURL: 'https://ai-gateway.vercel.sh/v1',
    name: 'vercel-ai-gateway',
});

const embeddingModel = openaiGateway.textEmbeddingModel('text-embedding-3-small');

/**
 * Generate an embedding for a given text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const { embedding } = await embed({
            model: embeddingModel,
            value: text,
        });
        return embedding;
    } catch (error) {
        embeddingLogger.error('Failed to generate embedding:', error);
        throw error;
    }
}

/**
 * Generate and save embedding for a file
 */
export async function embedAndSaveFile(fileId: string, content: string): Promise<void> {
    try {
        const embedding = await generateEmbedding(content);

        const { error } = await supabase
            .from('files')
            .update({ embedding })
            .eq('id', fileId);

        if (error) {
            embeddingLogger.error('Failed to save file embedding:', error);
            throw error;
        }
    } catch (error) {
        embeddingLogger.error(`Error embedding file ${fileId}:`, error);
        // Don't throw, just log error so we don't crash the request
    }
}

/**
 * Generate and save embedding for a message
 */
export async function embedAndSaveMessage(messageId: string, content: string): Promise<void> {
    try {
        const embedding = await generateEmbedding(content);

        const { error } = await supabase
            .from('messages')
            .update({ embedding })
            .eq('id', messageId);

        if (error) {
            embeddingLogger.error('Failed to save message embedding:', error);
            throw error;
        }
    } catch (error) {
        embeddingLogger.error(`Error embedding message ${messageId}:`, error);
    }
}
