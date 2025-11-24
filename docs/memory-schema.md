# Memory Schema & Categories

**Version:** 1.0
**Last Updated:** November 24, 2025
**Status:** M3 Phase 1 (Foundation)

This document defines the schema and categorization for the User Memory system. This system allows the AI to store and retrieve long-term facts about the user, their preferences, and their work context.

---

## 1. Database Schema

### `user_profiles` Table (M3 Phase 1)

Stores the authoritative "About You" profile, manually edited by the user.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `user_id` | UUID | Foreign Key -> `users(id)` |
| `bio` | TEXT | Short summary (e.g., "Software engineer at X") |
| `background` | TEXT | Professional background and expertise |
| `preferences` | TEXT | Work style, communication preferences |
| `technical_context` | TEXT | Languages, frameworks, tools user knows |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### `memory_facts` Table (Planned for M3 Phase 2)

Stores individual facts extracted automatically from conversations.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `user_id` | UUID | Foreign Key -> `users(id)` |
| `content` | TEXT | The fact itself (e.g., "User prefers TDD") |
| `category` | ENUM | See Categories below |
| `source_message_id` | UUID | FK -> `messages(id)` (origin of fact) |
| `confidence` | FLOAT | 0.0 - 1.0 (AI confidence score) |
| `created_at` | TIMESTAMP | Creation timestamp |

---

## 2. Memory Categories (ENUM)

The `memory_category` ENUM defines how facts are classified.

### 1. `personal`
Facts about the user's identity and personal life.
*   **Examples:** "User's name is John", "Lives in San Francisco", "Has a cat named Whiskers".
*   **Usage:** Used for personalization and small talk.

### 2. `preferences`
Explicit or implicit preferences about interaction and work style.
*   **Examples:** "Prefers async communication", "Likes detailed explanations", "Hates emojis in professional text".
*   **Usage:** Injected into system prompt to guide tone and format.

### 3. `technical`
Hard skills, tools, and technology stack context.
*   **Examples:** "Expert in React", "Learning Rust", "Uses VS Code", "AWS Certified".
*   **Usage:** Critical for coding tasks to avoid explaining known concepts or suggesting wrong tools.

### 4. `work_style`
Methodologies and processes the user follows.
*   **Examples:** "Prefers TDD", "Likes pair programming", "Writes docs before code".
*   **Usage:** Guides the AI's approach to problem-solving.

### 5. `context`
Runtime or environmental context.
*   **Examples:** "Timezone: PST", "Usually works evenings", "On a slow internet connection".
*   **Usage:** Contextual awareness.

---

## 3. Injection Strategy

### System Prompt Structure

Memory is injected into the system prompt in the following order:

1.  **Base System Prompt:** Core identity of the AI.
2.  **User Profile (Authoritative):** The manual "About You" data from `user_profiles`. This overrides inferred memories.
    *   *Section Header:* `### ABOUT THE USER`
3.  **Relevant Memories (Inferred):** Facts retrieved from `memory_facts` based on semantic search (Vector Store).
    *   *Section Header:* `### RELEVANT MEMORY (Inferred)`
4.  **Project Context:** Custom instructions and file content.
5.  **Global Inspiration:** Patterns from other projects.

### Conflict Resolution

If a manually set profile field conflicts with an inferred fact:
*   **Rule:** The `user_profiles` data is ALWAYS authoritative.
*   **Example:** If profile says "I use Python" but an old memory says "I hate Python", the profile wins.

---

## 4. Future Roadmap

*   **M3 Phase 2:** Automatic extraction pipeline (Listener -> Extractor -> Storage).
*   **M3 Phase 3:** Vector search for `memory_facts` retrieval.
*   **M3 Phase 4:** Memory Management UI (Review, Edit, Delete inferred facts).
