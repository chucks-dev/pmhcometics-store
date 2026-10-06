import { z } from "zod";
import { requireAdmin } from "@/server/auth/guards";
import { logAdmin } from "@/server/admin/helpers";
import { getDeliveryConfig, getStoreSettings, setSetting } from "@/server/settings";
import { ok, parseJson, route } from "@/server/http";

export const GET = route(async () => {
  await requireAdmin("settings:manage");
  return ok({ delivery: await getDeliveryConfig(), store: await getStoreSettings() });
});

export const PUT = route(async (req) => {
  const ctx = await requireAdmin("settings:manage");
  const s = await parseJson(req, z.object({
    delivery: z.object({ lagosKobo: z.number().int().min(0), otherKobo: z.number().int().min(0), freeOverKobo: z.number().int().min(0) }),
    store: z.object({ name: z.string().trim().min(2).max(60), supportEmail: z.string().email(), supportPhone: z.string().trim().max(30) }),
  }));
  await setSetting("delivery", s.delivery);
  await setSetting("store", s.store);
  await logAdmin(ctx, req, "settings.update", "settings");
  return ok({ ok: true });
});
