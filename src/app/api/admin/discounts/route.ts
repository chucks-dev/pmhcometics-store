import { requireAdmin } from "@/server/auth/guards";
import { logAdmin } from "@/server/admin/helpers";
import { query } from "@/server/db/client";
import { HttpError, ok, parseJson, route } from "@/server/http";
import { nairaToKobo } from "@/lib/money";
import { discountSchema } from "@/lib/validation/discount";

const SELECT = `SELECT id, code, type, value, min_order_kobo AS "minOrderKobo", max_discount_kobo AS "maxDiscountKobo", starts_at AS "startsAt",
                       expires_at AS "expiresAt", usage_limit AS "usageLimit", used_count AS "usedCount", is_active AS "isActive" FROM discounts`;

export const GET = route(async () => {
  await requireAdmin("discounts:write");
  const rows = await query<any>(`${SELECT} ORDER BY created_at DESC`);
  return ok({ items: rows.map((r) => ({ ...r, value: Number(r.value), minOrderKobo: Number(r.minOrderKobo), maxDiscountKobo: r.maxDiscountKobo ? Number(r.maxDiscountKobo) : null })) });
});

export const POST = route(async (req) => {
  const ctx = await requireAdmin("discounts:write");
  const d = await parseJson(req, discountSchema);
  try {
    const [r] = await query<{ id: string }>(
      `INSERT INTO discounts (code, type, value, min_order_kobo, max_discount_kobo, starts_at, expires_at, usage_limit, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [d.code, d.type, d.type === "fixed" ? nairaToKobo(d.value) : d.value, nairaToKobo(d.minOrderNaira ?? 0),
       d.maxDiscountNaira ? nairaToKobo(d.maxDiscountNaira) : null, d.startsAt ?? null, d.expiresAt ?? null, d.usageLimit ?? null, d.isActive]);
    await logAdmin(ctx, req, "discount.create", "discount", r.id, { code: d.code });
    return ok({ id: r.id }, { status: 201 });
  } catch (e: any) {
    if (e.code === "23505") throw new HttpError(409, "That code already exists.");
    if (e.code === "23514") throw new HttpError(400, "Check the dates and values.");
    throw e;
  }
});

