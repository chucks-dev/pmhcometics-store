import { getSession, destroySession } from "@/server/auth/session";
import { getIp, ok, route } from "@/server/http";
import { audit } from "@/server/security/audit";

export const POST = route(async (req) => {
  const s = await getSession("admin");
  await destroySession("admin");
  if (s) await audit({ actorType: "admin", actorId: s.subjectId, action: "admin.logout", ip: getIp(req) });
  return ok({ ok: true });
});
