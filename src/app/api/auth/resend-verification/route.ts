import { issueToken } from "@/server/auth/tokens";
import { query } from "@/server/db/client";
import { sendVerificationEmail } from "@/server/email/send";
import { getIp, ok, parseJson, route } from "@/server/http";
import { rateLimit } from "@/server/security/rate-limit";
import { emailOnlySchema } from "@/lib/validation/auth";

export const POST = route(async (req) => {
  const { email } = await parseJson(req, emailOnlySchema);
  await rateLimit(`resend:ip:${getIp(req)}`, 10, 3600);
  await rateLimit(`resend:email:${email}`, 3, 3600);

  const [user] = await query<{ id: string; full_name: string }>(
    `SELECT id, full_name FROM users WHERE email = $1 AND email_verified_at IS NULL AND status = 'active'`,
    [email],
  );
  if (user) await sendVerificationEmail(email, user.full_name, await issueToken(user.id, "verify_email", 60 * 24));
  return ok({ message: "If that account needs verification, we've sent a new link." });
});
