import { z } from "zod";
import { requireUser } from "@/server/auth/guards";
import { query } from "@/server/db/client";
import { ok, parseJson, route } from "@/server/http";
import { nigerianPhone } from "@/lib/validation/auth";

export const PATCH = route(async (req) => {
  const user = await requireUser();
  const { fullName, phone } = await parseJson(req, z.object({ fullName: z.string().trim().min(2).max(100), phone: nigerianPhone }));
  await query(`UPDATE users SET full_name = $2, phone = $3 WHERE id = $1`, [user.id, fullName, phone]);
  return ok({ ok: true });
});
