/**
 * Routing:
 * - Storefront: /, /shop, /category/*, etc.
 * - Admin: /admin/* and /api/admin/*
 *
 * Authorization is enforced server-side by requireAdmin().
 */
export function middleware() {
  // Allow all routes through.
  // Authentication and authorization are handled by the application.
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
