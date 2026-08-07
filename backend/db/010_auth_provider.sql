CREATE TYPE auth_provider_type AS ENUM ('local', 'google');
ALTER TABLE users ADD COLUMN auth_provider auth_provider_type NOT NULL DEFAULT 'local';
