import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { query } from "@/server/db/client";
import { env } from "@/server/env";
import { processPayment } from "@/server/payments/confirm";

export async function POST(req: NextRequest) {
  const raw = await req.text(); // signature is over the exact raw bytes
  const sig = req.headers.get("x-paystack-signature") ?? "";
  const expected = createHmac("sha512", env.paystackSecret).update(raw).digest("hex");
  const a = Buffer.from(expected), b = Buffer.from(sig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return new NextResponse(null, { status: 401 });

  let event: any;
  try { event = JSON.parse(raw); } catch { return new NextResponse(null, { status: 400 }); }
  const reference: string | undefined = event?.data?.reference;
  if (!reference || !["charge.success", "charge.failed"].includes(event.event)) return NextResponse.json({ ok: true });

  const [row] = await query<{ processed_at: string | null }>(
    `INSERT INTO webhook_events (provider, event_id, payload) VALUES ('paystack', $1, $2)
     ON CONFLICT (provider, event_id) DO UPDATE SET payload = EXCLUDED.payload RETURNING processed_at`,
    [`${event.event}:${event.data.id ?? reference}`, raw]);
  if (row.processed_at) return NextResponse.json({ ok: true });

  try {
    await processPayment("paystack", reference); // re-verifies with Paystack's API before touching the order
    await query(`UPDATE webhook_events SET processed_at = now() WHERE provider = 'paystack' AND event_id = $1`, [`${event.event}:${event.data.id ?? reference}`]);
  } catch (e) {
    console.error("paystack webhook error", e);
    return new NextResponse(null, { status: 500 }); // non-2xx => Paystack retries
  }
  return NextResponse.json({ ok: true });
}
