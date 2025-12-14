-- Create RPC function to deduct user credits
create or replace function deduct_user_credits(count int)
returns void
language plpgsql
security definer
as $$
begin
  update profiles
  set credits = greatest(0, credits - count)
  where id = auth.uid();
end;
$$;
