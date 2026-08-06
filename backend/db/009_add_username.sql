ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE;

UPDATE users 
SET username = regexp_replace(split_part(email, '@', 1), '[^a-zA-Z0-9_]', '', 'g') || '_' || substr(id::text, 1, 4)
WHERE username IS NULL;

ALTER TABLE users ALTER COLUMN username SET NOT NULL;
