import { createHmac, timingSafeEqual } from "node:crypto";
import type { PoolClient } from "pg";
import { env } from "./env";
import { query } from "./db/client";

/** Guest-friendly order link token: HMAC of the order id. Nothing extra to store. */
export function trackingToken(orderId: string): string {
  return createHmac("sha256", Buffer.from(env.totpKey, "base64")).update(`order-track:${orderId}`).digest("base64url");
}
export function validTrackingToken(orderId: string, token: string | null | undefined): boolean {
  if (!token) return false;
  const a = Buffer.from(trackingToken(orderId));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
export const orderLink = (orderNumber: string, orderId: string) =>
  `${env.appUrl}/order/${orderNumber}?t=${trackingToken(orderId)}`;

/** Puts reserved stock back. Call inside the same transaction that cancels the order. */
export async function releaseStock(c: PoolClient, orderId: string) {
  await c.query(
    `UPDATE products p SET stock = p.stock + oi.quantity FROM order_items oi
      WHERE oi.order_id = $1 AND oi.product_id = p.id`, [orderId]);
}

export async function addStatusHistory(c: PoolClient, orderId: string, status: string, note?: string, adminId?: string) {
  await c.query(`INSERT INTO order_status_history (order_id, status, note, changed_by) VALUES ($1,$2,$3,$4)`,
    [orderId, status, note ?? null, adminId ?? null]);
}

export async function notifyAdmins(c: PoolClient | null, roles: string[], type: string, title: string, body: string) {
  const sql = `INSERT INTO notifications (admin_id, type, title, body)
               SELECT id, $2, $3, $4 FROM admin_users WHERE status = 'active' AND role = ANY($1::admin_role[])`;
  if (c) await c.query(sql, [roles, type, title, body]);
  else await query(sql, [roles, type, title, body]);
}

export async function loadOrderDetail(orderId: string) {
  const [order] = await query<any>(
    `SELECT o.*, (SELECT provider FROM payments WHERE order_id = o.id ORDER BY created_at DESC LIMIT 1) AS provider,
            (SELECT status FROM payments WHERE order_id = o.id ORDER BY created_at DESC LIMIT 1) AS payment_status
       FROM orders o WHERE o.id = $1`, [orderId]);
  if (!order) return null;
  const [items, history] = await Promise.all([
    query<any>(`SELECT product_id, product_name, sku, unit_price_kobo, quantity, line_total_kobo FROM order_items WHERE order_id = $1`, [orderId]),
    query<any>(`SELECT status, note, created_at FROM order_status_history WHERE order_id = $1 ORDER BY created_at, id`, [orderId]),
  ]);
  return {
    id: order.id as string, orderNumber: order.order_number as string, status: order.status as string,
    paymentStatus: (order.payment_status ?? "pending") as string, provider: order.provider as string | null,
    createdAt: order.created_at as string, customerName: order.customer_name as string,
    customerEmail: order.customer_email as string, customerPhone: order.customer_phone as string,
    address: { state: order.ship_state, city: order.ship_city, street: order.ship_street, info: order.ship_info },
    subtotalKobo: Number(order.subtotal_kobo), deliveryKobo: Number(order.delivery_fee_kobo),
    discountKobo: Number(order.discount_kobo), totalKobo: Number(order.total_kobo), discountCode: order.discount_code as string | null,
    items: items.map((i: any) => ({
      productId: i.product_id, name: i.product_name, sku: i.sku, unitKobo: Number(i.unit_price_kobo),
      quantity: i.quantity, lineKobo: Number(i.line_total_kobo),
    })),
    history: history.map((h: any) => ({ status: h.status as string, note: h.note as string | null, at: h.created_at as string })),
  };
}
export type OrderDetail = NonNullable<Awaited<ReturnType<typeof loadOrderDetail>>>;
