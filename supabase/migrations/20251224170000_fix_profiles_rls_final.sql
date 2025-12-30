-- Force fix for profiles RLS policies
-- We drop existing policies to ensure a clean slate and avoid conflicts/duplicates.

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for users based on id" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;
DROP POLICY IF EXISTS "Enable select for users based on id" ON public.profiles;

-- Create standardized, permissive policies for the owner

-- SELECT
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- INSERT
CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- UPDATE
-- Note: verified that 'modifying' the ID is impossible anyway due to PK, so check(id=uid) is safe.
CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
