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
