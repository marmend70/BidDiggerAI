-- Fix infinite recursion by using SECURITY DEFINER function with status check

-- 1. Update helper function to only return active orgs
-- This function is SECURITY DEFINER, so it bypasses RLS on organization_members
-- preventing the infinite recursion loop when used IN the policy.
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

-- 2. Update policy to use the function to break recursion
DROP POLICY IF EXISTS "Members can view other members of their orgs" ON public.organization_members;

CREATE POLICY "Members can view other members of their orgs" ON public.organization_members
  FOR SELECT USING (
    -- I can see rows if I am an 'active' member of that org (via function)
    organization_id IN (SELECT public.get_user_org_ids())
    OR
    -- OR I can see my OWN row (even if pending) to accept it
    user_id = auth.uid()
  );
