import { z } from "zod";
import { query } from "@/server/db/client";
import { getIp, ok, parseJson, route } from "@/server/http";
import { notifyAdmins } from "@/server/orders";
import { rateLimit } from "@/server/security/rate-limit";
import { email } from "@/lib/validation/auth";

export const POST = route(async (req) => {
  await rateLimit(`contact:${getIp(req)}`, 5, 3600);
  const m = await parseJson(req, z.object({ name: z.string().trim().min(2).max(100), email, message: z.string().trim().min(10).max(4000) }));
  await query(`INSERT INTO contact_messages (name, email, message) VALUES ($1,$2,$3)`, [m.name, m.email, m.message]);
  await notifyAdmins(null, ["super_admin", "support_admin"], "contact", "New contact message", `${m.name} (${m.email}) wrote in.`);
  return ok({ message: "Thanks, we'll get back to you soon." }, { status: 201 });
});
