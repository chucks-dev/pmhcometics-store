import { requireAdmin } from "@/server/auth/guards";
import { paging } from "@/server/admin/helpers";
import { query } from "@/server/db/client";
import { ok, route } from "@/server/http";

export const GET = route(async (req) => {
  await requireAdmin("audit:read");
  const { pageSize, offset } = paging(req, 50);
  const items = await query(
    `SELECT a.id, a.actor_type AS "actorType", a.action, a.entity_type AS "entityType", a.entity_id AS "entityId", a.metadata, a.ip, a.created_at AS "createdAt",
            u.email AS "actorEmail"
       FROM audit_logs a LEFT JOIN admin_users u ON a.actor_type = 'admin' AND u.id = a.actor_id
      ORDER BY a.id DESC LIMIT ${pageSize} OFFSET ${offset}`);
  return ok({ items });
});
