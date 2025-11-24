import { getModel } from '@/lib/ai/models';
import { generateText } from 'ai';
import { getMessages } from '@/lib/db/queries';
import { deduplicateFacts, ExtractedFact } from './deduplicator';
import { MemoryEntry } from '@/lib/db/types';

const EXTRACTION_SYSTEM_PROMPT = `
You are a memory extraction assistant for Bobo AI Chatbot. Your job is to analyze conversations and extract facts about the user that would help personalize future interactions.

EXTRACTION RULES:

1. ONLY extract facts about the USER (not the assistant, not third parties)
2. Focus on persistent facts (not ephemeral statements like "I'm tired")
3. Be conservative: when in doubt, don't extract
4. Assign appropriate confidence levels based on evidence
5. Categorize each fact into the correct memory category
6. Include the source message ID for provenance

CONFIDENCE LEVELS:
- 0.9-1.0 (Very High): User explicitly stated the fact
  Example: "I'm a software engineer" → confidence: 0.95

- 0.7-0.8 (High): Strongly implied from context
  Example: "I use React at work" → confidence: 0.8 → [work_context: uses React]

- 0.5-0.6 (Medium): Inferred from multiple clues
  Example: "I love hiking and camping" → confidence: 0.6 → [personal_context: enjoys outdoor activities]

- < 0.5: DO NOT EXTRACT (too uncertain)

CATEGORIES:

1. work_context
   - Current role, job title, company
   - Technical expertise, skills, languages
   - Work projects, responsibilities
   - Work preferences, methodologies

2. personal_context
   - Location (city, country)
   - Family, relationships
   - Hobbies, interests
   - Background, education, identity

3. top_of_mind
   - Current priorities, immediate focus
   - Recent events or activities
   - Short-term goals or plans
   - Active learning topics

4. brief_history
   - Past experiences, jobs, projects
   - Timeline events (graduated, started job, etc.)
   - Skills or knowledge gained in the past
   - Subcategories: recent_months, earlier, long_term

5. long_term_background
   - Education (degrees, schools)
   - Career history (long-term patterns)
   - Languages spoken
   - Foundational facts unlikely to change

6. other_instructions
   - Communication preferences
   - Explanation style preferences
   - Format preferences (code style, etc.)
   - Interaction patterns

OUTPUT FORMAT:

Return a JSON array of extracted facts. Each fact must have:
{
  "category": "work_context" | "personal_context" | "top_of_mind" | "brief_history" | "long_term_background" | "other_instructions",
  "subcategory": string | null,  // Only for brief_history: "recent_months" | "earlier" | "long_term"
  "content": string,              // The fact itself (50-200 chars)
  "summary": string | null,       // Optional 1-sentence summary
  "confidence": number,           // 0.5 - 1.0
  "source_message_id": string,    // ID of the message this came from
  "time_period": "current" | "recent" | "past" | "long_ago",
  "reasoning": string             // Why you extracted this (for debugging, not stored)
}

If no facts should be extracted, return an empty array: []

EXAMPLES OF GOOD EXTRACTIONS:

User: "I'm a senior software engineer at Google, working on YouTube's recommendation algorithm."
Output: [
  {
    "category": "work_context",
    "subcategory": null,
    "content": "Senior software engineer at Google",
    "summary": "Works as a senior SWE at Google on YouTube",
    "confidence": 0.95,
    "source_message_id": "msg_123",
    "time_period": "current",
    "reasoning": "User explicitly stated their role and company"
  },
  {
    "category": "work_context",
    "subcategory": null,
    "content": "Works on YouTube's recommendation algorithm",
    "summary": "Specializes in recommendation systems",
    "confidence": 0.95,
    "source_message_id": "msg_123",
    "time_period": "current",
    "reasoning": "User explicitly stated their project area"
  }
]

User: "I live in San Francisco with my wife and two kids."
Output: [
  {
    "category": "personal_context",
    "subcategory": null,
    "content": "Lives in San Francisco",
    "summary": "Location: San Francisco, CA",
    "confidence": 0.95,
    "source_message_id": "msg_456",
    "time_period": "current",
    "reasoning": "User explicitly stated their location"
  },
  {
    "category": "personal_context",
    "subcategory": null,
    "content": "Married with two children",
    "summary": "Family: Married, 2 kids",
    "confidence": 0.95,
    "source_message_id": "msg_456",
    "time_period": "current",
    "reasoning": "User explicitly mentioned family structure"
  }
]

User: "I'm learning Rust right now, it's been challenging but fun."
Output: [
  {
    "category": "top_of_mind",
    "subcategory": null,
    "content": "Currently learning Rust programming language",
    "summary": "Learning Rust (finds it challenging but enjoyable)",
    "confidence": 0.95,
    "source_message_id": "msg_789",
    "time_period": "current",
    "reasoning": "User explicitly stated current learning activity"
  }
]

NOW, analyze the following conversation and extract relevant facts about the user.
`;

const validateFact = (fact: ExtractedFact): boolean => {
  if (!fact.category || !fact.content || !fact.confidence) return false;
  if (fact.confidence < 0.5 || fact.confidence > 1.0) return false;
  if (fact.content.length < 10 || fact.content.length > 500) return false;

  const validCategories = [
    'work_context', 'personal_context', 'top_of_mind',
    'brief_history', 'long_term_background', 'other_instructions'
  ];
  if (!validCategories.includes(fact.category)) return false;

  return true;
};

export async function extractMemoriesFromChat(
  chatId: string
): Promise<MemoryEntry[]> {
  try {
    // 1. Fetch recent messages (last 20)
    const messages = await getMessages(chatId);
    // Take last 20 messages
    const recentMessages = messages.slice(-20);

    if (recentMessages.length === 0) return [];

    // 2. Format for GPT-4o-mini
    const formattedMessages = recentMessages.map(msg => ({
      role: msg.role,
      content: JSON.stringify(msg.content), // Serialize content object
      id: msg.id,
    }));

    // 3. Call GPT-4o-mini
    const { text } = await generateText({
      model: getModel('gpt-4o-mini'),
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(formattedMessages) },
      ],
      temperature: 0.1, // Low for consistency
    });

    // 4. Parse response
    let extracted;
    try {
        // Find JSON in the response (handle markdown code blocks)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : text;
        extracted = JSON.parse(jsonString);
    } catch (e) {
        console.error('Failed to parse extraction response:', text, e);
        return [];
    }

    if (!extracted.facts || !Array.isArray(extracted.facts)) {
        return [];
    }

    // 5. Validate
    const validated = extracted.facts.filter(validateFact);

    // 6. Deduplicate & Store
    const stored = await deduplicateFacts(validated, chatId);

    return stored;
  } catch (error) {
    console.error('Memory extraction failed:', error);
    return []; // Graceful degradation
  }
}
