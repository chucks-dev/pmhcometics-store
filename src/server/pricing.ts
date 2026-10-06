import type { PoolClient } from "pg";
import { query } from "./db/client";
import { getDeliveryConfig } from "./settings";

export async function deliveryFee(state: string | null | undefined, subtotalKobo: number): Promise<number> {
  const cfg = await getDeliveryConfig();
  if (subtotalKobo <= 0) return 0;
  if (cfg.freeOverKobo > 0 && subtotalKobo >= cfg.freeOverKobo) return 0;
  return state && state.toLowerCase() === "lagos" ? cfg.lagosKobo : cfg.otherKobo;
}

export type DiscountResult =
  | { ok: true; id: string; code: string; amountKobo: number }
  | { ok: false; reason: string };

interface DiscountRow {
  id: string; code: string; type: "percentage" | "fixed"; value: string; min_order_kobo: string;
  max_discount_kobo: string | null; usage_limit: number | null; used_count: number;
}

export async function evaluateDiscount(code: string, subtotalKobo: number, client?: PoolClient): Promise<DiscountResult> {
  const sql = `SELECT id, code, type, value, min_order_kobo, max_discount_kobo, usage_limit, used_count
                 FROM discounts
                WHERE code = $1 AND is_active
                  AND (starts_at IS NULL OR starts_at <= now())
                  AND (expires_at IS NULL OR expires_at > now())`;
  const rows = client ? (await client.query<DiscountRow>(sql, [code])).rows : await query<DiscountRow>(sql, [code]);
  const d = rows[0];
  if (!d) return { ok: false, reason: "This code isn't valid or has expired." };
  if (d.usage_limit !== null && d.used_count >= d.usage_limit) return { ok: false, reason: "This code has reached its usage limit." };
  const min = Number(d.min_order_kobo);
  if (subtotalKobo < min) return { ok: false, reason: `Spend at least ₦${(min / 100).toLocaleString("en-NG")} to use this code.` };

  let amount = d.type === "percentage" ? Math.floor((subtotalKobo * Number(d.value)) / 100) : Number(d.value);
  if (d.max_discount_kobo) amount = Math.min(amount, Number(d.max_discount_kobo));
  amount = Math.min(amount, subtotalKobo);
  return { ok: true, id: d.id, code: d.code, amountKobo: amount };
}
