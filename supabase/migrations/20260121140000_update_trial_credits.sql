-- Update handle_new_user to give 5 free credits instead of 2.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, credits, default_organization_id)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    5, -- UPDATED: 5 free credits for trial
    NULL -- handled by handle_new_user_organization
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
