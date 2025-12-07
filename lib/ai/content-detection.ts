/**
 * Content Detection Utility
 *
 * Detects when user messages indicate content creation intent,
 * triggering proactive fetching of identity documents (VOICE_AND_TONE.md).
 */

// Keywords that indicate content creation intent
const CONTENT_CREATION_KEYWORDS = [
  // Direct content requests
  'write',
  'draft',
  'compose',
  'create',
  'ghostwrite',
  'help me write',

  // Platform-specific
  'linkedin',
  'post',
  'article',
  'blog',
  'tweet',
  'thread',

  // Content types
  'bio',
  'about me',
  'introduction',
  'pitch',
  'email',
  'message',
  'copy',
  'headline',
  'tagline',

  // Voice/tone related
  'voice',
  'tone',
  'style',
  'how should i say',
  'how do i phrase',
  'sound like',
  'write like',

  // Editing/refining
  'rewrite',
  'edit this',
  'improve this',
  'make this better',
  'polish',
  'refine',
];

// Phrases that strongly indicate content creation (multi-word)
const CONTENT_CREATION_PHRASES = [
  'write a post',
  'draft a message',
  'help me draft',
  'write an email',
  'create content',
  'linkedin post',
  'write something',
  'can you write',
  'write this for me',
  'in my voice',
  'sound like me',
  'my tone',
  'my style',
];

/**
 * Detects if a user message indicates content creation intent
 *
 * @param text - The user message text to analyze
 * @returns true if content creation intent is detected
 */
export function detectContentCreationIntent(text: string): boolean {
  if (!text || text.trim().length === 0) {
    return false;
  }

  const lowerText = text.toLowerCase();

  // Check for multi-word phrases first (higher confidence)
  for (const phrase of CONTENT_CREATION_PHRASES) {
    if (lowerText.includes(phrase)) {
      return true;
    }
  }

  // Check for individual keywords
  // Require at least 2 keyword matches to reduce false positives
  let keywordMatches = 0;
  for (const keyword of CONTENT_CREATION_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      keywordMatches++;
      // Single strong keyword is enough for some cases
      if (['linkedin', 'ghostwrite', 'draft', 'compose'].includes(keyword)) {
        return true;
      }
    }
  }

  // If we have 2+ weaker keyword matches, consider it content creation
  return keywordMatches >= 2;
}

/**
 * Get the type of content being requested (for logging/analytics)
 *
 * @param text - The user message text
 * @returns The detected content type or 'general' if not specific
 */
export function detectContentType(text: string): string {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('linkedin')) return 'linkedin';
  if (lowerText.includes('email')) return 'email';
  if (lowerText.includes('bio')) return 'bio';
  if (lowerText.includes('pitch')) return 'pitch';
  if (lowerText.includes('blog') || lowerText.includes('article')) return 'article';
  if (lowerText.includes('tweet') || lowerText.includes('thread')) return 'social';
  if (lowerText.includes('headline') || lowerText.includes('tagline')) return 'headline';

  return 'general';
}
