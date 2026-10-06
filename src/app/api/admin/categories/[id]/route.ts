import { z } from "zod";
import { requireAdmin } from "@/server/auth/guards";
import { logAdmin } from "@/server/admin/helpers";
import { query } from "@/server/db/client";
import { HttpError, ok, parseJson, route, type IdCtx } from "@/server/http";

const schema = z.object({
  name: z.string().trim().min(2).max(60), description: z.string().trim().max(300).optional().nullable(),
  imageUrl: z.string().url().max(500).optional().nullable(), sortOrder: z.number().int().min(0).max(1000), isActive: z.boolean(),
});

export const PATCH = route<IdCtx>(async (req, { params }) => {
  const ctx = await requireAdmin("categories:write");
  const { id } = await params;
  const c = await parseJson(req, schema);
  await query(`UPDATE categories SET name=$2, description=$3, image_url=$4, sort_order=$5, is_active=$6 WHERE id = $1`,
    [id, c.name, c.description ?? null, c.imageUrl ?? null, c.sortOrder, c.isActive]);
  await logAdmin(ctx, req, "category.update", "category", id);
  return ok({ ok: true });
});

export const DELETE = route<IdCtx>(async (req, { params }) => {
  const ctx = await requireAdmin("categories:write");
  const { id } = await params;
  const [{ n }] = await query<{ n: string }>(`SELECT COUNT(*) AS n FROM products WHERE category_id = $1`, [id]);
  if (Number(n) > 0) throw new HttpError(409, "Move or delete this category's products first.", "HAS_PRODUCTS");
  await query(`DELETE FROM categories WHERE id = $1`, [id]);
  await logAdmin(ctx, req, "category.delete", "category", id);
  return ok({ ok: true });
});
