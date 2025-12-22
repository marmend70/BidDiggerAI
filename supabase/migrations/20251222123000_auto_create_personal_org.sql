-- FUNCTION: Auto Create Personal Organization
-- Triggered when a new user profile is created.

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

  -- Add Member (Owner)
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');

  -- Update Profile with default_organization_id
  -- We must avoid infinite recursion if updating profile triggers something else, 
  -- but this trigger is ON INSERT. The update is on the same row.
  -- To be safe, we can use a separate query or just update here.
  -- Since we are in AFTER INSERT, we must run an UPDATE.
  UPDATE public.profiles
  SET default_organization_id = new_org_id
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- TRIGGER
DROP TRIGGER IF EXISTS on_profile_created_create_org ON public.profiles;
CREATE TRIGGER on_profile_created_create_org
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_organization();

-- BACKFILL: For any users who missed the migration (e.g. the invited user)
-- Run this block manually if needed, or we include it here.
DO $$
DECLARE
  user_rec record;
  new_org_id uuid;
BEGIN
  FOR user_rec IN 
    SELECT * FROM public.profiles 
    WHERE default_organization_id IS NULL 
  LOOP
    INSERT INTO public.organizations (name, created_by)
    VALUES ('Workspace di ' || coalesce(user_rec.full_name, 'Utente'), user_rec.id)
    RETURNING id INTO new_org_id;

    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (new_org_id, user_rec.id, 'owner');

    UPDATE public.profiles
    SET default_organization_id = new_org_id
    WHERE id = user_rec.id;
  END LOOP;
END $$;
