import { requireAdmin } from "@/server/auth/guards";
import { paging } from "@/server/admin/helpers";
import { query } from "@/server/db/client";
import { ok, route } from "@/server/http";

export const GET = route(async (req) => {
  await requireAdmin("orders:read");
  const { pageSize, offset, sp } = paging(req);
  const where = [`o.status <> 'pending_payment'`]; const params: unknown[] = [];
  const status = sp.get("status");
  if (status === "pending_payment") where.splice(0, 1, `o.status = 'pending_payment'`);
  else if (status === "pending") where.push(`o.status = 'payment_confirmed'`);
  else if (status) { params.push(status); where.push(`o.status = $${params.length}`); }
  const q = sp.get("q");
  if (q) { params.push(`%${q}%`); where.push(`(o.order_number ILIKE $${params.length} OR o.customer_name ILIKE $${params.length} OR o.customer_email ILIKE $${params.length})`); }
  const w = where.join(" AND ");
  const [items, [{ n }]] = await Promise.all([
    query(`SELECT o.id, o.order_number AS "orderNumber", o.customer_name AS "customerName", o.customer_email AS "customerEmail",
                  o.total_kobo AS "totalKobo", o.status, o.created_at AS "createdAt",
                  (SELECT COUNT(*) FROM order_items WHERE order_id = o.id)::int AS "itemCount"
             FROM orders o WHERE ${w} ORDER BY o.created_at DESC LIMIT ${pageSize} OFFSET ${offset}`, params),
    query<{ n: string }>(`SELECT COUNT(*) AS n FROM orders o WHERE ${w}`, params),
  ]);
  return ok({ items: items.map((i: any) => ({ ...i, totalKobo: Number(i.totalKobo) })), total: Number(n) });
});
