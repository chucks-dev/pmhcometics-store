import { z } from "zod";
import { requireUser } from "@/server/auth/guards";
import { listProducts } from "@/server/catalog";
import { query } from "@/server/db/client";
import { ok, parseJson, route } from "@/server/http";

async function wishlistId(userId: string) {
  const [w] = await query<{ id: string }>(
    `INSERT INTO wishlists (user_id) VALUES ($1) ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id RETURNING id`, [userId]);
  return w.id;
}

export const GET = route(async (req) => {
  const user = await requireUser();
  const ids = (await query<{ product_id: string }>(
    `SELECT wi.product_id FROM wishlist_items wi JOIN wishlists w ON w.id = wi.wishlist_id WHERE w.user_id = $1 ORDER BY wi.added_at DESC`, [user.id])).map((r) => r.product_id);
  if (req.nextUrl.searchParams.get("ids") === "1" || !ids.length) return ok({ ids, items: [] });
  const { items } = await listProducts({ ids, pageSize: 48 });
  return ok({ ids, items });
});

export const POST = route(async (req) => {
  const user = await requireUser();
  const { productId } = await parseJson(req, z.object({ productId: z.string().uuid() }));
  await query(`INSERT INTO wishlist_items (wishlist_id, product_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [await wishlistId(user.id), productId]);
  return ok({ ok: true });
});

export const DELETE = route(async (req) => {
  const user = await requireUser();
  const productId = z.string().uuid().parse(req.nextUrl.searchParams.get("productId"));
  await query(
    `DELETE FROM wishlist_items WHERE product_id = $2 AND wishlist_id IN (SELECT id FROM wishlists WHERE user_id = $1)`, [user.id, productId]);
  return ok({ ok: true });
});
