import { z } from "zod";
import { getCurrentUser } from "@/server/auth/guards";
import { loadCartItems, resolveCart } from "@/server/cart";
import { query, tx } from "@/server/db/client";
import { env } from "@/server/env";
import { getIp, HttpError, ok, parseJson, route } from "@/server/http";
import { addStatusHistory, releaseStock, trackingToken } from "@/server/orders";
import { initializePayment } from "@/server/payments/providers";
import { deliveryFee, evaluateDiscount } from "@/server/pricing";
import { randomToken } from "@/server/security/crypto";
import { rateLimit } from "@/server/security/rate-limit";
import { NIGERIAN_STATES } from "@/lib/constants";
import { email, nigerianPhone } from "@/lib/validation/auth";

const schema = z.object({
  customer: z.object({ fullName: z.string().trim().min(2).max(100), email, phone: nigerianPhone }),
  delivery: z.object({
    state: z.enum(NIGERIAN_STATES), city: z.string().trim().min(2).max(80),
    street: z.string().trim().min(5).max(200), info: z.string().trim().max(300).optional().nullable(),
  }),
  provider: z.enum(["paystack", "flutterwave"]),
  discountCode: z.string().trim().max(40).optional().nullable(),
  saveAddress: z.boolean().optional(),
});

export const POST = route(async (req) => {
  await rateLimit(`checkout:ip:${getIp(req)}`, 30, 3600);
  const input = await parseJson(req, schema);
  const user = await getCurrentUser();

  const cartId = await resolveCart(false);
  const cartItems = cartId ? await loadCartItems(cartId) : [];
  if (!cartItems.length) throw new HttpError(400, "Your cart is empty.", "EMPTY_CART");

  // A new attempt supersedes this customer's earlier unpaid orders, so stock isn't held twice.
  await tx(async (c) => {
    const { rows } = await c.query<{ id: string }>(
      `SELECT id FROM orders WHERE status = 'pending_payment' AND (customer_email = $1 OR user_id = $2) FOR UPDATE`,
      [input.customer.email, user?.id ?? null]);
    for (const { id } of rows) {
      await c.query(`UPDATE orders SET status = 'cancelled' WHERE id = $1`, [id]);
      await c.query(`UPDATE payments SET status = 'failed' WHERE order_id = $1 AND status = 'pending'`, [id]);
      await releaseStock(c, id);
      await addStatusHistory(c, id, "cancelled", "Replaced by a newer checkout");
    }
  });

  const created = await tx(async (c) => {
    const ids = cartItems.map((i) => i.productId).sort();
    const { rows: products } = await c.query(
      `SELECT id, name, sku, price_kobo, discount_price_kobo, stock, status, deleted_at
         FROM products WHERE id = ANY($1::uuid[]) ORDER BY id FOR UPDATE`, [ids]);
    const byId = new Map(products.map((p: any) => [p.id, p]));

    const lines = cartItems.map((ci) => {
      const p: any = byId.get(ci.productId);
      if (!p || p.status !== "published" || p.deleted_at) throw new HttpError(409, `"${ci.name}" is no longer available.`, "UNAVAILABLE");
      if (p.stock < ci.quantity) {
        throw new HttpError(409, p.stock > 0 ? `Only ${p.stock} of "${p.name}" left. Update your cart.` : `"${p.name}" is out of stock.`, "OUT_OF_STOCK");
      }
      const unit = Number(p.discount_price_kobo ?? p.price_kobo);
      return { productId: p.id as string, name: p.name as string, sku: p.sku as string, unit, qty: ci.quantity };
    });

    const subtotal = lines.reduce((s, l) => s + l.unit * l.qty, 0);
    let discount = 0; let discountId: string | null = null; let discountCode: string | null = null;
    if (input.discountCode) {
      const d = await evaluateDiscount(input.discountCode, subtotal, c);
      if (!d.ok) throw new HttpError(400, d.reason, "BAD_DISCOUNT");
      discount = d.amountKobo; discountId = d.id; discountCode = d.code;
    }
    const delivery = await deliveryFee(input.delivery.state, subtotal - discount);
    const total = subtotal - discount + delivery;
    if (total <= 0) throw new HttpError(400, "Order total must be greater than zero.");

    for (const l of lines) await c.query(`UPDATE products SET stock = stock - $2 WHERE id = $1`, [l.productId, l.qty]);

    const { rows: [order] } = await c.query(
      `INSERT INTO orders (user_id, cart_id, customer_name, customer_email, customer_phone,
                           ship_state, ship_city, ship_street, ship_info,
                           subtotal_kobo, delivery_fee_kobo, discount_kobo, total_kobo, discount_id, discount_code)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id, order_number`,
      [user?.id ?? null, cartId, input.customer.fullName, input.customer.email, input.customer.phone,
       input.delivery.state, input.delivery.city, input.delivery.street, input.delivery.info ?? null,
       subtotal, delivery, discount, total, discountId, discountCode]);

    for (const l of lines) {
      await c.query(
        `INSERT INTO order_items (order_id, product_id, product_name, sku, unit_price_kobo, quantity, line_total_kobo)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`, [order.id, l.productId, l.name, l.sku, l.unit, l.qty, l.unit * l.qty]);
    }
    await addStatusHistory(c, order.id, "pending_payment");

    const reference = `${order.order_number}-${randomToken(6).replace(/[^a-zA-Z0-9]/g, "x")}`;
    await c.query(
      `INSERT INTO payments (order_id, provider, reference, amount_kobo, currency) VALUES ($1,$2,$3,$4,'NGN')`,
      [order.id, input.provider, reference, total]);

    return { orderId: order.id as string, orderNumber: order.order_number as string, reference, total };
  });

  const callbackUrl = `${env.appUrl}/payment/callback?provider=${input.provider}&order=${created.orderNumber}&t=${trackingToken(created.orderId)}`;
  let paymentUrl: string;
  try {
    paymentUrl = await initializePayment(input.provider, {
      reference: created.reference, amountKobo: created.total, email: input.customer.email,
      name: input.customer.fullName, phone: input.customer.phone, callbackUrl,
    });
  } catch (e) {
    console.error("Payment init failed", e);
    await tx(async (c) => {
      await c.query(`UPDATE orders SET status = 'cancelled' WHERE id = $1`, [created.orderId]);
      await c.query(`UPDATE payments SET status = 'failed' WHERE order_id = $1`, [created.orderId]);
      await releaseStock(c, created.orderId);
      await addStatusHistory(c, created.orderId, "cancelled", "Could not start payment");
    });
    throw new HttpError(502, "We couldn't start your payment. Please try again or choose another provider.", "PAYMENT_INIT_FAILED");
  }

  if (user && input.saveAddress) {
    const [{ n }] = await query<{ n: string }>(`SELECT COUNT(*) AS n FROM addresses WHERE user_id = $1`, [user.id]);
    await query(
      `INSERT INTO addresses (user_id, full_name, phone, state, city, street, additional_info, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [user.id, input.customer.fullName, input.customer.phone, input.delivery.state, input.delivery.city,
       input.delivery.street, input.delivery.info ?? null, n === "0"]);
  }
  return ok({ paymentUrl, orderNumber: created.orderNumber });
});
