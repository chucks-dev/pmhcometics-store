import { query } from "@/server/db/client";
import { getIp, ok, parseJson, route } from "@/server/http";
import { rateLimit } from "@/server/security/rate-limit";
import { emailOnlySchema } from "@/lib/validation/auth";

export const POST = route(async (req) => {
  await rateLimit(`newsletter:${getIp(req)}`, 10, 3600);
  const { email } = await parseJson(req, emailOnlySchema);
  await query(`INSERT INTO newsletter_subscribers (email) VALUES ($1) ON CONFLICT DO NOTHING`, [email]);
  return ok({ message: "You're on the list. Welcome!" });
});
