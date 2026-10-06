import { burnVerify, verifyPassword } from "@/server/auth/password";
import { createSession } from "@/server/auth/session";
import { query } from "@/server/db/client";
import { getIp, HttpError, ok, parseJson, route } from "@/server/http";
import { audit } from "@/server/security/audit";
import { rateLimit } from "@/server/security/rate-limit";
import { adminLoginSchema } from "@/lib/validation/auth";

const MAX_FAILS = 5;
const LOCK_MINUTES = 15;

interface AdminRow {
  id: string; password_hash: string; status: "active" | "suspended"; locked_until: string | null;
}

export const POST = route(async (req) => {
  const ip = getIp(req);
  const { email, password } = await parseJson(req, adminLoginSchema);
  await rateLimit(`admin-login:ip:${ip}`, 10, 900);
  await rateLimit(`admin-login:email:${email}`, 10, 900);

  const generic = new HttpError(401, "Incorrect email or password.", "INVALID_CREDENTIALS");
  const [admin] = await query<AdminRow>(
    `SELECT id, password_hash, status, locked_until FROM admin_users WHERE email = $1`, [email]);

  if (!admin) { await burnVerify(password); throw generic; }

  if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
    await audit({ actorType: "admin", actorId: admin.id, action: "admin.login_blocked_locked", ip });
    throw new HttpError(423, "Account temporarily locked. Try again later.", "LOCKED");
  }

  if (!(await verifyPassword(admin.password_hash, password))) {
    await query(
      `UPDATE admin_users
          SET failed_attempts = CASE WHEN failed_attempts + 1 >= $2 THEN 0 ELSE failed_attempts + 1 END,
              locked_until    = CASE WHEN failed_attempts + 1 >= $2 THEN now() + make_interval(mins => $3) ELSE locked_until END
        WHERE id = $1`,
      [admin.id, MAX_FAILS, LOCK_MINUTES],
    );
    await audit({ actorType: "admin", actorId: admin.id, action: "admin.login_failed", ip });
    throw generic;
  }
  if (admin.status !== "active") throw generic;

  await query(`UPDATE admin_users SET failed_attempts = 0, locked_until = NULL WHERE id = $1`, [admin.id]);
  // Password alone only yields a *pending* session; requireAdmin() rejects it until TOTP is verified.
  await createSession("admin", admin.id, { ip, userAgent: req.headers.get("user-agent") ?? undefined, mfaVerified: false });
  await audit({ actorType: "admin", actorId: admin.id, action: "admin.login_password_ok", ip });
  return ok({ next: "verify-2fa" });
});
