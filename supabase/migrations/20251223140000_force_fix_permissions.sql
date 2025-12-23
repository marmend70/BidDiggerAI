-- NUCLEAR FIX FOR PERMISSIONS AND CACHE
-- This script force-resets permissions for the problematic tables and reloads the API cache.

BEGIN;

-- 1. Ensure tables exist (just in case)
CREATE TABLE IF NOT EXISTS public.tender_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tender_id UUID NOT NULL, -- references removed for flexibility in this fix script, but existing won't change
    user_id UUID NOT NULL DEFAULT auth.uid(),
    action_type TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- 2. RESET RLS on tender_activities
ALTER TABLE public.tender_activities ENABLE ROW LEVEL SECURITY;

-- Remove ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view activities of their org tenders" ON public.tender_activities;
DROP POLICY IF EXISTS "Users can insert activities for their tenders" ON public.tender_activities;
DROP POLICY IF EXISTS "Allow all activities for auth users" ON public.tender_activities;

-- Create a SINGLE, SIMPLE policy for testing (Authenticated users can do anything)
CREATE POLICY "Allow all activities for auth users" ON public.tender_activities
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 3. RESET Permissions
GRANT ALL ON public.tender_activities TO authenticated;
GRANT ALL ON public.tender_activities TO postgres;
GRANT ALL ON public.tender_activities TO service_role;

-- 4. Fix App Settings
GRANT SELECT ON public.app_settings TO authenticated;
GRANT SELECT ON public.app_settings TO anon;

-- 5. Force Schema Cache Reload (Critical for 406 Error)
NOTIFY pgrst, 'reload config';

COMMIT;
