-- Add tender_status, owner, and numeric_id columns to tenders table
-- We use tender_status to distinguish from the technical 'status' column (analyzing, failed, etc.)
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS tender_status text DEFAULT 'In valutazione';
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS owner text;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS numeric_id SERIAL;

-- Add check constraint for tender_status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_tender_status') THEN
        ALTER TABLE tenders 
        ADD CONSTRAINT check_tender_status 
        CHECK (tender_status IN ('In valutazione', 'Decisa: Go', 'Decisa: No Go', 'Assegnata', 'Presentata'));
    END IF;
END $$;
