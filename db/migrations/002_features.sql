ALTER TABLE orders ADD COLUMN cart_id uuid;   -- cart to clear once payment is confirmed

CREATE TABLE settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE newsletter_subscribers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      citext NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE contact_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  email      citext NOT NULL,
  message    text NOT NULL CHECK (char_length(message) <= 4000),
  handled    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX products_featured_idx ON products (is_featured) WHERE is_featured AND deleted_at IS NULL;
