-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table to store document chunks
create table public.document_chunks (
  id uuid default gen_random_uuid() primary key,
  tender_id uuid references public.tenders on delete cascade not null,
  content text, -- The text content of the chunk
  embedding vector(1536), -- OpenAI text-embedding-3-small output dimension
  metadata jsonb, -- Extra info like file name, page number, etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on the new table
alter table public.document_chunks enable row level security;

-- Create policy to allow users to view their own document chunks
create policy "Users can view their own document chunks" on public.document_chunks
  for select using (exists (
    select 1 from public.tenders
    where public.tenders.id = document_chunks.tender_id
    and public.tenders.user_id = auth.uid()
  ));

-- Create policy to allow users to insert their own document chunks (via edge function usually, but good to have)
create policy "Users can insert their own document chunks" on public.document_chunks
  for insert with check (exists (
    select 1 from public.tenders
    where public.tenders.id = document_chunks.tender_id
    and public.tenders.user_id = auth.uid()
  ));

-- Create a function to search for documents
create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_tender_id uuid
)
returns table (
  id uuid,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    document_chunks.id,
    document_chunks.content,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  from document_chunks
  where 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  and document_chunks.tender_id = filter_tender_id
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
end;
$$;
