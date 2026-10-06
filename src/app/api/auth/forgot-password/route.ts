import { issueToken } from "@/server/auth/tokens";
import { query } from "@/server/db/client";
import { sendPasswordResetEmail } from "@/server/email/send";
import { getIp, ok, parseJson, route } from "@/server/http";
import { rateLimit } from "@/server/security/rate-limit";
import { emailOnlySchema } from "@/lib/validation/auth";

export const POST = route(async (req) => {
  const { email } = await parseJson(req, emailOnlySchema);
  await rateLimit(`forgot:ip:${getIp(req)}`, 10, 3600);
  await rateLimit(`forgot:email:${email}`, 3, 3600);

  const [user] = await query<{ id: string; full_name: string }>(
    `SELECT id, full_name FROM users WHERE email = $1 AND status = 'active'`, [email]);
  if (user) await sendPasswordResetEmail(email, user.full_name, await issueToken(user.id, "reset_password", 30));
  return ok({ message: "If an account exists for that email, a reset link is on its way." });
});
