-- 001_init.sql: core schema. All money is stored as integer kobo (NGN * 100).
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TYPE account_status   AS ENUM ('active', 'suspended');
CREATE TYPE skin_type        AS ENUM ('normal', 'dry', 'oily', 'combination', 'sensitive', 'not_sure');
CREATE TYPE product_status   AS ENUM ('draft', 'published');
CREATE TYPE order_status     AS ENUM ('pending_payment', 'confirmed', 'payment_confirmed', 'processing',
                                      'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded');
CREATE TYPE payment_provider AS ENUM ('paystack', 'flutterwave');
CREATE TYPE payment_status   AS ENUM ('pending', 'successful', 'failed', 'refunded');
CREATE TYPE discount_type    AS ENUM ('percentage', 'fixed');
CREATE TYPE review_status    AS ENUM ('pending', 'approved', 'hidden');
CREATE TYPE admin_role       AS ENUM ('super_admin', 'product_manager', 'order_manager', 'support_admin');
CREATE TYPE token_purpose    AS ENUM ('verify_email', 'reset_password');

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$ LANGUAGE plpgsql;

-- ───────────── Customers ─────────────
CREATE TABLE users (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name         text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100),
  email             citext NOT NULL UNIQUE,
  phone             text,
  password_hash     text NOT NULL,
  email_verified_at timestamptz,
  status            account_status NOT NULL DEFAULT 'active',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_preferences (
  user_id              uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  skin_type            skin_type,
  interests            text[] NOT NULL DEFAULT '{}',
  goals                text[] NOT NULL DEFAULT '{}',
  onboarding_completed boolean NOT NULL DEFAULT false,
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE email_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose    token_purpose NOT NULL,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX email_tokens_user_idx ON email_tokens (user_id, purpose);

CREATE TABLE user_sessions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  ip         text,
  user_agent text,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX user_sessions_user_idx ON user_sessions (user_id);

CREATE TABLE addresses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label           text,
  full_name       text NOT NULL,
  phone           text NOT NULL,
  state           text NOT NULL,
  city            text NOT NULL,
  street          text NOT NULL,
  additional_info text,
  is_default      boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX addresses_user_idx ON addresses (user_id);
CREATE UNIQUE INDEX addresses_one_default ON addresses (user_id) WHERE is_default;

-- ───────────── Catalogue ─────────────
CREATE TABLE categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  description text,
  image_url   text,
  sort_order  int NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku                  text NOT NULL UNIQUE,
  name                 text NOT NULL,
  slug                 text NOT NULL UNIQUE,
  description          text,
  category_id          uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  brand                text,
  price_kobo           bigint NOT NULL CHECK (price_kobo > 0),
  discount_price_kobo  bigint CHECK (discount_price_kobo IS NULL OR (discount_price_kobo > 0 AND discount_price_kobo < price_kobo)),
  stock                int NOT NULL DEFAULT 0 CHECK (stock >= 0),
  low_stock_threshold  int NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
  ingredients          text,
  benefits             text[] NOT NULL DEFAULT '{}',
  how_to_use           text,
  skin_types           skin_type[] NOT NULL DEFAULT '{}',
  status               product_status NOT NULL DEFAULT 'draft',
  is_featured          boolean NOT NULL DEFAULT false,
  is_best_seller       boolean NOT NULL DEFAULT false,
  avg_rating           numeric(3,2) NOT NULL DEFAULT 0,
  review_count         int NOT NULL DEFAULT 0,
  search_vector        tsvector GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(brand,'') || ' ' || coalesce(description,''))
  ) STORED,
  deleted_at           timestamptz,           -- soft delete: order_items keep referencing the product
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_category_idx ON products (category_id) WHERE deleted_at IS NULL;
CREATE INDEX products_status_idx   ON products (status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX products_brand_idx    ON products (brand);
CREATE INDEX products_skin_gin     ON products USING gin (skin_types);
CREATE INDEX products_search_gin   ON products USING gin (search_vector);

CREATE TABLE product_images (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url        text NOT NULL,
  alt        text,
  sort_order int NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false
);
CREATE INDEX product_images_product_idx ON product_images (product_id, sort_order);

-- ───────────── Cart & wishlist ─────────────
CREATE TABLE carts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES users(id) ON DELETE CASCADE,
  guest_token_hash text UNIQUE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR guest_token_hash IS NOT NULL)
);
CREATE UNIQUE INDEX carts_one_per_user ON carts (user_id) WHERE user_id IS NOT NULL;

CREATE TABLE cart_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id    uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   int NOT NULL CHECK (quantity BETWEEN 1 AND 20),
  added_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cart_id, product_id)
);

CREATE TABLE wishlists (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE wishlist_items (
  wishlist_id uuid NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (wishlist_id, product_id)
);

-- ───────────── Discounts ─────────────
CREATE TABLE discounts (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code               citext NOT NULL UNIQUE,
  type               discount_type NOT NULL,
  value              bigint NOT NULL CHECK (value > 0),  -- percent (1-100) or kobo
  min_order_kobo     bigint NOT NULL DEFAULT 0 CHECK (min_order_kobo >= 0),
  max_discount_kobo  bigint CHECK (max_discount_kobo IS NULL OR max_discount_kobo > 0),
  starts_at          timestamptz,
  expires_at         timestamptz,
  usage_limit        int CHECK (usage_limit IS NULL OR usage_limit > 0),
  used_count         int NOT NULL DEFAULT 0,
  is_active          boolean NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CHECK (type <> 'percentage' OR value <= 100),
  CHECK (expires_at IS NULL OR starts_at IS NULL OR expires_at > starts_at)
);

-- ───────────── Orders & payments ─────────────
CREATE SEQUENCE order_number_seq START 12345;

CREATE TABLE orders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number        text NOT NULL UNIQUE DEFAULT ('COS' || nextval('order_number_seq')),
  user_id             uuid REFERENCES users(id) ON DELETE SET NULL,   -- NULL = guest order
  tracking_token_hash text,                                           -- guest order lookup
  customer_name       text NOT NULL,
  customer_email      citext NOT NULL,
  customer_phone      text NOT NULL,
  ship_state          text NOT NULL,
  ship_city           text NOT NULL,
  ship_street         text NOT NULL,
  ship_info           text,
  status              order_status NOT NULL DEFAULT 'pending_payment',
  subtotal_kobo       bigint NOT NULL CHECK (subtotal_kobo >= 0),
  delivery_fee_kobo   bigint NOT NULL DEFAULT 0 CHECK (delivery_fee_kobo >= 0),
  discount_kobo       bigint NOT NULL DEFAULT 0 CHECK (discount_kobo >= 0),
  total_kobo          bigint NOT NULL CHECK (total_kobo >= 0),
  discount_id         uuid REFERENCES discounts(id) ON DELETE SET NULL,
  discount_code       text,
  currency            char(3) NOT NULL DEFAULT 'NGN',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CHECK (total_kobo = subtotal_kobo + delivery_fee_kobo - discount_kobo)
);
CREATE INDEX orders_user_idx    ON orders (user_id, created_at DESC);
CREATE INDEX orders_status_idx  ON orders (status, created_at DESC);
CREATE INDEX orders_email_idx   ON orders (customer_email);

CREATE TABLE order_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id       uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name     text NOT NULL,   -- snapshots, so later edits never rewrite history
  sku              text NOT NULL,
  unit_price_kobo  bigint NOT NULL CHECK (unit_price_kobo > 0),
  quantity         int NOT NULL CHECK (quantity > 0),
  line_total_kobo  bigint NOT NULL CHECK (line_total_kobo = unit_price_kobo * quantity)
);
CREATE INDEX order_items_order_idx   ON order_items (order_id);
CREATE INDEX order_items_product_idx ON order_items (product_id);

CREATE TABLE order_status_history (
  id         bigserial PRIMARY KEY,
  order_id   uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status     order_status NOT NULL,
  note       text,
  changed_by uuid,                  -- admin id, NULL = system
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_status_history_order_idx ON order_status_history (order_id, created_at);

CREATE TABLE payments (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  provider                payment_provider NOT NULL,
  reference               text NOT NULL,
  provider_transaction_id text,
  amount_kobo             bigint NOT NULL CHECK (amount_kobo > 0),
  currency                char(3) NOT NULL DEFAULT 'NGN',
  status                  payment_status NOT NULL DEFAULT 'pending',
  gateway_response        jsonb,
  paid_at                 timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, reference)
);
CREATE INDEX payments_order_idx  ON payments (order_id);
CREATE INDEX payments_status_idx ON payments (status, created_at DESC);

-- Idempotent webhook processing: one row per provider event.
CREATE TABLE webhook_events (
  id           bigserial PRIMARY KEY,
  provider     payment_provider NOT NULL,
  event_id     text NOT NULL,
  payload      jsonb NOT NULL,
  received_at  timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  UNIQUE (provider, event_id)
);

-- ───────────── Reviews & notifications ─────────────
CREATE TABLE reviews (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id           uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id              uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id             uuid REFERENCES orders(id) ON DELETE SET NULL,
  rating               smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title                text,
  body                 text CHECK (body IS NULL OR char_length(body) <= 2000),
  is_verified_purchase boolean NOT NULL DEFAULT false,
  status               review_status NOT NULL DEFAULT 'pending',
  created_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);
CREATE INDEX reviews_product_idx ON reviews (product_id, status);

-- ───────────── Admin ─────────────
CREATE TABLE admin_users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           citext NOT NULL UNIQUE,
  full_name       text NOT NULL,
  password_hash   text NOT NULL,
  role            admin_role NOT NULL,
  status          account_status NOT NULL DEFAULT 'active',
  totp_secret_enc text NOT NULL,                    -- AES-256-GCM encrypted
  failed_attempts int NOT NULL DEFAULT 0,
  locked_until    timestamptz,
  last_login_at   timestamptz,
  created_by      uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE admin_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash   text NOT NULL UNIQUE,
  mfa_verified boolean NOT NULL DEFAULT false,
  ip           text,
  user_agent   text,
  expires_at   timestamptz NOT NULL,
  revoked_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_sessions_admin_idx ON admin_sessions (admin_id);

CREATE TABLE notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES users(id) ON DELETE CASCADE,
  admin_id   uuid REFERENCES admin_users(id) ON DELETE CASCADE,
  type       text NOT NULL,
  title      text NOT NULL,
  body       text,
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(user_id, admin_id) = 1)
);
CREATE INDEX notifications_user_idx  ON notifications (user_id, created_at DESC)  WHERE user_id  IS NOT NULL;
CREATE INDEX notifications_admin_idx ON notifications (admin_id, created_at DESC) WHERE admin_id IS NOT NULL;

CREATE TABLE audit_logs (
  id          bigserial PRIMARY KEY,
  actor_type  text NOT NULL CHECK (actor_type IN ('admin', 'customer', 'system')),
  actor_id    uuid,
  action      text NOT NULL,
  entity_type text,
  entity_id   text,
  metadata    jsonb NOT NULL DEFAULT '{}',
  ip          text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_actor_idx  ON audit_logs (actor_type, actor_id, created_at DESC);
CREATE INDEX audit_logs_entity_idx ON audit_logs (entity_type, entity_id);

CREATE FUNCTION audit_logs_immutable() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'audit_logs is append-only'; END $$ LANGUAGE plpgsql;
CREATE TRIGGER audit_logs_no_change BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION audit_logs_immutable();

-- ───────────── Infrastructure ─────────────
CREATE TABLE rate_limits (
  key          text NOT NULL,
  window_start timestamptz NOT NULL,
  count        int NOT NULL DEFAULT 1,
  PRIMARY KEY (key, window_start)
);

CREATE TABLE homepage_content (
  key        text PRIMARY KEY,   -- hero, promo_banners, featured_ids ...
  value      jsonb NOT NULL,
  updated_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- updated_at triggers
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','user_preferences','addresses','categories','products','carts',
                           'discounts','orders','payments','admin_users']
  LOOP
    EXECUTE format('CREATE TRIGGER %I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
  END LOOP;
END $$;
