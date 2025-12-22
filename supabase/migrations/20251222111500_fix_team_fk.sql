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
