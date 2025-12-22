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
