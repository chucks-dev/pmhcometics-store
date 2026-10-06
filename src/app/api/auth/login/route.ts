import { burnVerify, verifyPassword } from "@/server/auth/password";
import { createSession } from "@/server/auth/session";
import { query } from "@/server/db/client";
import { getIp, HttpError, ok, parseJson, route } from "@/server/http";
import { audit } from "@/server/security/audit";
import { rateLimit } from "@/server/security/rate-limit";
import { loginSchema } from "@/lib/validation/auth";

interface UserRow {
  id: string; full_name: string; email: string; password_hash: string;
  email_verified_at: string | null; status: "active" | "suspended";
  onboarding_completed: boolean | null;
}

export const POST = route(async (req) => {
  const ip = getIp(req);
  const { email, password } = await parseJson(req, loginSchema);
  await rateLimit(`login:ip:${ip}`, 20, 900);
  await rateLimit(`login:email:${email}`, 8, 900);

  const [user] = await query<UserRow>(
    `SELECT u.id, u.full_name, u.email, u.password_hash, u.email_verified_at, u.status,
            p.onboarding_completed
       FROM users u LEFT JOIN user_preferences p ON p.user_id = u.id
      WHERE u.email = $1`,
    [email],
  );

  const invalid = new HttpError(401, "Incorrect email or password.", "INVALID_CREDENTIALS");
  if (!user) { await burnVerify(password); throw invalid; }
  if (!(await verifyPassword(user.password_hash, password))) throw invalid;
  if (user.status !== "active") throw new HttpError(403, "This account is unavailable. Contact support.", "SUSPENDED");
  if (!user.email_verified_at) {
    throw new HttpError(403, "Please verify your email before logging in.", "EMAIL_NOT_VERIFIED");
  }

  await createSession("customer", user.id, { ip, userAgent: req.headers.get("user-agent") ?? undefined });
  await audit({ actorType: "customer", actorId: user.id, action: "customer.login", ip });

  const done = user.onboarding_completed === true;
  return ok({
    user: { id: user.id, fullName: user.full_name, email: user.email, onboardingCompleted: done },
    redirect: done ? "/" : "/onboarding",
  });
});
