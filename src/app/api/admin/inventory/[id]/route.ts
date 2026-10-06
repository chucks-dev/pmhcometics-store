import { z } from "zod";
import { requireAdmin } from "@/server/auth/guards";
import { logAdmin } from "@/server/admin/helpers";
import { query } from "@/server/db/client";
import { ok, parseJson, route, type IdCtx } from "@/server/http";

export const PATCH = route<IdCtx>(async (req, { params }) => {
  const ctx = await requireAdmin("inventory:write");
  const { id } = await params;
  const { stock, lowStockThreshold } = await parseJson(req, z.object({ stock: z.number().int().min(0).max(1_000_000), lowStockThreshold: z.number().int().min(0).max(10_000) }));
  const [before] = await query<{ stock: number }>(`SELECT stock FROM products WHERE id = $1`, [id]);
  await query(`UPDATE products SET stock = $2, low_stock_threshold = $3 WHERE id = $1`, [id, stock, lowStockThreshold]);
  await logAdmin(ctx, req, "inventory.update", "product", id, { from: before?.stock, to: stock });
  return ok({ ok: true });
});
