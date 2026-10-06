import { z } from "zod";
import { requireAdmin } from "@/server/auth/guards";
import { logAdmin } from "@/server/admin/helpers";
import { query } from "@/server/db/client";
import { ok, parseJson, route } from "@/server/http";

export const GET = route(async () => {
  const { admin } = await requireAdmin("dashboard:view");
  const items = await query(
    `SELECT id, type, title, body, read_at AS "readAt", created_at AS "createdAt" FROM notifications WHERE admin_id = $1 ORDER BY created_at DESC LIMIT 50`, [admin.id]);
  return ok({ items, unread: items.filter((i: any) => !i.readAt).length });
});

export const PATCH = route(async () => {
  const { admin } = await requireAdmin("dashboard:view");
  await query(`UPDATE notifications SET read_at = now() WHERE admin_id = $1 AND read_at IS NULL`, [admin.id]);
  return ok({ ok: true });
});

/** Announcement to every active customer's notification inbox. */
export const POST = route(async (req) => {
  const ctx = await requireAdmin("notifications:send");
  const { title, body } = await parseJson(req, z.object({ title: z.string().trim().min(2).max(100), body: z.string().trim().max(500).optional() }));
  const r = await query(`INSERT INTO notifications (user_id, type, title, body) SELECT id, 'announcement', $1, $2 FROM users WHERE status = 'active' RETURNING id`, [title, body ?? null]);
  await logAdmin(ctx, req, "notification.broadcast", "notification", undefined, { title, recipients: r.length });
  return ok({ sent: r.length });
});
