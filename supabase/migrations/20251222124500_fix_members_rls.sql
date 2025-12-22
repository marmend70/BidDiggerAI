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
