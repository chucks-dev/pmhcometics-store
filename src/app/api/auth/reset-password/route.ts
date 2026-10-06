import { hashPassword } from "@/server/auth/password";
import { revokeAllSessions } from "@/server/auth/session";
import { consumeToken } from "@/server/auth/tokens";
import { query } from "@/server/db/client";
import { getIp, HttpError, ok, parseJson, route } from "@/server/http";
import { audit } from "@/server/security/audit";
import { rateLimit } from "@/server/security/rate-limit";
import { resetPasswordSchema } from "@/lib/validation/auth";

export const POST = route(async (req) => {
  const ip = getIp(req);
  await rateLimit(`reset:ip:${ip}`, 10, 900);
  const { token, password } = await parseJson(req, resetPasswordSchema);

  const userId = await consumeToken(token, "reset_password");
  if (!userId) throw new HttpError(400, "This link is invalid or has expired. Request a new one.", "INVALID_TOKEN");

  await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [await hashPassword(password), userId]);
  await revokeAllSessions("customer", userId); // sign out every device
  await audit({ actorType: "customer", actorId: userId, action: "customer.password_reset", ip });
  return ok({ message: "Password updated. You can log in now." });
});
