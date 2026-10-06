import { createSession } from "@/server/auth/session";
import { consumeToken } from "@/server/auth/tokens";
import { query } from "@/server/db/client";
import { getIp, HttpError, ok, parseJson, route } from "@/server/http";
import { rateLimit } from "@/server/security/rate-limit";
import { tokenSchema } from "@/lib/validation/auth";

export const POST = route(async (req) => {
  const ip = getIp(req);
  await rateLimit(`verify:ip:${ip}`, 20, 900);
  const { token } = await parseJson(req, tokenSchema);

  const userId = await consumeToken(token, "verify_email");
  if (!userId) throw new HttpError(400, "This link is invalid or has expired. Request a new one.", "INVALID_TOKEN");

  await query(`UPDATE users SET email_verified_at = COALESCE(email_verified_at, now()) WHERE id = $1`, [userId]);
  // Possessing the emailed token proves control of the address, so sign them in and start onboarding.
  await createSession("customer", userId, { ip, userAgent: req.headers.get("user-agent") ?? undefined });
  return ok({ redirect: "/onboarding" });
});
