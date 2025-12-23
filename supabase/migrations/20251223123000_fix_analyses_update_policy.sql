-- Fix RLS policies for 'analyses' table to allow updates and team access

-- Enable RLS (just in case)
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- DROP existing policies to clean up (including the initial one)
DROP POLICY IF EXISTS "Users can view their own analyses" ON public.analyses;
DROP POLICY IF EXISTS "Users can update their own analyses" ON public.analyses;
DROP POLICY IF EXISTS "Team members can view analyses" ON public.analyses;
DROP POLICY IF EXISTS "Team members can update analyses" ON public.analyses;
DROP POLICY IF EXISTS "Users can view analyses they have access to" ON public.analyses;
DROP POLICY IF EXISTS "Users can update analyses they have access to" ON public.analyses;

-- 1. SELECT POLICY (View)
-- Allow if user owns the tender OR belongs to the organization that owns the tender
CREATE POLICY "Users can view analyses they have access to" ON public.analyses
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.tenders t
        LEFT JOIN public.organization_members om ON t.organization_id = om.organization_id
        WHERE t.id = analyses.tender_id
        AND (
            t.user_id = auth.uid() -- Personal
            OR
            om.user_id = auth.uid() -- Team
        )
    )
);

-- 2. UPDATE POLICY (Edit)
-- Allow if user owns the tender OR belongs to the organization that owns the tender
CREATE POLICY "Users can update analyses they have access to" ON public.analyses
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.tenders t
        LEFT JOIN public.organization_members om ON t.organization_id = om.organization_id
        WHERE t.id = analyses.tender_id
        AND (
            t.user_id = auth.uid() -- Personal
            OR
            om.user_id = auth.uid() -- Team
        )
    )
);

-- Grant privileges just in case
GRANT ALL ON public.analyses TO authenticated;
