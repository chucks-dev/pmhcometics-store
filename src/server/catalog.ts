import { query } from "./db/client";
import { stockStatus } from "@/lib/stock";
import type { ProductCardDTO, ProductDetailDTO, ReviewDTO } from "@/types/catalog";

const SELECT = `
  SELECT p.id, p.slug, p.name, p.brand, p.price_kobo, p.discount_price_kobo, p.stock, p.low_stock_threshold,
         p.avg_rating, p.review_count, p.created_at, p.is_best_seller, p.skin_types,
         c.name AS category_name, c.slug AS category_slug,
         (SELECT url FROM product_images i WHERE i.product_id = p.id ORDER BY is_primary DESC, sort_order LIMIT 1) AS image_url
    FROM products p JOIN categories c ON c.id = p.category_id`;
const LIVE = `p.status = 'published' AND p.deleted_at IS NULL AND c.is_active`;
const EFFECTIVE = `COALESCE(p.discount_price_kobo, p.price_kobo)`;

export function mapProduct(r: any): ProductCardDTO {
  const price = Number(r.price_kobo);
  const disc = r.discount_price_kobo ? Number(r.discount_price_kobo) : null;
  return {
    id: r.id, slug: r.slug, name: r.name, brand: r.brand,
    priceKobo: price, discountPriceKobo: disc, currentKobo: disc ?? price,
    discountPercent: disc ? Math.round(((price - disc) / price) * 100) : 0,
    image: r.image_url ?? null, rating: Number(r.avg_rating), reviewCount: r.review_count,
    stock: r.stock, stockStatus: stockStatus(r.stock, r.low_stock_threshold),
    categoryName: r.category_name, categorySlug: r.category_slug,
    isNew: Date.now() - new Date(r.created_at).getTime() < 30 * 864e5, isBestSeller: r.is_best_seller,
  };
}

export interface ProductFilters {
  q?: string; category?: string; minPrice?: number; maxPrice?: number; skinType?: string;
  minRating?: number; brands?: string[]; inStock?: boolean; sort?: string; page?: number; pageSize?: number;
  ids?: string[];
}

const SORTS: Record<string, string> = {
  recommended: "p.is_best_seller DESC, p.avg_rating DESC, p.created_at DESC",
  newest: "p.created_at DESC",
  price_asc: `${EFFECTIVE} ASC`,
  price_desc: `${EFFECTIVE} DESC`,
  rating: "p.avg_rating DESC, p.review_count DESC",
};

export async function listProducts(f: ProductFilters) {
  const where = [LIVE];
  const params: unknown[] = [];
  const add = (v: unknown) => { params.push(v); return `$${params.length}`; };

  if (f.q) { const n = add(f.q); where.push(`(p.search_vector @@ plainto_tsquery('simple', ${n}) OR p.name ILIKE '%'||${n}||'%' OR p.brand ILIKE '%'||${n}||'%')`); }
  if (f.category === "new-arrivals") where.push(`p.created_at > now() - interval '30 days'`);
  else if (f.category) where.push(`c.slug = ${add(f.category)}`);
  if (f.minPrice != null) where.push(`${EFFECTIVE} >= ${add(f.minPrice)}`);
  if (f.maxPrice != null) where.push(`${EFFECTIVE} <= ${add(f.maxPrice)}`);
  if (f.skinType) where.push(`${add(f.skinType)}::skin_type = ANY(p.skin_types)`);
  if (f.minRating) where.push(`p.avg_rating >= ${add(f.minRating)}`);
  if (f.brands?.length) where.push(`p.brand = ANY(${add(f.brands)}::text[])`);
  if (f.inStock) where.push(`p.stock > 0`);
  if (f.ids) where.push(`p.id = ANY(${add(f.ids)}::uuid[])`);

  const pageSize = Math.min(f.pageSize ?? 12, 48);
  const page = Math.max(f.page ?? 1, 1);
  const order = SORTS[f.sort ?? "recommended"] ?? SORTS.recommended;
  const whereSql = where.join(" AND ");

  const [rows, count] = await Promise.all([
    query(`${SELECT} WHERE ${whereSql} ORDER BY ${order}, p.id LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`, params),
    query<{ n: string }>(`SELECT COUNT(*) AS n FROM products p JOIN categories c ON c.id = p.category_id WHERE ${whereSql}`, params),
  ]);
  const total = Number(count[0].n);
  return { items: rows.map(mapProduct), total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getFacets() {
  const [brands, price] = await Promise.all([
    query<{ brand: string }>(`SELECT DISTINCT brand FROM products p WHERE status='published' AND deleted_at IS NULL AND brand IS NOT NULL ORDER BY brand`),
    query<{ max: string | null }>(`SELECT MAX(COALESCE(discount_price_kobo, price_kobo)) AS max FROM products WHERE status='published' AND deleted_at IS NULL`),
  ]);
  return { brands: brands.map((b) => b.brand), maxPriceKobo: Number(price[0].max ?? 0) };
}

export async function getCategories() {
  return query<{ id: string; name: string; slug: string; description: string | null; image_url: string | null }>(
    `SELECT id, name, slug, description, image_url FROM categories WHERE is_active ORDER BY sort_order, name`);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getProduct(idOrSlug: string): Promise<ProductDetailDTO | null> {
  const col = UUID.test(idOrSlug) ? "p.id" : "p.slug";
  const base = await query(`${SELECT} WHERE ${col} = $1 AND ${LIVE}`, [idOrSlug]);
  if (!base[0]) return null;
  const [extra, images] = await Promise.all([
    query(`SELECT sku, description, benefits, ingredients, how_to_use FROM products WHERE id = $1`, [base[0].id]),
    query<{ url: string; alt: string | null }>(`SELECT url, alt FROM product_images WHERE product_id = $1 ORDER BY is_primary DESC, sort_order`, [base[0].id]),
  ]);
  const e = extra[0];
  return {
    ...mapProduct(base[0]), sku: e.sku, description: e.description, benefits: e.benefits ?? [],
    ingredients: e.ingredients, howToUse: e.how_to_use, skinTypes: base[0].skin_types ?? [], images,
  };
}

export async function getRelated(productId: string, categorySlug: string, limit = 4) {
  const rows = await query(
    `${SELECT} WHERE ${LIVE} AND c.slug = $1 AND p.id <> $2 ORDER BY p.is_best_seller DESC, p.avg_rating DESC LIMIT ${limit}`,
    [categorySlug, productId]);
  return rows.map(mapProduct);
}

export const getNewArrivals = async (limit = 8) =>
  (await query(`${SELECT} WHERE ${LIVE} ORDER BY p.created_at DESC LIMIT ${limit}`)).map(mapProduct);

export const getBestSellers = async (limit = 8) =>
  (await query(`${SELECT} WHERE ${LIVE} ORDER BY p.is_best_seller DESC, p.review_count DESC, p.avg_rating DESC LIMIT ${limit}`)).map(mapProduct);

export const getFeatured = async (limit = 8) =>
  (await query(`${SELECT} WHERE ${LIVE} AND p.is_featured ORDER BY p.created_at DESC LIMIT ${limit}`)).map(mapProduct);

const INTEREST_SLUG: Record<string, string> = {
  skincare: "skincare", makeup: "makeup", hair_care: "hair-care", body_care: "body-care", fragrance: "fragrance",
};
const GOAL_KEYWORD: Record<string, string> = {
  hydration: "hydrat", brightening: "bright", acne_care: "acne", anti_aging: "age", even_skin_tone: "tone",
  hair_growth: "growth", sun_protection: "spf",
};

/** Preference + history based picks. Pure product matching, with no health claims. */
export async function getRecommendations(userId: string, limit = 8): Promise<ProductCardDTO[]> {
  const [prefs] = await query<{ skin_type: string | null; interests: string[]; goals: string[] }>(
    `SELECT skin_type, interests, goals FROM user_preferences WHERE user_id = $1`, [userId]);
  const slugs = (prefs?.interests ?? []).map((i) => INTEREST_SLUG[i]).filter(Boolean);
  const keywords = (prefs?.goals ?? []).map((g) => GOAL_KEYWORD[g]).filter(Boolean);

  const rows = await query(
    `${SELECT}
     WHERE ${LIVE} AND p.stock > 0
     ORDER BY (
        CASE WHEN c.slug = ANY($1::text[]) THEN 3 ELSE 0 END
      + CASE WHEN $2::skin_type = ANY(p.skin_types) THEN 3 ELSE 0 END
      + 2 * (SELECT COUNT(*) FROM unnest($3::text[]) k WHERE p.benefits::text ILIKE '%'||k||'%' OR p.name ILIKE '%'||k||'%')
      + CASE WHEN EXISTS (SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN products pp ON pp.id = oi.product_id
                           WHERE o.user_id = $4 AND pp.category_id = p.category_id AND o.status NOT IN ('pending_payment','cancelled')) THEN 1 ELSE 0 END
      + CASE WHEN EXISTS (SELECT 1 FROM wishlist_items wi JOIN wishlists w ON w.id = wi.wishlist_id WHERE w.user_id = $4 AND wi.product_id = p.id) THEN 2 ELSE 0 END
      + CASE WHEN p.is_best_seller THEN 1 ELSE 0 END
     ) DESC, p.avg_rating DESC, p.created_at DESC
     LIMIT ${limit}`,
    [slugs, prefs?.skin_type ?? null, keywords, userId]);
  return rows.map(mapProduct);
}

export async function getApprovedReviews(opts: { productId?: string; limit?: number } = {}): Promise<ReviewDTO[]> {
  const params: unknown[] = [];
  let where = `r.status = 'approved'`;
  if (opts.productId) { params.push(opts.productId); where += ` AND r.product_id = $1`; }
  const rows = await query(
    `SELECT r.id, r.rating, r.title, r.body, r.created_at, r.is_verified_purchase, u.full_name, p.name AS product_name
       FROM reviews r JOIN users u ON u.id = r.user_id JOIN products p ON p.id = r.product_id
      WHERE ${where} ORDER BY r.created_at DESC LIMIT ${opts.limit ?? 20}`, params);
  return rows.map((r: any) => {
    const [first, ...rest] = String(r.full_name).split(" ");
    return {
      id: r.id, rating: r.rating, title: r.title, body: r.body, createdAt: r.created_at,
      author: rest.length ? `${first} ${rest[rest.length - 1][0]}.` : first, productName: r.product_name,
      verified: r.is_verified_purchase,
    };
  });
}

export async function recalcProductRating(productId: string) {
  await query(
    `UPDATE products SET
       avg_rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE product_id = $1 AND status = 'approved'), 0),
       review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = $1 AND status = 'approved')
     WHERE id = $1`, [productId]);
}

export async function getHomepageContent() {
  const rows = await query<{ key: string; value: any }>(`SELECT key, value FROM homepage_content`);
  const c = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    hero: {
      title: "Your Beauty. Your Way.",
      description: "Discover skincare, makeup and beauty essentials carefully selected for you.",
      imageUrl: null as string | null, ctaLabel: "Shop Now", ctaHref: "/shop",
      ...(c.hero ?? {}),
    },
    banners: (c.banners ?? []) as { title: string; text: string; href: string; imageUrl?: string }[],
    featuredIds: (c.featured_ids ?? []) as string[],
    newArrivalIds: (c.new_arrival_ids ?? []) as string[],
    bestSellerIds: (c.best_seller_ids ?? []) as string[],
  };
}
