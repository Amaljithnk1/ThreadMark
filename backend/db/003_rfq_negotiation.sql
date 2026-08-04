ALTER TABLE rfq_quotes ADD COLUMN parent_quote_id UUID REFERENCES rfq_quotes(id);
ALTER TABLE rfq_quotes ADD COLUMN proposed_by TEXT NOT NULL DEFAULT 'supplier' CHECK (proposed_by IN ('supplier','buyer'));
ALTER TABLE rfq_quotes DROP CONSTRAINT IF EXISTS rfq_quotes_status_check;
ALTER TABLE rfq_quotes ADD CONSTRAINT rfq_quotes_status_check CHECK (status IN ('pending','accepted','rejected','countered'));
