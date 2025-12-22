-- FUNCTION: Get Profile by Email (Security Definer)
-- Allows searching for a user by email to add them to a team, bypassing RLS.
-- Returns id and full_name.

CREATE OR REPLACE FUNCTION public.get_profile_by_email(email_input text)
RETURNS TABLE (
  id uuid,
  full_name text
) 
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres/admin)
SET search_path = public -- Secure search path
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.full_name
  FROM public.profiles p
  WHERE LOWER(p.email) = LOWER(email_input);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_profile_by_email(text) TO authenticated;
