# Product Backlog – Context Management

## V1 (In Progress)
- Lightweight token tracking with character-based heuristic fallback
- Visual context monitor (progress bar + warning states)
- Just-in-time compression (system prompt + summary + recent buffer)
- Manual trigger inside `handleSubmit`

## V2+ Candidates
1. **Precise tokenization**
   - Adopt WASM-based `tiktoken` or equivalent for exact counts
   - Cache token counts per message to avoid recomputation
2. **Background/async summarization**
   - Run compression right after a response, not when the user hits send
   - Provide UI status (e.g., “History compressed at 12:05 PM”)
3. **Vector / RAG retrieval**
   - Index all historical messages, code snippets, and docs
   - Retrieve top-k relevant chunks per user query
4. **Persistent + reversible memory**
   - Store raw transcripts in Supabase/S3 before summarizing
   - Allow re-expansion when switching to high-context models

