import { NextResponse, type NextRequest } from "next/server";

/**
 * Host-based separation:
 *   yourdomain.com        -> customer storefront (admin paths 404)
 *   admin.yourdomain.com  -> /admin/* pages + /api/admin/* only (customer APIs 404)
 * This only routes. It is NOT authorization: every admin page/API calls requireAdmin() server-side.
 */
export function middleware(req: NextRequest) {
  const adminHost = new URL(process.env.ADMIN_URL ?? "http://admin.localhost").host;
  const isAdminHost = req.headers.get("host") === adminHost;
  const { pathname } = req.nextUrl;
  const adminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const adminApi = pathname.startsWith("/api/admin/");

  if (isAdminHost) {
    if (adminApi) return NextResponse.next();
    if (pathname.startsWith("/api/")) return new NextResponse(null, { status: 404 });
    if (adminPath) return NextResponse.next();
    return NextResponse.rewrite(new URL(`/admin${pathname === "/" ? "" : pathname}`, req.url));
  }

  if (adminPath || adminApi) return new NextResponse(null, { status: 404 });
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
