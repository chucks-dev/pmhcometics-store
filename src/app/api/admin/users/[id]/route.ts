import { z } from "zod";
import { requireAdmin } from "@/server/auth/guards";
import { revokeAllSessions } from "@/server/auth/session";
import { logAdmin } from "@/server/admin/helpers";
import { query } from "@/server/db/client";
import { HttpError, ok, parseJson, route, type IdCtx } from "@/server/http";

export const PATCH = route<IdCtx>(async (req, { params }) => {
  const ctx = await requireAdmin("admins:manage");
  const { id } = await params;
  const { role, status } = await parseJson(req, z.object({
    role: z.enum(["super_admin", "product_manager", "order_manager", "support_admin"]), status: z.enum(["active", "suspended"]),
  }));
  if (id === ctx.admin.id && (role !== ctx.admin.role || status !== "active")) {
    throw new HttpError(400, "You can't change your own role or suspend yourself.");
  }
  await query(`UPDATE admin_users SET role = $2, status = $3 WHERE id = $1`, [id, role, status]);
  await revokeAllSessions("admin", id); // changes take effect immediately
  await logAdmin(ctx, req, "admin.update", "admin_user", id, { role, status });
  return ok({ ok: true });
});
