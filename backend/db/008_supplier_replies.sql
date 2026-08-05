ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS supplier_reply TEXT;
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS supplier_replied_at TIMESTAMPTZ;
