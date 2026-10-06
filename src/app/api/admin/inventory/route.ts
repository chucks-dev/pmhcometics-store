import { requireAdmin } from "@/server/auth/guards";
import { paging } from "@/server/admin/helpers";
import { query } from "@/server/db/client";
import { ok, route } from "@/server/http";

export const GET = route(async (req) => {
  await requireAdmin("inventory:write");
  const { pageSize, offset, sp } = paging(req, 30);
  const where = [`p.deleted_at IS NULL`]; const params: unknown[] = [];
  const q = sp.get("q"); if (q) { params.push(`%${q}%`); where.push(`(p.name ILIKE $1 OR p.sku ILIKE $1)`); }
  const st = sp.get("status");
  if (st === "out") where.push(`p.stock = 0`);
  if (st === "low") where.push(`p.stock > 0 AND p.stock <= p.low_stock_threshold`);
  if (st === "in") where.push(`p.stock > p.low_stock_threshold`);
  const w = where.join(" AND ");
  const [items, [{ n }]] = await Promise.all([
    query(`SELECT p.id, p.name, p.sku, p.stock, p.low_stock_threshold AS "lowStockThreshold",
                  CASE WHEN p.stock = 0 THEN 'out' WHEN p.stock <= p.low_stock_threshold THEN 'low' ELSE 'in' END AS status
             FROM products p WHERE ${w} ORDER BY p.stock ASC, p.name LIMIT ${pageSize} OFFSET ${offset}`, params),
    query<{ n: string }>(`SELECT COUNT(*) AS n FROM products p WHERE ${w}`, params),
  ]);
  return ok({ items, total: Number(n) });
});
