import { requireAdmin } from "@/server/auth/guards";
import { paging } from "@/server/admin/helpers";
import { query } from "@/server/db/client";
import { ok, route } from "@/server/http";

export const GET = route(async (req) => {
  await requireAdmin("customers:read");
  const { pageSize, offset, sp } = paging(req);
  const params: unknown[] = []; let where = "TRUE";
  const q = sp.get("q"); if (q) { params.push(`%${q}%`); where = `(u.full_name ILIKE $1 OR u.email ILIKE $1 OR u.phone ILIKE $1)`; }
  const [items, [{ n }]] = await Promise.all([
    query(`SELECT u.id, u.full_name AS "fullName", u.email, u.phone, u.created_at AS "createdAt", u.status, (u.email_verified_at IS NOT NULL) AS verified,
                  COUNT(o.id) FILTER (WHERE o.status IN ('payment_confirmed','processing','shipped','out_for_delivery','delivered'))::int AS "orderCount",
                  COALESCE(SUM(o.total_kobo) FILTER (WHERE o.status IN ('payment_confirmed','processing','shipped','out_for_delivery','delivered')),0) AS "totalSpentKobo"
             FROM users u LEFT JOIN orders o ON o.user_id = u.id WHERE ${where}
            GROUP BY u.id ORDER BY u.created_at DESC LIMIT ${pageSize} OFFSET ${offset}`, params),
    query<{ n: string }>(`SELECT COUNT(*) AS n FROM users u WHERE ${where}`, params),
  ]);
  return ok({ items: items.map((i: any) => ({ ...i, totalSpentKobo: Number(i.totalSpentKobo) })), total: Number(n) });
});
