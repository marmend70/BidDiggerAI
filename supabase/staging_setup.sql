-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  company_name text,
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create tenders table
create table public.tenders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  status text check (status in ('uploading', 'analyzing', 'completed', 'error')) default 'uploading',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create tender_documents table
create table public.tender_documents (
  id uuid default gen_random_uuid() primary key,
  tender_id uuid references public.tenders on delete cascade not null,
  file_path text not null,
  file_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create analyses table
create table public.analyses (
  id uuid default gen_random_uuid() primary key,
  tender_id uuid references public.tenders on delete cascade not null,
  result_json jsonb,
  model_used text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.tenders enable row level security;
alter table public.tender_documents enable row level security;
alter table public.analyses enable row level security;

-- Create policies
create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can view their own tenders" on public.tenders
  for select using (auth.uid() = user_id);

create policy "Users can insert their own tenders" on public.tenders
  for insert with check (auth.uid() = user_id);

create policy "Users can view their own tender documents" on public.tender_documents
  for select using (exists (
    select 1 from public.tenders
    where public.tenders.id = tender_documents.tender_id
    and public.tenders.user_id = auth.uid()
  ));

create policy "Users can insert their own tender documents" on public.tender_documents
  for insert with check (exists (
    select 1 from public.tenders
    where public.tenders.id = tender_documents.tender_id
    and public.tenders.user_id = auth.uid()
  ));

create policy "Users can view their own analyses" on public.analyses
  for select using (exists (
    select 1 from public.tenders
    where public.tenders.id = analyses.tender_id
    and public.tenders.user_id = auth.uid()
  ));
-- Create a new storage bucket for tenders
insert into storage.buckets (id, name, public)
values ('tenders', 'tenders', false);

-- Policy to allow authenticated users to upload files
create policy "Authenticated users can upload tenders"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'tenders' and auth.uid() = owner );

-- Policy to allow users to view their own files
create policy "Users can view their own tenders"
on storage.objects for select
to authenticated
using ( bucket_id = 'tenders' and auth.uid() = owner );
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
-- Add preferences column to profiles table
alter table public.profiles 
add column if not exists preferences jsonb default '{
  "faq_questions": [
    "Descrivimi lo scenario dei sistemi tecnologici, infrastrutturale software, sistemi informatici",
    "Approfondisci il fabbisogno del personale impiegato in termini di giorni e/o ore richieste",
    "Quali sono le principali figure di responsabilità , gestione, coordinamento?",
    "Esegui una ricerca esterna sul servizio per trovare chi è l'attuale fornitore"
  ],
  "export_sections": {
    "1_requisiti_partecipazione": true,
    "3_sintesi": true,
    "4_servizi": true,
    "5_scadenze": true,
    "6_importi": true,
    "7_durata": true,
    "8_ccnl": true,
    "9_oneri": true,
    "10_punteggi": true,
    "11_pena_esclusione": true,
    "12_offerta_tecnica": true,
    "13_offerta_economica": true,
    "14_note_importanti": true,
    "15_remunerazione": true,
    "16_sla_penali": true,
    "faq": true
  },
  "menu_order": [
    "3_sintesi",
    "1_requisiti_partecipazione",
    "4_servizi",
    "5_scadenze",
    "6_importi",
    "7_durata",
    "8_ccnl",
    "9_oneri",
    "10_punteggi",
    "11_pena_esclusione",
    "12_offerta_tecnica",
    "13_offerta_economica",
    "14_note_importanti",
    "15_remunerazione",
    "16_sla_penali",
    "faq"
  ]
}'::jsonb;
-- Add DELETE policy for tenders
create policy "Users can delete their own tenders" on public.tenders
  for delete using (auth.uid() = user_id);

-- Add DELETE policy for tender_documents (optional, as cascade should handle it, but good for completeness)
create policy "Users can delete their own tender documents" on public.tender_documents
  for delete using (exists (
    select 1 from public.tenders
    where public.tenders.id = tender_documents.tender_id
    and public.tenders.user_id = auth.uid()
  ));

-- Add DELETE policy for analyses (optional, as cascade should handle it, but good for completeness)
create policy "Users can delete their own analyses" on public.analyses
  for delete using (exists (
    select 1 from public.tenders
    where public.tenders.id = analyses.tender_id
    and public.tenders.user_id = auth.uid()
  ));
alter table profiles add column if not exists preferences jsonb default '{}'::jsonb;
-- Enable users to insert their own profile (needed for upsert if profile doesn't exist)
create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);
-- Create RPC function to deduct user credits
create or replace function deduct_user_credits(count int)
returns void
language plpgsql
security definer
as $$
begin
  update profiles
  set credits = greatest(0, credits - count)
  where id = auth.uid();
end;
$$;
