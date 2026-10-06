import { z } from "zod";
import { requireAdmin } from "@/server/auth/guards";
import { logAdmin } from "@/server/admin/helpers";
import { query } from "@/server/db/client";
import { HttpError, ok, parseJson, route } from "@/server/http";
import { slugify } from "@/lib/slug";

const categorySchemaFields = {
  name: z.string().trim().min(2).max(60), description: z.string().trim().max(300).optional().nullable(),
  imageUrl: z.string().url().max(500).optional().nullable(), sortOrder: z.number().int().min(0).max(1000).default(0), isActive: z.boolean().default(true),
};

export const GET = route(async () => {
  await requireAdmin("products:read");
  return ok({ items: await query(
    `SELECT c.id, c.name, c.slug, c.description, c.image_url AS "imageUrl", c.sort_order AS "sortOrder", c.is_active AS "isActive",
            (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.deleted_at IS NULL)::int AS "productCount"
       FROM categories c ORDER BY c.sort_order, c.name`) });
});

export const POST = route(async (req) => {
  const ctx = await requireAdmin("categories:write");
  const c = await parseJson(req, z.object(categorySchemaFields));
  const rows = await query<{ id: string }>(
    `INSERT INTO categories (name, slug, description, image_url, sort_order, is_active) VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (slug) DO NOTHING RETURNING id`, [c.name, slugify(c.name), c.description ?? null, c.imageUrl ?? null, c.sortOrder, c.isActive]);
  if (!rows[0]) throw new HttpError(409, "A category with that name already exists.");
  await logAdmin(ctx, req, "category.create", "category", rows[0].id, { name: c.name });
  return ok({ id: rows[0].id }, { status: 201 });
});
