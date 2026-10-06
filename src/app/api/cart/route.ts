import { getCartDTO } from "@/server/cart";
import { ok, route } from "@/server/http";

export const GET = route(async (req) => {
  const sp = req.nextUrl.searchParams;
  return ok(await getCartDTO({ code: sp.get("code"), state: sp.get("state") }));
});
