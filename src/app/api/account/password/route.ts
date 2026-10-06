import { z } from "zod";
import { requireUser } from "@/server/auth/guards";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { createSession, getSession, revokeAllSessions } from "@/server/auth/session";
import { query } from "@/server/db/client";
import { getIp, HttpError, ok, parseJson, route } from "@/server/http";
import { audit } from "@/server/security/audit";
import { rateLimit } from "@/server/security/rate-limit";
import { customerPassword } from "@/lib/validation/auth";

export const POST = route(async (req) => {
  const user = await requireUser();
  await rateLimit(`pw-change:${user.id}`, 5, 900);
  const { currentPassword, newPassword } = await parseJson(req, z.object({ currentPassword: z.string().max(128), newPassword: customerPassword }));
  const [row] = await query<{ password_hash: string }>(`SELECT password_hash FROM users WHERE id = $1`, [user.id]);
  if (!(await verifyPassword(row.password_hash, currentPassword))) throw new HttpError(400, "Your current password is incorrect.", "WRONG_PASSWORD");

  await query(`UPDATE users SET password_hash = $2 WHERE id = $1`, [user.id, await hashPassword(newPassword)]);
  await revokeAllSessions("customer", user.id);                       // sign out everywhere...
  await createSession("customer", user.id, { ip: getIp(req), userAgent: req.headers.get("user-agent") ?? undefined }); // ...then keep this device
  await audit({ actorType: "customer", actorId: user.id, action: "customer.password_changed", ip: getIp(req) });
  return ok({ ok: true });
});
