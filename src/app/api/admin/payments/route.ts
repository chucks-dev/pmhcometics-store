import { requireAdmin } from "@/server/auth/guards";
import { paging } from "@/server/admin/helpers";
import { query } from "@/server/db/client";
import { ok, route } from "@/server/http";

export const GET = route(async (req) => {
  await requireAdmin("payments:read");
  const { pageSize, offset, sp } = paging(req);
  const where = ["TRUE"]; const params: unknown[] = [];
  for (const [key, col] of [["provider", "p.provider"], ["status", "p.status"]] as const) {
    const v = sp.get(key); if (v) { params.push(v); where.push(`${col} = $${params.length}`); }
  }
  const q = sp.get("q"); if (q) { params.push(`%${q}%`); where.push(`(p.reference ILIKE $${params.length} OR o.order_number ILIKE $${params.length} OR o.customer_name ILIKE $${params.length})`); }
  const w = where.join(" AND ");
  const [items, [{ n }]] = await Promise.all([
    query(`SELECT p.id, p.reference AS "transactionId", p.provider_transaction_id AS "providerTxId", o.order_number AS "orderNumber", o.id AS "orderId",
                  o.customer_name AS "customer", p.provider, p.amount_kobo AS "amountKobo", p.currency, p.status, p.created_at AS "createdAt", p.paid_at AS "paidAt"
             FROM payments p JOIN orders o ON o.id = p.order_id WHERE ${w} ORDER BY p.created_at DESC LIMIT ${pageSize} OFFSET ${offset}`, params),
    query<{ n: string }>(`SELECT COUNT(*) AS n FROM payments p JOIN orders o ON o.id = p.order_id WHERE ${w}`, params),
  ]);
  return ok({ items: items.map((i: any) => ({ ...i, amountKobo: Number(i.amountKobo) })), total: Number(n) });
});
