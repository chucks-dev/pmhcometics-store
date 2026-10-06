import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodType } from "zod";
import { env } from "./env";

export class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

export const ok = (data: unknown, init?: ResponseInit) => NextResponse.json(data, init);

export type IdCtx = { params: Promise<{ id: string }> };

export function getIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/** CSRF defence in depth (on top of SameSite cookies): mutations must come from our own origins. */
function assertSameOrigin(req: NextRequest) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return;
  const origin = req.headers.get("origin");
  if (!origin || ![env.appUrl, env.adminUrl].includes(origin)) {
    throw new HttpError(403, "Invalid request origin", "BAD_ORIGIN");
  }
}

export async function parseJson<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
  return schema.parse(body);
}

/** Wrap every route handler: origin check + uniform error responses (no stack traces leak). */
export function route<C = { params: Promise<any> }>(handler: (req: NextRequest, ctx: C) => Promise<Response>) {
  return async (req: NextRequest, ctx: C): Promise<Response> => {
    try {
      assertSameOrigin(req);
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof ZodError) {
        return NextResponse.json(
          { error: "Please check the highlighted fields.", code: "VALIDATION", fields: e.flatten().fieldErrors },
          { status: 400 },
        );
      }
      if (e instanceof HttpError) {
        return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
      }
      console.error("Unhandled route error:", e);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  };
}
