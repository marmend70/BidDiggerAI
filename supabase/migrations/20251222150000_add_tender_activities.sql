-- Create tender_activities table
CREATE TABLE IF NOT EXISTS public.tender_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    action_type TEXT NOT NULL, -- 'analysis_run', 'status_change', 'dashboard_note', 'section_update', 'created'
    details JSONB DEFAULT '{}'::jsonb, -- Store dynamic details (e.g. { "old_status": "new", "new_status": "analyzing" })
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Performance index
    CONSTRAINT valid_action CHECK (action_type IN ('created', 'analysis_run', 'status_change', 'dashboard_note', 'section_update', 'file_upload'))
);

-- Index for timeline fetching
CREATE INDEX idx_tender_activities_tender_id ON public.tender_activities(tender_id, created_at DESC);

-- RLS Policies
ALTER TABLE public.tender_activities ENABLE ROW LEVEL SECURITY;

-- 1. View Policies
-- Users can view activities if they are a member of the Organization that owns the tender.
-- We reuse the existing logic: Tenders belong to Org -> User User belongs to Org.
-- Since we already secured `tenders` table, we can piggyback or replicate.
-- Efficient way: Join tenders -> organizations -> members.

CREATE POLICY "Users can view activities of their org tenders" ON public.tender_activities
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.tenders t
        JOIN public.organization_members om ON t.organization_id = om.organization_id
        WHERE t.id = tender_activities.tender_id
        AND om.user_id = auth.uid()
    )
    OR
    EXISTS (
        -- Or if Personal Tender (organization_id might be null or created_by match?)
        -- In our new system, everything is Org based ideally, but let's cover direct ownership just in case
        SELECT 1 FROM public.tenders t
        WHERE t.id = tender_activities.tender_id
        AND t.user_id = auth.uid() -- Legacy/Personal fallback
    )
);

-- 2. Insert Policies
-- Users can insert activities if they have access to the tender.
CREATE POLICY "Users can insert activities for their tenders" ON public.tender_activities
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.tenders t
        JOIN public.organization_members om ON t.organization_id = om.organization_id
        WHERE t.id = tender_activities.tender_id
        AND om.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.tenders t
        WHERE t.id = tender_activities.tender_id
        AND t.user_id = auth.uid()
    )
);

-- Grant permissions
GRANT SELECT, INSERT ON public.tender_activities TO authenticated;
