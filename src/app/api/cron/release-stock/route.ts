import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/server/env";
import { releaseExpiredOrders } from "@/server/payments/confirm";

/** Call every ~10 minutes with header `Authorization: Bearer $CRON_SECRET`. */
export async function POST(req: NextRequest) {
  if (!env.cronSecret || req.headers.get("authorization") !== `Bearer ${env.cronSecret}`) {
    return new NextResponse(null, { status: 401 });
  }
  return NextResponse.json({ released: await releaseExpiredOrders(30) });
}
