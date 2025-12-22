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
