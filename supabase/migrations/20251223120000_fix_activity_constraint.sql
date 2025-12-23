-- Drop existing constraint if it exists (to be safe)
ALTER TABLE public.tender_activities DROP CONSTRAINT IF EXISTS valid_action;

-- Re-add the constraint with 'section_update' included
ALTER TABLE public.tender_activities 
ADD CONSTRAINT valid_action 
CHECK (action_type IN ('created', 'analysis_run', 'status_change', 'dashboard_note', 'section_update', 'file_upload'));
