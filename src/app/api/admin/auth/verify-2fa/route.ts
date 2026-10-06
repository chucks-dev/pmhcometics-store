import { requireAdmin } from "@/server/auth/guards";
import { markAdminSessionMfaVerified } from "@/server/auth/session";
import { verifyTotp } from "@/server/auth/totp";
import { query } from "@/server/db/client";
import { getIp, HttpError, ok, parseJson, route } from "@/server/http";
import { audit } from "@/server/security/audit";
import { rateLimit } from "@/server/security/rate-limit";
import { totpSchema } from "@/lib/validation/auth";

export const POST = route(async (req) => {
  const ip = getIp(req);
  const { admin, sessionId } = await requireAdmin(undefined, { allowPendingMfa: true });
  await rateLimit(`admin-2fa:${admin.id}`, 5, 600);
  const { code } = await parseJson(req, totpSchema);

  const [row] = await query<{ totp_secret_enc: string }>(
    `SELECT totp_secret_enc FROM admin_users WHERE id = $1`, [admin.id]);

  if (!row || !verifyTotp(row.totp_secret_enc, code)) {
    await audit({ actorType: "admin", actorId: admin.id, action: "admin.2fa_failed", ip });
    throw new HttpError(401, "Invalid code.", "INVALID_2FA");
  }

  await markAdminSessionMfaVerified(sessionId);
  await query(`UPDATE admin_users SET last_login_at = now() WHERE id = $1`, [admin.id]);
  await audit({ actorType: "admin", actorId: admin.id, action: "admin.login", ip });
  return ok({ redirect: "/" });
});
