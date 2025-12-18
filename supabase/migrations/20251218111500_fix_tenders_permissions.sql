-- Ensure columns exist
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS tender_status text DEFAULT 'In valutazione';
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS owner text;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS notes text;

-- Enable RLS
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;

-- Policy for Users to ALL operations on their own tenders
DROP POLICY IF EXISTS "Users can manage their own tenders" ON tenders;
CREATE POLICY "Users can manage their own tenders" ON tenders
    FOR ALL
    USING (auth.uid() = user_id);
