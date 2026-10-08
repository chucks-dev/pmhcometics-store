INSERT INTO categories (name, slug, description, sort_order, is_active)
VALUES ('Fragrance', 'fragrance', 'Everyday scents and gift sets.', 4, true)
ON CONFLICT (slug) DO UPDATE
SET is_active = true;

UPDATE categories
SET is_active = false
WHERE lower(slug) = 'makeup'
   OR lower(name) = 'makeup';
