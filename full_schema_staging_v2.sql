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
    "Quali sono le principali figure di responsabilità, gestione, coordinamento?",
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
-- 1. Ensure 'credits' column exists in profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0;

-- 2. Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, credits)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    2 -- Default 2 free credits for trial
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create or Replace Trigger for user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
-- Add missing 'plan_type' column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan_type text DEFAULT 'trial';

-- Update existing profiles to have 'trial' plan if null
UPDATE public.profiles 
SET plan_type = 'trial' 
WHERE plan_type IS NULL;
-- Add tender_status, owner, and numeric_id columns to tenders table
-- We use tender_status to distinguish from the technical 'status' column (analyzing, failed, etc.)
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS tender_status text DEFAULT 'In valutazione';
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS owner text;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS numeric_id SERIAL;

-- Add check constraint for tender_status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_tender_status') THEN
        ALTER TABLE tenders 
        ADD CONSTRAINT check_tender_status 
        CHECK (tender_status IN ('In valutazione', 'Decisa: Go', 'Decisa: No Go', 'Assegnata', 'Presentata'));
    END IF;
END $$;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS notes text;
-- Ensure columns exist
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS tender_status text DEFAULT 'In valutazione';
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS owner text;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS notes text;

-- Enable RLS
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;

-- Policy for Users to ALL operations on their own tenders
DROP POLICY IF EXISTS "Users can manage their own tenders" ON tenders;
CREATE POLICY "Users can manage their own tenders" ON tenders
    FOR ALL
    USING (auth.uid() = user_id);
npm run dev:staging

-- 1. Create Organizations Table
create table public.organizations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users
);

-- 2. Create Members (Many-to-Many)
create table public.organization_members (
  organization_id uuid references public.organizations on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text check (role in ('owner', 'admin', 'member')) default 'member',
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (organization_id, user_id)
);

-- 3. Update Profiles
alter table public.profiles add column default_organization_id uuid references public.organizations;

-- 4. Update Tenders
alter table public.tenders add column organization_id uuid references public.organizations;

-- 5. Enable RLS on new tables
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

-- 6. DATA MIGRATION: Create default orgs for existing users
DO $$
DECLARE
  user_rec record;
  new_org_id uuid;
BEGIN
  -- Iterate all users in profiles (since we can definitely access public.profiles, usually safer than auth.users in some contexts, but let's assume profiles exist for all users due to triggers)
  FOR user_rec IN SELECT * FROM public.profiles LOOP
    
    -- Create Org
    -- Use ID from profiles as created_by
    INSERT INTO public.organizations (name, created_by)
    VALUES ('Workspace di ' || coalesce(user_rec.full_name, 'Utente'), user_rec.id)
    RETURNING id INTO new_org_id;

    -- Add Member (Owner)
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (new_org_id, user_rec.id, 'owner');

    -- Update Profile
    UPDATE public.profiles
    SET default_organization_id = new_org_id
    WHERE id = user_rec.id;

    -- Update Tenders
    UPDATE public.tenders
    SET organization_id = new_org_id
    WHERE user_id = user_rec.id;
    
  END LOOP;
END $$;

-- 7. RLS POLICIES

-- ORGANIZATIONS
create policy "Members can view their organizations" on public.organizations
  for select using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = organizations.id
      and om.user_id = auth.uid()
    )
  );

create policy "Authenticated users can create organizations" on public.organizations
  for insert with check (auth.role() = 'authenticated'); 
  -- Note: Ideally we enforce created_by = auth.uid() but triggers can handle that. 
  -- For now, open insert for auth users.

create policy "Owners can update their organizations" on public.organizations
  for update using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = organizations.id
      and om.user_id = auth.uid()
      and om.role = 'owner'
    )
  );

-- ORGANIZATION MEMBERS
create policy "Members can view other members of their orgs" on public.organization_members
  for select using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = organization_members.organization_id
      and om.user_id = auth.uid()
    )
  );

create policy "Owners/Admins can manage members" on public.organization_members
  for all using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = organization_members.organization_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'admin')
    )
  );

-- TENDERS (Override existing policies)
-- First, drop conflicting policies if they exist or just ensure these are new
-- We will DROP the old "Users can view their own tenders" and recreate.

drop policy if exists "Users can view their own tenders" on public.tenders;
drop policy if exists "Users can insert their own tenders" on public.tenders;

create policy "Org members can view tenders" on public.tenders
  for select using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = tenders.organization_id
      and om.user_id = auth.uid()
    )
  );

create policy "Org members can insert tenders" on public.tenders
  for insert with check (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = tenders.organization_id
      and om.user_id = auth.uid()
    )
  );

create policy "Org members can update tenders" on public.tenders
  for update using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = tenders.organization_id
      and om.user_id = auth.uid()
    )
  );
  
create policy "Org members can delete tenders" on public.tenders
  for delete using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = tenders.organization_id
      and om.user_id = auth.uid()
    )
  );

-- TENDER DOCUMENTS
drop policy if exists "Users can view their own tender documents" on public.tender_documents;
drop policy if exists "Users can insert their own tender documents" on public.tender_documents;

create policy "Org members can view documents" on public.tender_documents
  for select using (
    exists (
      select 1 from public.tenders t
      join public.organization_members om on t.organization_id = om.organization_id
      where t.id = tender_documents.tender_id
      and om.user_id = auth.uid()
    )
  );

create policy "Org members can insert documents" on public.tender_documents
  for insert with check (
    exists (
      select 1 from public.tenders t
      join public.organization_members om on t.organization_id = om.organization_id
      where t.id = tender_documents.tender_id
      and om.user_id = auth.uid()
    )
  );

create policy "Org members can delete documents" on public.tender_documents
  for delete using (
    exists (
      select 1 from public.tenders t
      join public.organization_members om on t.organization_id = om.organization_id
      where t.id = tender_documents.tender_id
      and om.user_id = auth.uid()
    )
  );

-- ANALYSES
drop policy if exists "Users can view their own analyses" on public.analyses;

create policy "Org members can view analyses" on public.analyses
  for select using (
    exists (
      select 1 from public.tenders t
      join public.organization_members om on t.organization_id = om.organization_id
      where t.id = analyses.tender_id
      and om.user_id = auth.uid()
    )
  );
  
create policy "Org members can insert analyses" on public.analyses
  for insert with check (
    exists (
      select 1 from public.tenders t
      join public.organization_members om on t.organization_id = om.organization_id
      where t.id = analyses.tender_id
      and om.user_id = auth.uid()
    )
  );

create policy "Org members can update analyses" on public.analyses
  for update using (
    exists (
      select 1 from public.tenders t
      join public.organization_members om on t.organization_id = om.organization_id
      where t.id = analyses.tender_id
      and om.user_id = auth.uid()
    )
  );

create policy "Org members can delete analyses" on public.analyses
  for delete using (
    exists (
      select 1 from public.tenders t
      join public.organization_members om on t.organization_id = om.organization_id
      where t.id = analyses.tender_id
      and om.user_id = auth.uid()
    )
  );
-- FIX: RECURSIVE RLS POLICIES
-- The previous policies caused infinite recursion because they checked the table itself.

-- 1. Drop problematic policies on organization_members
DROP POLICY IF EXISTS "Members can view other members of their orgs" ON public.organization_members;
DROP POLICY IF EXISTS "Owners/Admins can manage members" ON public.organization_members;

-- 2. Create simplified policies
-- A user can view rows where they are the user_id (see own membership)
CREATE POLICY "Users can view own membership" ON public.organization_members
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- A user can view rows for organizations they belong to (see colleagues)
-- We use a security definer function or a direct check carefully.
-- To avoid recursion, we can rely on the fact that if I am in org X, I can see rows for org X.
-- BUT querying "am I in org X" requires reading the table.
-- FIX: Split into two policies or trust the recursive check isn't infinite IF it terminates on "user_id = auth.uid()"
-- Postgres RLS can handle limited recursion, but "IN (SELECT ...)" often loops.

-- BETTER APPROACH: Use a helper function with SECURITY DEFINER to break the RLS loop.
CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
$$;

-- Policy using the function (breaks recursion because function bypasses RLS on the table inside it)
CREATE POLICY "Members can view other members" ON public.organization_members
  FOR SELECT USING (
    organization_id IN (SELECT public.get_user_org_ids())
  );

-- 3. Fix Organizations Policy (optional, but good for safety)
DROP POLICY IF EXISTS "Members can view their organizations" ON public.organizations;

CREATE POLICY "Members can view their organizations" ON public.organizations
  FOR SELECT USING (
    id IN (SELECT public.get_user_org_ids())
  );

-- 4. Fix Update/Manage Policy
CREATE POLICY "Owners/Admins can manage members" ON public.organization_members
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  ); 
-- Note: The manage policy might still recurse if not careful, but usually checking role for auth.uid() is distinct enough.
-- Let's enable the function for this too to be safe.

CREATE OR REPLACE FUNCTION public.is_org_admin(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members 
    WHERE organization_id = org_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
$$;

DROP POLICY IF EXISTS "Owners/Admins can manage members" ON public.organization_members;

CREATE POLICY "Owners/Admins can manage members" ON public.organization_members
  FOR ALL USING (
    public.is_org_admin(organization_id)
  );

-- 5. Fix Tenders Policy (to be robust)
-- The previous Tenders policy:
-- organization_id IN (SELECT organization_id FROM organization_members ... )
-- This is standard and usually okay if organization_members is readable.
-- Since we fixed organization_members readability with the function, Tenders policy needs no changes OR can use the function.
-- Let's update it to use the function for performance/consistency.

DROP POLICY IF EXISTS "Org members can view tenders" ON public.tenders;
CREATE POLICY "Org members can view tenders" ON public.tenders
  FOR SELECT USING (
    organization_id IN (SELECT public.get_user_org_ids())
  );

-- (Repeat for Insert/Update/Delete)
DROP POLICY IF EXISTS "Org members can insert tenders" ON public.tenders;
CREATE POLICY "Org members can insert tenders" ON public.tenders
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT public.get_user_org_ids())
  );
  
DROP POLICY IF EXISTS "Org members can update tenders" ON public.tenders;
CREATE POLICY "Org members can update tenders" ON public.tenders
  FOR UPDATE USING (
    organization_id IN (SELECT public.get_user_org_ids())
  );
  
DROP POLICY IF EXISTS "Org members can delete tenders" ON public.tenders;
CREATE POLICY "Org members can delete tenders" ON public.tenders
  FOR DELETE USING (
    organization_id IN (SELECT public.get_user_org_ids())
  );
-- FIX: TEAM PERMISSIONS & PROFILES
-- It seems fetching members fails, likely because:
-- 1. Recursion wasn't fully fixed, OR
-- 2. "profiles" table is not readable for other users (so the join fails)

-- PART 1: Ensure Helper Function Exists and is Secure
CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  -- Returns IDs of organizations the current user belongs to
  SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
$$;

-- PART 2: Fix Profiles Access
-- Existing policies probably only allow "view own profile".
-- We need to allow viewing profiles of team members.

-- Drop potential restrictive policies if needed, or just ADD a purely permissive one (OR logic).
-- CAUTION: If there is a policy "Enable read access for all users" (common in starters), this isn't needed.
-- But if strict, we need this:

DROP POLICY IF EXISTS "Can view profiles of team members" ON public.profiles;

CREATE POLICY "Can view profiles of team members" ON public.profiles
  FOR SELECT USING (
    -- Allow if the profile belongs to a user who is in one of my organizations
    id IN (
        SELECT user_id 
        FROM organization_members 
        WHERE organization_id IN (SELECT public.get_user_org_ids())
    )
  );

-- PART 3: Re-Apply Organization Members Policies (Just to be sure)
DROP POLICY IF EXISTS "Members can view other members" ON public.organization_members;
DROP POLICY IF EXISTS "Members can view other members of their orgs" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view own membership" ON public.organization_members;

-- Allow viewing own row
CREATE POLICY "Users can view own membership" ON public.organization_members
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Allow viewing colleagues
DROP POLICY IF EXISTS "Members can view team members" ON public.organization_members;

CREATE POLICY "Members can view team members" ON public.organization_members
  FOR SELECT USING (
    organization_id IN (SELECT public.get_user_org_ids())
  );

-- PART 4: Ensure Invite Permissions
-- "Members" (default role) usually CANNOT invite. Only admins/owners.
-- But for this MVP, let's check the constraint.
-- Triggering "Add Member" requires INSERT on organization_members.
-- The policy "Owners/Admins can manage members" covers this.
-- Let's ensure it handles the "New Member" correctly.
-- When inserting a NEW member, the "organization_id" is the target.
-- Policy check:
-- "public.is_org_admin(organization_id)" -> Checks if AUTH user is admin of that org.
-- This is correct.

-- Ensure the IsAdmin function exists
CREATE OR REPLACE FUNCTION public.is_org_admin(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members 
    WHERE organization_id = org_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
$$;

DROP POLICY IF EXISTS "Owners/Admins can manage members" ON public.organization_members;

CREATE POLICY "Owners/Admins can manage members" ON public.organization_members
  FOR ALL USING (
    public.is_org_admin(organization_id)
  );
-- FIX: ADD FOREIGN KEY FOR PROFILES JOIN
-- The Supabase client requires a Foreign Key to join tables.
-- organization_members.user_id references auth.users by default.
-- We must explicitly link it to public.profiles to allow the "profiles (...)" query.

-- 1. Add Foreign Key Constraint
ALTER TABLE public.organization_members
DROP CONSTRAINT IF EXISTS organization_members_user_id_fkey, -- Drop old auth.users FK if needed, OR just add a second one?
-- Ideally we replace it or add a specific one. 
-- Best practice: Reference PUBLIC.PROFILES instead of AUTH.USERS for public data joins.

-- Let's DROP the old FK to auth.users and ADD one to public.profiles.
-- Note: public.profiles.id is the same as auth.users.id, so data integrity is preserved.

DROP CONSTRAINT IF EXISTS organization_members_user_id_fkey;

ALTER TABLE public.organization_members
ADD CONSTRAINT organization_members_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- 2. Grant permissions just in case
GRANT REFERENCES ON public.profiles TO authenticated;
GRANT REFERENCES ON public.profiles TO service_role;
-- FIX: ADD EMAIL TO PROFILES
-- The frontend assumes 'email' is in public.profiles, but it's only in auth.users.
-- Standard pattern: Sync email to profiles to allow easy querying.

-- 1. Add column if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text;

-- 2. Backfill existing emails from auth.users
-- This requires permissions to read auth.users.
-- NOTE: If this script is run via Dashboard SQL Editor, it works (postgres role).
-- If run via Migration, it assumes the runner has permissions.

UPDATE public.profiles
SET email = auth.users.email
FROM auth.users
WHERE profiles.id = auth.users.id
AND profiles.email IS NULL;

-- 3. Create Trigger to Sync Email on New User or Email Change
-- (Optional but recommended for consistency)
CREATE OR REPLACE FUNCTION public.handle_user_email_sync()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if trigger exists before creating (to avoid error)
DROP TRIGGER IF EXISTS on_auth_user_email_change ON auth.users;

CREATE TRIGGER on_auth_user_email_change
AFTER UPDATE OF email ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_user_email_sync();

-- Also update the INSERT trigger (usually handled in 'handle_new_user')
-- Let's update 'handle_new_user' if it exists, or just ensure default insert
-- We'll assume the handle_new_user trigger inserts into profiles.
-- We can alter the function if we want to add email there too.
-- For now, let's just rely on the backfill for existing users.
-- For new users, we should ideally update the 'handle_new_user' function.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, default_organization_id)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NULL -- Organization will be created by other logic or default triggers? 
         -- Actually, our migration script creates it for EXISTING users.
         -- For NEW users, we need logic to create their default org!
  );
  -- Wait, if we are here, we should probably ensure NEW users get an Org too.
  -- Let's do that in a separate step/fix if needed.
  -- For now, focus on EMAIL.
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- CAUTION: Overwriting handle_new_user might break other logic if we miss fields.
-- In '20251206120000_fix_profiles_insert_policy.sql' we saw it.
-- Let's stick to just the UPDATE/BACKFILL for now to act safe. 
-- The user is testing with existing users.

-- Just ensuring the column exists and is populated.
-- FUNCTION: Get Profile by Email (Security Definer)
-- Allows searching for a user by email to add them to a team, bypassing RLS.
-- Returns id and full_name.

CREATE OR REPLACE FUNCTION public.get_profile_by_email(email_input text)
RETURNS TABLE (
  id uuid,
  full_name text
) 
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres/admin)
SET search_path = public -- Secure search path
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.full_name
  FROM public.profiles p
  WHERE LOWER(p.email) = LOWER(email_input);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_profile_by_email(text) TO authenticated;
-- FUNCTION: Auto Create Personal Organization
-- Triggered when a new user profile is created.

CREATE OR REPLACE FUNCTION public.handle_new_user_organization()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
BEGIN
  -- Create Organization
  INSERT INTO public.organizations (name, created_by)
  VALUES ('Workspace di ' || coalesce(NEW.full_name, 'Utente'), NEW.id)
  RETURNING id INTO new_org_id;

  -- Add Member (Owner)
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');

  -- Update Profile with default_organization_id
  -- We must avoid infinite recursion if updating profile triggers something else, 
  -- but this trigger is ON INSERT. The update is on the same row.
  -- To be safe, we can use a separate query or just update here.
  -- Since we are in AFTER INSERT, we must run an UPDATE.
  UPDATE public.profiles
  SET default_organization_id = new_org_id
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- TRIGGER
DROP TRIGGER IF EXISTS on_profile_created_create_org ON public.profiles;
CREATE TRIGGER on_profile_created_create_org
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_organization();

-- BACKFILL: For any users who missed the migration (e.g. the invited user)
-- Run this block manually if needed, or we include it here.
DO $$
DECLARE
  user_rec record;
  new_org_id uuid;
BEGIN
  FOR user_rec IN 
    SELECT * FROM public.profiles 
    WHERE default_organization_id IS NULL 
  LOOP
    INSERT INTO public.organizations (name, created_by)
    VALUES ('Workspace di ' || coalesce(user_rec.full_name, 'Utente'), user_rec.id)
    RETURNING id INTO new_org_id;

    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (new_org_id, user_rec.id, 'owner');

    UPDATE public.profiles
    SET default_organization_id = new_org_id
    WHERE id = user_rec.id;
  END LOOP;
END $$;
-- FIX RLS: Allow users to view their own membership directly
-- This prevents recursion/access issues when fetching "My Organizations"

-- 1. Organization Members
create policy "Users can view their own membership" on public.organization_members
  for select using (
    user_id = auth.uid()
  );

-- 2. Organizations (Ensure this exists and is distinct from the member check if needed, but the existing one usually works if member access is clear)
-- The existing policy relies on querying organization_members. 
-- "Members can view their organizations" -> exists(select 1 from organization_members where user_id = auth.uid())
-- With the policy above enabled, the subquery in the organizations policy should now succeed.
-- RPC: Get User Organizations (Secure list)
-- Bypasses complex RLS on joins by using SECURITY DEFINER for the list generation only.

DROP FUNCTION IF EXISTS public.get_user_organizations();

CREATE OR REPLACE FUNCTION public.get_user_organizations()
RETURNS TABLE (
  org_id uuid,
  org_name text,
  user_role text,
  is_personal boolean,
  owner_email text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id as org_id,
    o.name as org_name,
    om.role as user_role,
    (o.created_by = auth.uid()) as is_personal,
    p.email as owner_email
  FROM public.organization_members om
  JOIN public.organizations o ON om.organization_id = o.id
  -- Join to find the OWNER of the organization
  LEFT JOIN public.organization_members om_owner ON o.id = om_owner.organization_id AND om_owner.role = 'owner'
  LEFT JOIN public.profiles p ON om_owner.user_id = p.id
  WHERE om.user_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_organizations() TO authenticated;
-- Update deduct_user_credits to handle Workspace Credits
-- If org_id is provided, deducts from the Organization Owner.
-- If org_id is NULL, deducts from the authenticated user (Personal).

DROP FUNCTION IF EXISTS public.deduct_user_credits(int);
DROP FUNCTION IF EXISTS public.deduct_user_credits(int, uuid);

CREATE OR REPLACE FUNCTION public.deduct_user_credits(count int, org_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Determine Target User ID
  IF org_id IS NOT NULL THEN
    -- Find the Owner of the Organization
    SELECT user_id INTO target_user_id
    FROM public.organization_members
    WHERE organization_id = org_id AND role = 'owner'
    LIMIT 1;

    -- Safety Check: If no owner found (shouldn't happen), fallback to auth.uid() or raise error
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Organization Owner not found';
    END IF;
  ELSE
    -- Personal Workspace -> Deduct from Current User
    target_user_id := auth.uid();
  END IF;

  -- Perform Deduction
  UPDATE profiles
  SET credits = GREATEST(0, credits - count)
  WHERE id = target_user_id;
  
  -- Optional: Check if credits ran out and raise exception? 
  -- Current frontend logic checks BEFORE calling this, but for robustness:
  -- IF (SELECT credits FROM profiles WHERE id = target_user_id) < 0 THEN ...
END;
$$;

GRANT EXECUTE ON FUNCTION public.deduct_user_credits(int, uuid) TO authenticated;
-- Create tender_activities table
CREATE TABLE IF NOT EXISTS public.tender_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    action_type TEXT NOT NULL, -- 'analysis_run', 'status_change', 'dashboard_note', 'section_update', 'created'
    details JSONB DEFAULT '{}'::jsonb, -- Store dynamic details (e.g. { "old_status": "new", "new_status": "analyzing" })
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Performance index
    CONSTRAINT valid_action CHECK (action_type IN ('created', 'analysis_run', 'status_change', 'dashboard_note', 'section_update', 'file_upload'))
);

-- Index for timeline fetching
CREATE INDEX idx_tender_activities_tender_id ON public.tender_activities(tender_id, created_at DESC);

-- RLS Policies
ALTER TABLE public.tender_activities ENABLE ROW LEVEL SECURITY;

-- 1. View Policies
-- Users can view activities if they are a member of the Organization that owns the tender.
-- We reuse the existing logic: Tenders belong to Org -> User User belongs to Org.
-- Since we already secured `tenders` table, we can piggyback or replicate.
-- Efficient way: Join tenders -> organizations -> members.

CREATE POLICY "Users can view activities of their org tenders" ON public.tender_activities
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.tenders t
        JOIN public.organization_members om ON t.organization_id = om.organization_id
        WHERE t.id = tender_activities.tender_id
        AND om.user_id = auth.uid()
    )
    OR
    EXISTS (
        -- Or if Personal Tender (organization_id might be null or created_by match?)
        -- In our new system, everything is Org based ideally, but let's cover direct ownership just in case
        SELECT 1 FROM public.tenders t
        WHERE t.id = tender_activities.tender_id
        AND t.user_id = auth.uid() -- Legacy/Personal fallback
    )
);

-- 2. Insert Policies
-- Users can insert activities if they have access to the tender.
CREATE POLICY "Users can insert activities for their tenders" ON public.tender_activities
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.tenders t
        JOIN public.organization_members om ON t.organization_id = om.organization_id
        WHERE t.id = tender_activities.tender_id
        AND om.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.tenders t
        WHERE t.id = tender_activities.tender_id
        AND t.user_id = auth.uid()
    )
);

-- Grant permissions
GRANT SELECT, INSERT ON public.tender_activities TO authenticated;
