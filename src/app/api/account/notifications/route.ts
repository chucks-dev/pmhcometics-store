import { requireUser } from "@/server/auth/guards";
import { query } from "@/server/db/client";
import { ok, route } from "@/server/http";

export const GET = route(async () => {
  const user = await requireUser();
  const rows = await query(
    `SELECT id, type, title, body, read_at AS "readAt", created_at AS "createdAt"
       FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`, [user.id]);
  return ok({ notifications: rows, unread: rows.filter((r: any) => !r.readAt).length });
});

export const PATCH = route(async () => {
  const user = await requireUser();
  await query(`UPDATE notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL`, [user.id]);
  return ok({ ok: true });
});
