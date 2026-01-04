CREATE OR REPLACE FUNCTION get_user_organizations()
RETURNS TABLE (
  org_id uuid,
  org_name text,
  user_role text,
  member_status text,
  is_personal boolean,
  owner_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id AS org_id,
    o.name AS org_name,
    om.role AS user_role,
    om.status AS member_status,
    (o.created_by = auth.uid()) AS is_personal,
    p.email AS owner_email
  FROM organization_members om
  JOIN organizations o ON o.id = om.organization_id
  LEFT JOIN profiles p ON p.id = o.created_by
  WHERE om.user_id = auth.uid();
END;
$$;
