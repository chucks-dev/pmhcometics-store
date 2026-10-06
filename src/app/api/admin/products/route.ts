import { requireAdmin } from "@/server/auth/guards";
import { logAdmin, paging } from "@/server/admin/helpers";
import { query, tx } from "@/server/db/client";
import { HttpError, ok, parseJson, route } from "@/server/http";
import { nairaToKobo } from "@/lib/money";
import { slugify } from "@/lib/slug";
import { productSchema } from "@/lib/validation/product";

export const GET = route(async (req) => {
  await requireAdmin("products:read");
  const { pageSize, offset, sp } = paging(req);
  const where = [`p.deleted_at IS NULL`]; const params: unknown[] = [];
  const q = sp.get("q"); if (q) { params.push(`%${q}%`); where.push(`(p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length})`); }
  const status = sp.get("status"); if (status) { params.push(status); where.push(`p.status = $${params.length}`); }
  const w = where.join(" AND ");
  const [rows, [{ n }]] = await Promise.all([
    query(`SELECT p.id, p.name, p.sku, p.brand, p.price_kobo AS "priceKobo", p.discount_price_kobo AS "discountPriceKobo", p.stock, p.low_stock_threshold AS "lowStockThreshold",
                  p.status, c.name AS category, (SELECT url FROM product_images i WHERE i.product_id = p.id ORDER BY is_primary DESC, sort_order LIMIT 1) AS image
             FROM products p JOIN categories c ON c.id = p.category_id WHERE ${w} ORDER BY p.created_at DESC LIMIT ${pageSize} OFFSET ${offset}`, params),
    query<{ n: string }>(`SELECT COUNT(*) AS n FROM products p WHERE ${w}`, params),
  ]);
  return ok({ items: rows, total: Number(n) });
});

export const POST = route(async (req) => {
  const ctx = await requireAdmin("products:write");
  const p = await parseJson(req, productSchema);
  const id = await tx(async (c) => {
    let slug = slugify(p.name);
    const { rows: taken } = await c.query(`SELECT 1 FROM products WHERE slug = $1`, [slug]);
    if (taken.length) slug += "-" + Math.random().toString(36).slice(2, 6);
    try {
      const { rows: [r] } = await c.query(
        `INSERT INTO products (sku, name, slug, description, category_id, brand, price_kobo, discount_price_kobo, stock, low_stock_threshold,
                               ingredients, benefits, how_to_use, skin_types, status, is_featured, is_best_seller)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING id`,
        [p.sku, p.name, slug, p.description ?? null, p.categoryId, p.brand ?? null, nairaToKobo(p.priceNaira),
         p.discountPriceNaira ? nairaToKobo(p.discountPriceNaira) : null, p.stock, p.lowStockThreshold, p.ingredients ?? null,
         p.benefits, p.howToUse ?? null, p.skinTypes, p.status, p.isFeatured, p.isBestSeller]);
      for (const [i, img] of (p.images ?? []).entries()) {
        await c.query(`INSERT INTO product_images (product_id, url, alt, sort_order, is_primary) VALUES ($1,$2,$3,$4,$5)`, [r.id, img.url, img.alt ?? null, i, i === 0]);
      }
      return r.id as string;
    } catch (e: any) {
      if (e.code === "23505") throw new HttpError(409, "That SKU is already used by another product.", "DUPLICATE_SKU");
      throw e;
    }
  });
  await logAdmin(ctx, req, "product.create", "product", id, { name: p.name });
  return ok({ id }, { status: 201 });
});

