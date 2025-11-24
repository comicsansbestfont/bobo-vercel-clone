-- Fix hybrid_search function to correctly extract text from message parts
-- Previous version tried to extract content->>'text' which is null for the new message format

create or replace function hybrid_search (
  p_query_embedding vector(1536),
  p_match_threshold float,
  p_match_count int,
  p_active_project_id uuid
)
returns table (
  result_id uuid,
  result_content text,
  result_similarity float,
  result_source_type text
)
language plpgsql
as $$
begin
  return query
  select
    documents.id,
    documents.content,
    1 - (documents.embedding <=> p_query_embedding) as similarity,
    case
      when documents.project_id = p_active_project_id then 'project'
      else 'global'
    end as source_type
  from (
    select id, content_text as content, embedding, project_id from files
    union all
    select 
      m.id, 
      (
        select string_agg(elem->>'text', ' ') 
        from jsonb_array_elements(m.content->'parts') elem 
        where elem->>'type' = 'text'
      ) as content,
      m.embedding, 
      c.project_id 
    from messages m
    join chats c on m.chat_id = c.id
  ) as documents
  where 1 - (documents.embedding <=> p_query_embedding) > p_match_threshold
  order by
    (case when documents.project_id = p_active_project_id then 1 else 0 end) desc,
    similarity desc
  limit p_match_count;
end;
$$;
