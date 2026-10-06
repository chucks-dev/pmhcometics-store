import { z } from "zod";
import { requireAdmin } from "@/server/auth/guards";
import { logAdmin } from "@/server/admin/helpers";
import { tx } from "@/server/db/client";
import { sendOrderStatusEmail } from "@/server/email/send";
import { HttpError, ok, parseJson, route, type IdCtx } from "@/server/http";
import { addStatusHistory, loadOrderDetail, orderLink, releaseStock } from "@/server/orders";
import { ORDER_STATUS_LABEL } from "@/lib/constants";

export const GET = route<IdCtx>(async (_req, { params }) => {
  await requireAdmin("orders:read");
  const order = await loadOrderDetail((await params).id);
  if (!order) throw new HttpError(404, "Order not found.");
  return ok({ order });
});

const STATUSES = ["processing", "shipped", "out_for_delivery", "delivered", "cancelled", "refunded"] as const;
const RANK: Record<string, number> = { payment_confirmed: 1, processing: 2, shipped: 3, out_for_delivery: 4, delivered: 5 };

export const PATCH = route<IdCtx>(async (req, { params }) => {
  const ctx = await requireAdmin("orders:write");
  const { id } = await params;
  const { status, note } = await parseJson(req, z.object({ status: z.enum(STATUSES), note: z.string().trim().max(300).optional() }));

  const result = await tx(async (c) => {
    const { rows: [o] } = await c.query(
      `SELECT id, order_number, status, user_id, customer_name, customer_email FROM orders WHERE id = $1 FOR UPDATE`, [id]);
    if (!o) throw new HttpError(404, "Order not found.");
    if (o.status === "pending_payment") throw new HttpError(409, "This order hasn't been paid yet.", "UNPAID");
    if (["cancelled", "refunded"].includes(o.status)) throw new HttpError(409, `This order is already ${o.status}.`, "FINAL");
    if (status in RANK && RANK[status] <= RANK[o.status]) throw new HttpError(409, "Orders can only move forward.", "BACKWARDS");

    await c.query(`UPDATE orders SET status = $2 WHERE id = $1`, [id, status]);
    await addStatusHistory(c, id, status, note, ctx.admin.id);
    if (status === "cancelled" || status === "refunded") await releaseStock(c, id);
    if (status === "refunded") await c.query(`UPDATE payments SET status = 'refunded' WHERE order_id = $1 AND status = 'successful'`, [id]);
    if (o.user_id) {
      await c.query(`INSERT INTO notifications (user_id, type, title, body) VALUES ($1,'order',$2,$3)`,
        [o.user_id, ORDER_STATUS_LABEL[status], `Order ${o.order_number} is now ${ORDER_STATUS_LABEL[status].toLowerCase()}.`]);
    }
    return o;
  });

  await logAdmin(ctx, req, "order.status", "order", id, { status, note });
  sendOrderStatusEmail(result.customer_email, result.customer_name, result.order_number, ORDER_STATUS_LABEL[status], orderLink(result.order_number, id)).catch(console.error);
  return ok({ ok: true });
});
