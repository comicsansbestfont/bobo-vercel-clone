-- Enable pgvector extension
create extension if not exists vector;

-- Add embedding column to files
alter table files 
add column if not exists embedding vector(1536);

-- Add embedding column to messages
alter table messages 
add column if not exists embedding vector(1536);

-- Create index for files
create index if not exists files_embedding_idx 
on files 
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Create index for messages
create index if not exists messages_embedding_idx 
on messages 
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Create hybrid_search function
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
    select m.id, m.content->>'text' as content, m.embedding, c.project_id 
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

