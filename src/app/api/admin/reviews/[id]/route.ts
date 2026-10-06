import { z } from "zod";
import { requireAdmin } from "@/server/auth/guards";
import { logAdmin } from "@/server/admin/helpers";
import { recalcProductRating } from "@/server/catalog";
import { query } from "@/server/db/client";
import { ok, parseJson, route, type IdCtx } from "@/server/http";

export const PATCH = route<IdCtx>(async (req, { params }) => {
  const ctx = await requireAdmin("reviews:moderate");
  const { id } = await params;
  const { status } = await parseJson(req, z.object({ status: z.enum(["approved", "hidden"]) }));
  const [r] = await query<{ product_id: string }>(`UPDATE reviews SET status = $2 WHERE id = $1 RETURNING product_id`, [id, status]);
  if (r) await recalcProductRating(r.product_id);
  await logAdmin(ctx, req, `review.${status}`, "review", id);
  return ok({ ok: true });
});

export const DELETE = route<IdCtx>(async (req, { params }) => {
  const ctx = await requireAdmin("reviews:moderate");
  const { id } = await params;
  const [r] = await query<{ product_id: string }>(`DELETE FROM reviews WHERE id = $1 RETURNING product_id`, [id]);
  if (r) await recalcProductRating(r.product_id);
  await logAdmin(ctx, req, "review.delete", "review", id);
  return ok({ ok: true });
});
