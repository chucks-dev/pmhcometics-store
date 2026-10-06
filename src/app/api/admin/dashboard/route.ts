import { requireAdmin } from "@/server/auth/guards";
import { query } from "@/server/db/client";
import { ok, route } from "@/server/http";

const PAID = `('payment_confirmed','processing','shipped','out_for_delivery','delivered')`;

export const GET = route(async () => {
  await requireAdmin("dashboard:view");
  const [[s], daily, customersDaily, recent] = await Promise.all([
    query<any>(`SELECT
        (SELECT COALESCE(SUM(total_kobo),0) FROM orders WHERE status IN ${PAID}) AS total_sales,
        (SELECT COUNT(*) FROM orders WHERE status IN ${PAID}) AS total_orders,
        (SELECT COUNT(*) FROM users) AS customers,
        (SELECT COUNT(*) FROM products WHERE deleted_at IS NULL) AS products,
        (SELECT COUNT(*) FROM orders WHERE status = 'payment_confirmed') AS pending_orders,
        (SELECT COUNT(*) FROM products WHERE deleted_at IS NULL AND stock > 0 AND stock <= low_stock_threshold) AS low_stock,
        (SELECT COUNT(*) FROM payments WHERE status = 'successful') AS ok_payments,
        (SELECT COUNT(*) FROM payments WHERE status = 'failed') AS failed_payments`),
    query<any>(`SELECT to_char(d, 'YYYY-MM-DD') AS day,
        COALESCE(SUM(o.total_kobo),0) AS sales, COUNT(o.id) AS orders
      FROM generate_series(current_date - 29, current_date, '1 day') d
      LEFT JOIN orders o ON o.created_at::date = d::date AND o.status IN ${PAID}
      GROUP BY d ORDER BY d`),
    query<any>(`SELECT to_char(d, 'YYYY-MM-DD') AS day, COUNT(u.id) AS customers
      FROM generate_series(current_date - 29, current_date, '1 day') d
      LEFT JOIN users u ON u.created_at::date = d::date GROUP BY d ORDER BY d`),
    query<any>(`SELECT id, order_number AS "orderNumber", customer_name AS "customerName", total_kobo AS "totalKobo", status, created_at AS "createdAt"
      FROM orders WHERE status <> 'pending_payment' ORDER BY created_at DESC LIMIT 8`),
  ]);
  const n = (v: any) => Number(v);
  return ok({
    stats: {
      totalSalesKobo: n(s.total_sales), totalOrders: n(s.total_orders), customers: n(s.customers), products: n(s.products),
      pendingOrders: n(s.pending_orders), lowStock: n(s.low_stock), successfulPayments: n(s.ok_payments), failedPayments: n(s.failed_payments),
    },
    daily: daily.map((d: any, i: number) => ({ day: d.day, salesKobo: n(d.sales), orders: n(d.orders), customers: n(customersDaily[i].customers) })),
    recentOrders: recent.map((r: any) => ({ ...r, totalKobo: n(r.totalKobo) })),
  });
});
