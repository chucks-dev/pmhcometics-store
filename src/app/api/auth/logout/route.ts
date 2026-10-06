import { destroySession } from "@/server/auth/session";
import { ok, route } from "@/server/http";

export const POST = route(async () => {
  await destroySession("customer");
  return ok({ ok: true });
});
