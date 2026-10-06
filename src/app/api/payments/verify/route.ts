import { z } from "zod";
import { getCurrentUser } from "@/server/auth/guards";
import { query } from "@/server/db/client";
import { getIp, HttpError, ok, parseJson, route } from "@/server/http";
import { validTrackingToken } from "@/server/orders";
import { processPayment } from "@/server/payments/confirm";
import { rateLimit } from "@/server/security/rate-limit";

/** Called by the return page. The browser's "success" is ignored: we ask the gateway ourselves. */
export const POST = route(async (req) => {
  await rateLimit(`pay-verify:${getIp(req)}`, 60, 600);
  const { order: orderNumber, t } = await parseJson(req, z.object({ order: z.string().max(30), t: z.string().max(100).optional() }));

  const [order] = await query<{ id: string; user_id: string | null }>(`SELECT id, user_id FROM orders WHERE order_number = $1`, [orderNumber]);
  if (!order) throw new HttpError(404, "Order not found.");
  const user = await getCurrentUser();
  if (!(validTrackingToken(order.id, t) || (user && order.user_id === user.id))) throw new HttpError(403, "Not allowed.");

  const [pay] = await query<{ provider: "paystack" | "flutterwave"; reference: string }>(
    `SELECT provider, reference FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1`, [order.id]);
  if (!pay) throw new HttpError(404, "Payment not found.");
  return ok(await processPayment(pay.provider, pay.reference));
});
