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
