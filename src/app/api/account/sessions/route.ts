import { requireUser } from "@/server/auth/guards";
import { getSession } from "@/server/auth/session";
import { query } from "@/server/db/client";
import { ok, route } from "@/server/http";

/** DELETE: sign out of all other devices. */
export const DELETE = route(async () => {
  const user = await requireUser();
  const current = await getSession("customer");
  await query(`UPDATE user_sessions SET revoked_at = now() WHERE user_id = $1 AND id <> $2 AND revoked_at IS NULL`, [user.id, current?.id]);
  return ok({ ok: true });
});
