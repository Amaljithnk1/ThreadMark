ALTER TABLE products ADD COLUMN removed_by TEXT CHECK (removed_by IN ('supplier','admin'));
