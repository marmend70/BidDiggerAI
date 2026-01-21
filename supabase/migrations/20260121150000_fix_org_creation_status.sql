-- FIX: Ensure Organization Owners are 'active' by default.
-- Problem: 'status' column defaults to 'pending', so new personal orrg creators were seeing themselves as invited.

-- 1. Update the function that creates personal organizations
CREATE OR REPLACE FUNCTION public.handle_new_user_organization()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
BEGIN
  -- Create Organization
  INSERT INTO public.organizations (name, created_by)
  VALUES ('Workspace di ' || coalesce(NEW.full_name, 'Utente'), NEW.id)
  RETURNING id INTO new_org_id;

  -- Add Member (Owner) -> MUST BE ACTIVE
  INSERT INTO public.organization_members (organization_id, user_id, role, status)
  VALUES (new_org_id, NEW.id, 'owner', 'active');

  -- Update Profile with default_organization_id
  UPDATE public.profiles
  SET default_organization_id = new_org_id
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- 2. Data Fix: Update any existing Owners who are stuck in 'pending'
UPDATE public.organization_members
SET status = 'active'
WHERE role = 'owner' AND status = 'pending';
