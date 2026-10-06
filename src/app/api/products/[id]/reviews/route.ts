import { z } from "zod";
import { requireUser } from "@/server/auth/guards";
import { getApprovedReviews } from "@/server/catalog";
import { query } from "@/server/db/client";
import { HttpError, ok, parseJson, route, type IdCtx } from "@/server/http";
import { notifyAdmins } from "@/server/orders";

export const GET = route<IdCtx>(async (_req, { params }) => ok({ reviews: await getApprovedReviews({ productId: (await params).id, limit: 50 }) }));

/** Only customers who bought the product can review it. Reviews wait for admin approval. */
export const POST = route<IdCtx>(async (req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const body = await parseJson(req, z.object({
    rating: z.number().int().min(1).max(5), title: z.string().trim().max(100).optional(), body: z.string().trim().max(2000).optional(),
  }));
  const [purchase] = await query<{ order_id: string }>(
    `SELECT o.id AS order_id FROM orders o JOIN order_items oi ON oi.order_id = o.id
      WHERE o.user_id = $1 AND oi.product_id = $2 AND o.status IN ('payment_confirmed','processing','shipped','out_for_delivery','delivered')
      ORDER BY o.created_at DESC LIMIT 1`, [user.id, id]);
  if (!purchase) throw new HttpError(403, "You can review products after you've purchased them.", "NOT_PURCHASED");

  const r = await query(
    `INSERT INTO reviews (product_id, user_id, order_id, rating, title, body, is_verified_purchase)
     VALUES ($1,$2,$3,$4,$5,$6,true) ON CONFLICT (product_id, user_id) DO NOTHING RETURNING id`,
    [id, user.id, purchase.order_id, body.rating, body.title ?? null, body.body ?? null]);
  if (!r.length) throw new HttpError(409, "You've already reviewed this product.", "DUPLICATE");
  await notifyAdmins(null, ["super_admin", "product_manager", "support_admin"], "review", "New review to approve", `${user.full_name} left a ${body.rating}★ review.`);
  return ok({ message: "Thanks! Your review will appear once it's approved." }, { status: 201 });
});
