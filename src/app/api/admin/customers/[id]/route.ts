import { z } from "zod";
import { requireAdmin } from "@/server/auth/guards";
import { revokeAllSessions } from "@/server/auth/session";
import { logAdmin } from "@/server/admin/helpers";
import { query } from "@/server/db/client";
import { ok, parseJson, route, type IdCtx } from "@/server/http";

// Admins can suspend/reactivate accounts. Password hashes are never exposed by any admin endpoint.
export const PATCH = route<IdCtx>(async (req, { params }) => {
  const ctx = await requireAdmin("customers:manage");
  const { id } = await params;
  const { status } = await parseJson(req, z.object({ status: z.enum(["active", "suspended"]) }));
  await query(`UPDATE users SET status = $2 WHERE id = $1`, [id, status]);
  if (status === "suspended") await revokeAllSessions("customer", id);
  await logAdmin(ctx, req, `customer.${status}`, "user", id);
  return ok({ ok: true });
});
