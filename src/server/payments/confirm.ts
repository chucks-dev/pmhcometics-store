import { query, tx } from "../db/client";
import { HttpError } from "../http";
import { addStatusHistory, notifyAdmins, orderLink, releaseStock } from "../orders";
import { sendOrderConfirmationEmail } from "../email/send";
import { audit } from "../security/audit";
import { verifyWithProvider, type Provider } from "./providers";

export interface ProcessResult {
  state: "success" | "failed" | "pending";
  orderNumber: string;
  fulfilled?: boolean;
}

/**
 * The ONLY place an order becomes paid. Called after the gateway API itself has confirmed the transaction,
 * from either the return-page verification or the webhook. Idempotent: safe to call many times.
 */
export async function processPayment(provider: Provider, reference: string): Promise<ProcessResult> {
  const [pay] = await query<{ order_id: string }>(`SELECT order_id FROM payments WHERE provider = $1 AND reference = $2`, [provider, reference]);
  if (!pay) throw new HttpError(404, "Payment not found.");
  const [ord] = await query<{ order_number: string }>(`SELECT order_number FROM orders WHERE id = $1`, [pay.order_id]);

  const v = await verifyWithProvider(provider, reference);
  if (v.state === "pending") return { state: "pending", orderNumber: ord.order_number };

  if (v.state === "failed") {
    await tx(async (c) => {
      const { rows: [p] } = await c.query(`SELECT status FROM payments WHERE provider = $1 AND reference = $2 FOR UPDATE`, [provider, reference]);
      if (p.status !== "pending") return;
      await c.query(`UPDATE payments SET status = 'failed', gateway_response = $3 WHERE provider = $1 AND reference = $2`, [provider, reference, JSON.stringify(v.raw)]);
      const { rows: [o] } = await c.query(`SELECT status FROM orders WHERE id = $1 FOR UPDATE`, [pay.order_id]);
      if (o.status === "pending_payment") {
        await c.query(`UPDATE orders SET status = 'cancelled' WHERE id = $1`, [pay.order_id]);
        await releaseStock(c, pay.order_id);
        await addStatusHistory(c, pay.order_id, "cancelled", "Payment failed");
      }
    });
    return { state: "failed", orderNumber: ord.order_number };
  }

  // ───── success ─────
  let firstConfirmation = false as boolean;
  let fulfilled = true;
  let mail = null as { email: string; name: string; total: number; id: string } | null;

  const mismatch = await tx(async (c) => {
    const { rows: [p] } = await c.query(
      `SELECT id, status, amount_kobo, currency FROM payments WHERE provider = $1 AND reference = $2 FOR UPDATE`, [provider, reference]);
    if (p.status === "successful") return false; // already processed
    if (Number(p.amount_kobo) !== v.amountKobo || p.currency !== v.currency) {
      await c.query(`UPDATE payments SET status = 'failed', gateway_response = $2 WHERE id = $1`, [p.id, JSON.stringify({ reason: "amount_mismatch", gateway: v.raw })]);
      await notifyAdmins(c, ["super_admin", "order_manager"], "payment_mismatch", "Payment amount mismatch", `Order ${ord.order_number}: gateway amount did not match. Review manually.`);
      return true;
    }

    const { rows: [o] } = await c.query(
      `SELECT id, order_number, status, user_id, cart_id, discount_id, customer_name, customer_email, total_kobo FROM orders WHERE id = $1 FOR UPDATE`, [pay.order_id]);

    await c.query(`UPDATE payments SET status = 'successful', provider_transaction_id = $2, paid_at = now(), gateway_response = $3 WHERE id = $1`,
      [p.id, v.providerTxId, JSON.stringify(v.raw)]);

    if (o.status === "cancelled") {
      // Customer paid after we released their stock (e.g. started a second checkout). Try to re-reserve.
      await c.query("SAVEPOINT reserve");
      const { rows: items } = await c.query(`SELECT product_id, quantity FROM order_items WHERE order_id = $1`, [o.id]);
      let okAll = true;
      for (const it of items) {
        const r = await c.query(`UPDATE products SET stock = stock - $2 WHERE id = $1 AND stock >= $2`, [it.product_id, it.quantity]);
        if (!r.rowCount) { okAll = false; break; }
      }
      if (!okAll) {
        await c.query("ROLLBACK TO SAVEPOINT reserve");
        fulfilled = false;
        await notifyAdmins(c, ["super_admin", "order_manager"], "refund_needed", "Paid order needs refund",
          `Order ${o.order_number} was paid after cancellation and stock is no longer available. Refund the customer.`);
        return false;
      }
    }

    firstConfirmation = true;
    await c.query(`UPDATE orders SET status = 'payment_confirmed' WHERE id = $1`, [o.id]);
    await addStatusHistory(c, o.id, "confirmed");
    await addStatusHistory(c, o.id, "payment_confirmed");
    if (o.discount_id) await c.query(`UPDATE discounts SET used_count = used_count + 1 WHERE id = $1`, [o.discount_id]);
    if (o.cart_id) await c.query(`DELETE FROM cart_items WHERE cart_id = $1`, [o.cart_id]);

    if (o.user_id) {
      await c.query(`INSERT INTO notifications (user_id, type, title, body) VALUES ($1,'order',$2,$3)`,
        [o.user_id, "Payment successful", `Order ${o.order_number} is confirmed.`]);
    }
    await notifyAdmins(c, ["super_admin", "order_manager"], "new_order", "New paid order",
      `Order ${o.order_number} · ₦${(Number(o.total_kobo) / 100).toLocaleString("en-NG")}`);
    mail = { email: o.customer_email, name: o.customer_name, total: Number(o.total_kobo), id: o.id };
    return false;
  });

  if (mismatch) return { state: "failed", orderNumber: ord.order_number };
  if (firstConfirmation && mail) {
    const m = mail as { email: string; name: string; total: number; id: string };
    await audit({ actorType: "system", action: "payment.confirmed", entityType: "order", entityId: m.id, metadata: { provider, reference } });
    sendOrderConfirmationEmail(m.email, m.name, ord.order_number, m.total, orderLink(ord.order_number, m.id)).catch(console.error);
  }
  return { state: "success", orderNumber: ord.order_number, fulfilled };
}

/** Cancels unpaid orders older than `minutes` and returns their stock. Run from a scheduler. */
export async function releaseExpiredOrders(minutes = 30): Promise<number> {
  return tx(async (c) => {
    const { rows } = await c.query<{ id: string }>(
      `SELECT id FROM orders WHERE status = 'pending_payment' AND created_at < now() - make_interval(mins => $1) FOR UPDATE SKIP LOCKED`, [minutes]);
    for (const { id } of rows) {
      await c.query(`UPDATE orders SET status = 'cancelled' WHERE id = $1`, [id]);
      await c.query(`UPDATE payments SET status = 'failed' WHERE order_id = $1 AND status = 'pending'`, [id]);
      await releaseStock(c, id);
      await addStatusHistory(c, id, "cancelled", "Payment not completed in time");
    }
    return rows.length;
  });
}
