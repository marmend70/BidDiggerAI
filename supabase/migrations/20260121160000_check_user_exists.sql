-- Function to check if an email exists without exposing sensitive data
-- Returns true if email exists, false otherwise.
-- SECURITY: This function is accessible to anon users but only returns a boolean.
create or replace function public.check_user_exists(email_check text)
returns boolean
language plpgsql
security definer -- Runs with privileges of the creator (postgres) to access auth.users
as $$
begin
  return exists (
    select 1
    from auth.users
    where email = email_check
  );
end;
$$;

-- Grant execute permission to anon and authenticated users
grant execute on function public.check_user_exists(text) to anon, authenticated;
