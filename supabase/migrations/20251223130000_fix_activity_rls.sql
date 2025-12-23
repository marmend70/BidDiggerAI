-- Fix RLS for tender_activities and app_settings
-- We saw 406 errors, which can indicate missing permissions or RLS blocking.

-- 1. Ensure app_settings is readable
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON public.app_settings;
CREATE POLICY "Public read access" ON public.app_settings
FOR SELECT USING (true);

GRANT SELECT ON public.app_settings TO authenticated;
GRANT SELECT ON public.app_settings TO anon; -- often needed for config before login?

-- 2. Fix tender_activities SELECT
-- The complex join might be failing if org data is missing.
-- Let's create a simpler fallback policy for "Personal" tenders just in case,
-- OR just make it slightly more permissive for debugging (read if you are authenticated? No, that leaks info).

-- Let's simplify the SELECT policy to JUST check if you are the user linked in the activity (if you performed it, you can see it? No, you want to see team activities).
-- The previous policy was: JOIN tenders -> organizations.
-- If the tender has NO organization_id (legacy), the first part of OR fails.
-- The second part checks t.user_id = auth.uid().
-- If the tender belongs to someone else in the team (legacy) but has no organization_id, you can't see it.
-- This might be the case for Shared Tenders in early versions.

-- PROPOSED FIX:
-- Allow viewing activities if you can view the tender itself.
-- This delegates the check to the tenders table RLS (but RLS is row-based, we can't easily recurse).
-- So we replicate the logic.

DROP POLICY IF EXISTS "Users can view activities of their org tenders" ON public.tender_activities;

CREATE POLICY "Users can view activities of their org tenders" ON public.tender_activities
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.tenders t
        WHERE t.id = tender_activities.tender_id
        AND (
            -- 1. Direct Ownership
            t.user_id = auth.uid()
            OR
            -- 2. Org Membership
            EXISTS (
                SELECT 1 FROM public.organization_members om
                WHERE om.organization_id = t.organization_id
                AND om.user_id = auth.uid()
            )
        )
    )
);

-- Ensure Grant
GRANT SELECT ON public.tender_activities TO authenticated;
