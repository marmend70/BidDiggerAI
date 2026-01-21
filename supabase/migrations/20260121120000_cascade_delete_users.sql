-- Migration: Add ON DELETE CASCADE to allow user deletion

-- 1. Profiles (already has cascade on some envs, ensuring it)
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey,
ADD CONSTRAINT profiles_id_fkey
    FOREIGN KEY (id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- 2. Tenders (User specific)
ALTER TABLE public.tenders
DROP CONSTRAINT IF EXISTS tenders_user_id_fkey,
ADD CONSTRAINT tenders_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- 3. Organizations (Created By) - SET NULL to avoid deleting organization if creator leaves
ALTER TABLE public.organizations
DROP CONSTRAINT IF EXISTS organizations_created_by_fkey,
ADD CONSTRAINT organizations_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES auth.users(id)
    ON DELETE SET NULL;

-- 4. Organization Members (Delete membership if user is deleted)
ALTER TABLE public.organization_members
DROP CONSTRAINT IF EXISTS organization_members_user_id_fkey,
ADD CONSTRAINT organization_members_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- 5. Tender Activities (Logs)
ALTER TABLE public.tender_activities
DROP CONSTRAINT IF EXISTS tender_activities_user_id_fkey,
ADD CONSTRAINT tender_activities_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- Note: 'analyses' and 'tender_documents' link to 'tenders'.
-- Since 'tenders' will cascade delete when user is deleted (for personal tenders),
-- and they already have cascade on tender_id, they will be cleaned up automatically.
