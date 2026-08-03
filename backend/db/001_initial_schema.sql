CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('buyer', 'supplier', 'admin');
CREATE TYPE supplier_status AS ENUM ('pending', 'approved', 'suspended');
CREATE TYPE verification_status AS ENUM ('unverified', 'verified');
CREATE TYPE product_status AS ENUM ('available', 'out_of_stock', 'flagged', 'removed');
CREATE TYPE stock_type AS ENUM ('ready_stock', 'made_to_order');
CREATE TYPE sample_status AS ENUM ('requested', 'shipped', 'delivered');
CREATE TYPE order_status AS ENUM ('pending', 'accepted', 'preparing', 'ready_for_dispatch', 'completed');
CREATE TYPE rfq_status AS ENUM ('open', 'quoted', 'accepted', 'rejected', 'expired');
CREATE TYPE quote_status AS ENUM ('pending', 'accepted', 'rejected', 'countered');

CREATE TABLE users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role user_role NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE buyer_profiles (user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, business_type TEXT, industry TEXT, product_categories_interest TEXT[] NOT NULL DEFAULT '{}', preferred_fabric_types TEXT[] NOT NULL DEFAULT '{}', typical_order_quantity TEXT, budget_range TEXT, additional_preferences TEXT);
CREATE TABLE supplier_profiles (user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, business_name TEXT, business_type TEXT, contact_info JSONB NOT NULL DEFAULT '{}'::jsonb, business_address TEXT, operating_hours TEXT, product_categories TEXT[] NOT NULL DEFAULT '{}', fabric_types_offered TEXT[] NOT NULL DEFAULT '{}', moq INTEGER, status supplier_status NOT NULL DEFAULT 'pending', verification_documents JSONB NOT NULL DEFAULT '[]'::jsonb, verification_status verification_status NOT NULL DEFAULT 'unverified');
CREATE TABLE products (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), supplier_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT, name TEXT NOT NULL, category TEXT NOT NULL, description TEXT NOT NULL, colors TEXT[] NOT NULL DEFAULT '{}', specifications JSONB NOT NULL DEFAULT '{}'::jsonb, gsm NUMERIC(8,2), composition TEXT, weave_type TEXT, width TEXT, shrinkage_rate TEXT, colorfastness_rating TEXT, stock_qty INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0), stock_type stock_type NOT NULL DEFAULT 'ready_stock', lead_time_days INTEGER CHECK (lead_time_days >= 0), certifications TEXT[] NOT NULL DEFAULT '{}', price NUMERIC(12,2) NOT NULL CHECK (price >= 0), images TEXT[] NOT NULL DEFAULT '{}', status product_status NOT NULL DEFAULT 'available', embedding vector(384), sustainability_tags TEXT[] NOT NULL DEFAULT '{}');
CREATE TABLE sample_requests (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), buyer_id UUID NOT NULL REFERENCES users(id), product_id UUID NOT NULL REFERENCES products(id), quantity INTEGER NOT NULL CHECK (quantity > 0), status sample_status NOT NULL DEFAULT 'requested', shipping_info JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE price_tiers (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE, min_qty INTEGER NOT NULL CHECK (min_qty > 0), price_per_unit NUMERIC(12,2) NOT NULL CHECK (price_per_unit >= 0), UNIQUE(product_id, min_qty));
CREATE TABLE carts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), buyer_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE cart_items (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE, product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE, quantity INTEGER NOT NULL CHECK (quantity > 0), UNIQUE(cart_id, product_id));
CREATE TABLE orders (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), buyer_id UUID NOT NULL REFERENCES users(id), shipping_info JSONB NOT NULL, status order_status NOT NULL DEFAULT 'pending', total NUMERIC(12,2) NOT NULL CHECK (total >= 0), created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE order_items (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE, product_id UUID NOT NULL REFERENCES products(id), supplier_id UUID NOT NULL REFERENCES users(id), quantity INTEGER NOT NULL CHECK (quantity > 0), price_at_order NUMERIC(12,2) NOT NULL CHECK (price_at_order >= 0));
CREATE TABLE order_status_history (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE, status order_status NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE ai_conversations (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, messages JSONB NOT NULL DEFAULT '[]'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE product_views (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), buyer_id UUID REFERENCES users(id) ON DELETE SET NULL, product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE, timestamp TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE comparison_events (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), buyer_id UUID REFERENCES users(id) ON DELETE SET NULL, product_ids UUID[] NOT NULL, timestamp TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE rfq_requests (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), buyer_id UUID NOT NULL REFERENCES users(id), product_id UUID REFERENCES products(id), custom_spec JSONB, quantity INTEGER NOT NULL CHECK (quantity > 0), target_price NUMERIC(12,2) CHECK (target_price >= 0), needed_by_date DATE, status rfq_status NOT NULL DEFAULT 'open', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), CHECK (product_id IS NOT NULL OR custom_spec IS NOT NULL));
CREATE TABLE rfq_quotes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), rfq_request_id UUID NOT NULL REFERENCES rfq_requests(id) ON DELETE CASCADE, supplier_id UUID NOT NULL REFERENCES users(id), quoted_price NUMERIC(12,2) NOT NULL CHECK (quoted_price >= 0), quoted_lead_time_days INTEGER NOT NULL CHECK (quoted_lead_time_days >= 0), notes TEXT, status quote_status NOT NULL DEFAULT 'pending', created_at TIMESTAMPTZ NOT NULL DEFAULT now());

CREATE INDEX products_marketplace_idx ON products(status, category, gsm, composition, weave_type, stock_type);
CREATE INDEX products_certifications_idx ON products USING GIN(certifications);
CREATE INDEX products_embedding_idx ON products USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX product_views_product_timestamp_idx ON product_views(product_id, timestamp DESC);
CREATE INDEX orders_buyer_created_idx ON orders(buyer_id, created_at DESC);
CREATE INDEX order_items_supplier_idx ON order_items(supplier_id, order_id);
CREATE INDEX rfq_requests_buyer_idx ON rfq_requests(buyer_id, created_at DESC);
