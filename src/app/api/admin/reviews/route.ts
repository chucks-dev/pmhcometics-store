import { requireAdmin } from "@/server/auth/guards";
import { paging } from "@/server/admin/helpers";
import { query } from "@/server/db/client";
import { ok, route } from "@/server/http";

export const GET = route(async (req) => {
  await requireAdmin("reviews:moderate");
  const { pageSize, offset, sp } = paging(req);
  const status = sp.get("status"); const params: unknown[] = []; let where = "TRUE";
  if (status) { params.push(status); where = `r.status = $1`; }
  const [items, [{ n }]] = await Promise.all([
    query(`SELECT r.id, r.rating, r.title, r.body, r.status, r.created_at AS "createdAt", r.is_verified_purchase AS verified,
                  u.full_name AS author, p.name AS "productName"
             FROM reviews r JOIN users u ON u.id = r.user_id JOIN products p ON p.id = r.product_id
            WHERE ${where} ORDER BY r.created_at DESC LIMIT ${pageSize} OFFSET ${offset}`, params),
    query<{ n: string }>(`SELECT COUNT(*) AS n FROM reviews r WHERE ${where}`, params),
  ]);
  return ok({ items, total: Number(n) });
});
