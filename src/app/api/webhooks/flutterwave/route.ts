import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { query } from "@/server/db/client";
import { env } from "@/server/env";
import { HttpError } from "@/server/http";
import { processPayment } from "@/server/payments/confirm";

const safeEq = (x: string, y: string) => {
  const a = Buffer.from(x), b = Buffer.from(y);
  return a.length === b.length && timingSafeEqual(a, b);
};

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const secret = env.flutterwaveHash;
  const sigNew = req.headers.get("flutterwave-signature");   // HMAC-SHA256(raw body), base64
  const sigOld = req.headers.get("verif-hash");              // legacy: plain secret hash
  const valid =
    (sigNew && safeEq(createHmac("sha256", secret).update(raw).digest("base64"), sigNew)) ||
    (sigOld && safeEq(secret, sigOld));
  if (!valid) return new NextResponse(null, { status: 401 });

  let event: any;
  try { event = JSON.parse(raw); } catch { return new NextResponse(null, { status: 400 }); }
  const data = event?.data;
  const reference: string | undefined = data?.tx_ref ?? data?.reference;
  if (!reference || !String(event.event ?? event.type ?? "").startsWith("charge")) return NextResponse.json({ ok: true });

  const eventId = `${event.event ?? event.type}:${data.id ?? reference}`;
  const [row] = await query<{ processed_at: string | null }>(
    `INSERT INTO webhook_events (provider, event_id, payload) VALUES ('flutterwave', $1, $2)
     ON CONFLICT (provider, event_id) DO UPDATE SET payload = EXCLUDED.payload RETURNING processed_at`, [eventId, raw]);
  if (row.processed_at) return NextResponse.json({ ok: true });

  try {
    await processPayment("flutterwave", reference);
    await query(`UPDATE webhook_events SET processed_at = now() WHERE provider = 'flutterwave' AND event_id = $1`, [eventId]);
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) return NextResponse.json({ ok: true }); // not our reference
    console.error("flutterwave webhook error", e);
    return new NextResponse(null, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
