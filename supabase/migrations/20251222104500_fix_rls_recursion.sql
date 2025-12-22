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
