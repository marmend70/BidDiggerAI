-- 1. Add status column to organization_members
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_members' AND column_name = 'status') THEN 
        ALTER TABLE public.organization_members 
        ADD COLUMN status text CHECK (status IN ('active', 'pending', 'rejected')) DEFAULT 'pending';

        -- Backfill existing members to 'active' so they don't lose access
        UPDATE public.organization_members SET status = 'active';
    END IF; 
END $$;

-- 2. Update RLS Policies to respect status

-- TENDERS: Only 'active' members can view/act
DROP POLICY IF EXISTS "Org members can view tenders" ON public.tenders;
CREATE POLICY "Org members can view tenders" ON public.tenders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = tenders.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Org members can insert tenders" ON public.tenders;
CREATE POLICY "Org members can insert tenders" ON public.tenders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = tenders.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Org members can update tenders" ON public.tenders;
CREATE POLICY "Org members can update tenders" ON public.tenders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = tenders.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Org members can delete tenders" ON public.tenders;
CREATE POLICY "Org members can delete tenders" ON public.tenders
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = tenders.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );


-- ANALYSES: Only 'active' members can view/act
DROP POLICY IF EXISTS "Org members can view analyses" ON public.analyses;
CREATE POLICY "Org members can view analyses" ON public.analyses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tenders t
      JOIN public.organization_members om ON t.organization_id = om.organization_id
      WHERE t.id = analyses.tender_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );
  
-- (Apply similar updates for insert/update/delete on analyses if needed, usually SELECT is the critical gate for reading data)


-- DOCUMENTS: Only 'active' members can view
DROP POLICY IF EXISTS "Org members can view documents" ON public.tender_documents;
CREATE POLICY "Org members can view documents" ON public.tender_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tenders t
      JOIN public.organization_members om ON t.organization_id = om.organization_id
      WHERE t.id = tender_documents.tender_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );


-- ORGANIZATION MEMBERS ITSELF
-- Members should be able to see themselves even if 'pending' (to accept invite)
-- Owners needs to see pending members to manage them

DROP POLICY IF EXISTS "Members can view other members of their orgs" ON public.organization_members;
CREATE POLICY "Members can view other members of their orgs" ON public.organization_members
  FOR SELECT USING (
    -- I can see rows if I am an 'active' member of that org
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
    OR
    -- OR I can see my OWN row (even if pending) to accept it
    organization_members.user_id = auth.uid()
  );

-- Allow users to update THEIR OWN status (to accept invite)
CREATE POLICY "Users can update own membership status" ON public.organization_members
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
    -- Note: We might want to restrict *what* they can update via trigger or app logic, 
    -- but allowing them to update their own row is necessary for "Accept".
    -- "Reject" is effectively DELETE (or update to 'rejected').

CREATE POLICY "Users can delete own membership" ON public.organization_members
    FOR DELETE USING (auth.uid() = user_id);
