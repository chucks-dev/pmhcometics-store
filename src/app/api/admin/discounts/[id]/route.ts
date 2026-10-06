import { requireAdmin } from "@/server/auth/guards";
import { logAdmin } from "@/server/admin/helpers";
import { query } from "@/server/db/client";
import { ok, parseJson, route, type IdCtx } from "@/server/http";
import { nairaToKobo } from "@/lib/money";
import { discountSchema } from "@/lib/validation/discount";
import { z } from "zod";

export const PATCH = route<IdCtx>(async (req, { params }) => {
  const ctx = await requireAdmin("discounts:write");
  const { id } = await params;
  const body = await req.clone().json().catch(() => ({}));
  if (body && Object.keys(body).length === 1 && "isActive" in body) {
    const { isActive } = z.object({ isActive: z.boolean() }).parse(body);
    await query(`UPDATE discounts SET is_active = $2 WHERE id = $1`, [id, isActive]);
    await logAdmin(ctx, req, isActive ? "discount.activate" : "discount.deactivate", "discount", id);
    return ok({ ok: true });
  }
  const d = await parseJson(req, discountSchema);
  await query(
    `UPDATE discounts SET code=$2, type=$3, value=$4, min_order_kobo=$5, max_discount_kobo=$6, starts_at=$7, expires_at=$8, usage_limit=$9, is_active=$10 WHERE id = $1`,
    [id, d.code, d.type, d.type === "fixed" ? nairaToKobo(d.value) : d.value, nairaToKobo(d.minOrderNaira ?? 0),
     d.maxDiscountNaira ? nairaToKobo(d.maxDiscountNaira) : null, d.startsAt ?? null, d.expiresAt ?? null, d.usageLimit ?? null, d.isActive]);
  await logAdmin(ctx, req, "discount.update", "discount", id);
  return ok({ ok: true });
});

export const DELETE = route<IdCtx>(async (req, { params }) => {
  const ctx = await requireAdmin("discounts:write");
  const { id } = await params;
  await query(`DELETE FROM discounts WHERE id = $1`, [id]);
  await logAdmin(ctx, req, "discount.delete", "discount", id);
  return ok({ ok: true });
});

