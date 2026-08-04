CREATE SEQUENCE order_number_seq START 1;
ALTER TABLE orders ADD COLUMN order_number TEXT UNIQUE;
UPDATE orders SET order_number = 'ORD-' || LPAD(nextval('order_number_seq')::text, 5, '0');
ALTER TABLE orders ALTER COLUMN order_number SET NOT NULL;
ALTER TABLE orders ALTER COLUMN order_number SET DEFAULT 'ORD-' || LPAD(nextval('order_number_seq')::text, 5, '0');
