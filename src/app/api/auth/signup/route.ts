import { hashPassword } from "@/server/auth/password";
import { issueToken } from "@/server/auth/tokens";
import { query, tx } from "@/server/db/client";
import { env } from "@/server/env";
import { sendVerificationEmail } from "@/server/email/send";
import { getIp, ok, parseJson, route } from "@/server/http";
import { rateLimit } from "@/server/security/rate-limit";
import { signupSchema } from "@/lib/validation/auth";

export const POST = route(async (req) => {
  await rateLimit(`signup:ip:${getIp(req)}`, 10, 3600);
  const input = await parseJson(req, signupSchema);
  const passwordHash = await hashPassword(input.password);

  const userId = await tx(async (c) => {
    const r = await c.query<{ id: string }>(
      `INSERT INTO users (full_name, email, phone, password_hash) VALUES ($1,$2,$3,$4)
       ON CONFLICT (email) DO NOTHING RETURNING id`,
      [input.fullName, input.email, input.phone, passwordHash],
    );
    if (!r.rows[0]) return null;
    await c.query(`INSERT INTO user_preferences (user_id) VALUES ($1)`, [r.rows[0].id]);
    return r.rows[0].id;
  });

  if (userId) {
    if (env.devAutoVerify) {
      await query(`UPDATE users SET email_verified_at = now() WHERE id = $1`, [userId]);
    } else {
      const token = await issueToken(userId, "verify_email", 60 * 24);
      await sendVerificationEmail(input.email, input.fullName, token);
    }
  }
  // Same response whether or not the email already existed: no account enumeration.
  return ok({ message: "Check your email to verify your account." }, { status: 201 });
});
