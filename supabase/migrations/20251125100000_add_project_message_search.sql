-- Add search_project_messages function for intra-project chat context sharing
-- This enables chats within the same project to share context with each other

CREATE OR REPLACE FUNCTION search_project_messages(
  p_project_id UUID,
  p_current_chat_id UUID,
  p_query_embedding vector(1536),
  p_match_threshold FLOAT DEFAULT 0.25,
  p_match_count INT DEFAULT 5
)
RETURNS TABLE (
  message_id UUID,
  chat_id UUID,
  chat_title TEXT,
  role TEXT,
  content TEXT,
  similarity FLOAT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Return empty if no project ID provided
  IF p_project_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    m.id as message_id,
    c.id as chat_id,
    c.title as chat_title,
    m.role as role,
    (
      SELECT string_agg(elem->>'text', ' ')
      FROM jsonb_array_elements(m.content->'parts') elem
      WHERE elem->>'type' = 'text'
    ) as content,
    1 - (m.embedding <=> p_query_embedding) as similarity,
    m.created_at
  FROM messages m
  JOIN chats c ON m.chat_id = c.id
  WHERE c.project_id = p_project_id
    AND (p_current_chat_id IS NULL OR c.id != p_current_chat_id)  -- Exclude current chat if provided
    AND m.embedding IS NOT NULL
    AND 1 - (m.embedding <=> p_query_embedding) > p_match_threshold
  ORDER BY similarity DESC
  LIMIT p_match_count;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION search_project_messages IS
'Semantic search for messages within sibling chats of the same project.
Used for intra-project context sharing (Chat B can find relevant content from Chat A).
Excludes the current chat to avoid duplication with local chat history.';
