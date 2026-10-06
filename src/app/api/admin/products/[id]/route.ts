import { requireAdmin } from "@/server/auth/guards";
import { logAdmin } from "@/server/admin/helpers";
import { query, tx } from "@/server/db/client";
import { HttpError, ok, parseJson, route, type IdCtx } from "@/server/http";
import { nairaToKobo } from "@/lib/money";
import { z } from "zod";
import { productSchema } from "@/lib/validation/product";

export const GET = route<IdCtx>(async (_req, { params }) => {
  await requireAdmin("products:read");
  const { id } = await params;
  const [p] = await query<any>(
    `SELECT id, sku, name, slug, description, category_id AS "categoryId", brand, price_kobo, discount_price_kobo, stock,
            low_stock_threshold AS "lowStockThreshold", ingredients, benefits, how_to_use AS "howToUse", skin_types AS "skinTypes",
            status, is_featured AS "isFeatured", is_best_seller AS "isBestSeller"
       FROM products WHERE id = $1 AND deleted_at IS NULL`, [id]);
  if (!p) throw new HttpError(404, "Product not found.");
  const images = await query(`SELECT url, alt FROM product_images WHERE product_id = $1 ORDER BY is_primary DESC, sort_order`, [id]);
  return ok({
    product: { ...p, priceNaira: Number(p.price_kobo) / 100, discountPriceNaira: p.discount_price_kobo ? Number(p.discount_price_kobo) / 100 : null, images },
  });
});

export const PATCH = route<IdCtx>(async (req, { params }) => {
  const { id } = await params;
  const body = await req.clone().json().catch(() => ({}));
  // Partial toggle used by the products table (publish / unpublish): needs only product write access.
  if (body && Object.keys(body).length === 1 && "status" in body) {
    const ctx = await requireAdmin("products:write");
    const { status } = z.object({ status: z.enum(["draft", "published"]) }).parse(body);
    await query(`UPDATE products SET status = $2 WHERE id = $1 AND deleted_at IS NULL`, [id, status]);
    await logAdmin(ctx, req, status === "published" ? "product.publish" : "product.unpublish", "product", id);
    return ok({ ok: true });
  }
  const ctx = await requireAdmin("products:write");
  const p = await parseJson(req, productSchema);
  await tx(async (c) => {
    try {
      const r = await c.query(
        `UPDATE products SET sku=$2, name=$3, description=$4, category_id=$5, brand=$6, price_kobo=$7, discount_price_kobo=$8, stock=$9,
                low_stock_threshold=$10, ingredients=$11, benefits=$12, how_to_use=$13, skin_types=$14, status=$15, is_featured=$16, is_best_seller=$17
          WHERE id = $1 AND deleted_at IS NULL`,
        [id, p.sku, p.name, p.description ?? null, p.categoryId, p.brand ?? null, nairaToKobo(p.priceNaira),
         p.discountPriceNaira ? nairaToKobo(p.discountPriceNaira) : null, p.stock, p.lowStockThreshold, p.ingredients ?? null,
         p.benefits, p.howToUse ?? null, p.skinTypes, p.status, p.isFeatured, p.isBestSeller]);
      if (!r.rowCount) throw new HttpError(404, "Product not found.");
    } catch (e: any) {
      if (e.code === "23505") throw new HttpError(409, "That SKU is already used by another product.", "DUPLICATE_SKU");
      throw e;
    }
    await c.query(`DELETE FROM product_images WHERE product_id = $1`, [id]);
    for (const [i, img] of (p.images ?? []).entries()) {
      await c.query(`INSERT INTO product_images (product_id, url, alt, sort_order, is_primary) VALUES ($1,$2,$3,$4,$5)`, [id, img.url, img.alt ?? null, i, i === 0]);
    }
  });
  await logAdmin(ctx, req, "product.update", "product", id, { name: p.name });
  return ok({ ok: true });
});

/** Soft delete: past orders keep pointing at the product. */
export const DELETE = route<IdCtx>(async (req, { params }) => {
  const ctx = await requireAdmin("products:write");
  const { id } = await params;
  await query(`UPDATE products SET deleted_at = now(), status = 'draft' WHERE id = $1`, [id]);
  await query(`DELETE FROM cart_items WHERE product_id = $1`, [id]);
  await logAdmin(ctx, req, "product.delete", "product", id);
  return ok({ ok: true });
});

