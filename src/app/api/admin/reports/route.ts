import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { query } from "@/server/db/client";
import { ok, route } from "@/server/http";

const PAID = `('payment_confirmed','processing','shipped','out_for_delivery','delivered')`;
const iso = (v: string | null, fallback: Date) => { const d = v ? new Date(v) : fallback; return isNaN(+d) ? fallback : d; };
const csv = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export const GET = route(async (req) => {
  await requireAdmin("reports:view");
  const sp = req.nextUrl.searchParams;
  const to = iso(sp.get("to"), new Date());
  const from = iso(sp.get("from"), new Date(Date.now() - 30 * 864e5));
  const range = [from.toISOString(), new Date(+to + 864e5).toISOString()]; // `to` inclusive

  if (sp.get("format") === "csv") {
    const rows = await query<any>(
      `SELECT order_number, created_at, customer_name, customer_email, status, subtotal_kobo, delivery_fee_kobo, discount_kobo, total_kobo
         FROM orders WHERE status <> 'pending_payment' AND created_at >= $1 AND created_at < $2 ORDER BY created_at`, range);
    const head = "Order,Date,Customer,Email,Status,Subtotal NGN,Delivery NGN,Discount NGN,Total NGN\n";
    const body = rows.map((r) => [r.order_number, new Date(r.created_at).toISOString(), r.customer_name, r.customer_email, r.status,
      Number(r.subtotal_kobo) / 100, Number(r.delivery_fee_kobo) / 100, Number(r.discount_kobo) / 100, Number(r.total_kobo) / 100].map(csv).join(",")).join("\n");
    return new NextResponse(head + body, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="orders-${from.toISOString().slice(0, 10)}.csv"` } });
  }

  const [summary, topProducts, byCategory, byProvider, byStatus] = await Promise.all([
    query<any>(`SELECT COALESCE(SUM(total_kobo),0) AS revenue, COUNT(*) AS orders, COALESCE(AVG(total_kobo),0) AS aov
                  FROM orders WHERE status IN ${PAID} AND created_at >= $1 AND created_at < $2`, range),
    query<any>(`SELECT oi.product_name AS name, SUM(oi.quantity)::int AS units, SUM(oi.line_total_kobo) AS revenue
                  FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.status IN ${PAID} AND o.created_at >= $1 AND o.created_at < $2
                 GROUP BY oi.product_name ORDER BY revenue DESC LIMIT 10`, range),
    query<any>(`SELECT c.name, SUM(oi.line_total_kobo) AS revenue FROM order_items oi JOIN orders o ON o.id = oi.order_id
                  JOIN products p ON p.id = oi.product_id JOIN categories c ON c.id = p.category_id
                 WHERE o.status IN ${PAID} AND o.created_at >= $1 AND o.created_at < $2 GROUP BY c.name ORDER BY revenue DESC`, range),
    query<any>(`SELECT provider, COUNT(*)::int AS count, COALESCE(SUM(amount_kobo),0) AS amount FROM payments
                 WHERE status = 'successful' AND created_at >= $1 AND created_at < $2 GROUP BY provider`, range),
    query<any>(`SELECT status, COUNT(*)::int AS count FROM orders WHERE created_at >= $1 AND created_at < $2 GROUP BY status`, range),
  ]);
  const n = Number;
  return ok({
    from: from.toISOString(), to: to.toISOString(),
    summary: { revenueKobo: n(summary[0].revenue), orders: n(summary[0].orders), averageOrderKobo: Math.round(n(summary[0].aov)) },
    topProducts: topProducts.map((r) => ({ ...r, revenueKobo: n(r.revenue) })),
    byCategory: byCategory.map((r) => ({ name: r.name, revenueKobo: n(r.revenue) })),
    byProvider: byProvider.map((r) => ({ provider: r.provider, count: r.count, amountKobo: n(r.amount) })),
    byStatus,
  });
});
