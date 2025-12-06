-- Enable users to insert their own profile (needed for upsert if profile doesn't exist)
create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);
