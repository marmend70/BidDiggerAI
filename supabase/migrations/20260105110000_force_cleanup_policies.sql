-- FORCE CLEANUP: Infinite Recursion Fix
-- This migration aggressively drops all variants of the member viewing policies to ensure no recursive ones remain.

-- 1. Ensure the helper function is safe (SECURITY DEFINER) and checks status
CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT organization_id FROM organization_members 
  WHERE user_id = auth.uid()
  AND status = 'active'
$$;

-- 2. Drop ALL potential conflicting policies from previous migrations
DROP POLICY IF EXISTS "Members can view other members of their orgs" ON public.organization_members;
DROP POLICY IF EXISTS "Members can view team members" ON public.organization_members;
DROP POLICY IF EXISTS "Members can view other members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view own membership" ON public.organization_members;

-- 3. Re-create the definitive policies

-- A: View own membership (always allowed, even if pending/rejected)
CREATE POLICY "Users can view own membership" ON public.organization_members
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- B: View colleagues (only if active, using SAFE function)
CREATE POLICY "Members can view active colleagues" ON public.organization_members
  FOR SELECT USING (
    -- Use the function to break recursion
    organization_id IN (SELECT public.get_user_org_ids())
  );
