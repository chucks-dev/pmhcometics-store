import { redirect } from "next/navigation";
import { requireAdmin } from "../auth/guards";
import type { Permission } from "../auth/rbac";
import { HttpError } from "../http";

/** Server-side gate for admin pages. Unauthenticated -> /login. Authenticated but not allowed -> dashboard. */
export async function guardPage(permission?: Permission) {
  let failure: "login" | "forbidden" | null = null;
  try {
    return await requireAdmin(permission);
  } catch (e) {
    failure = e instanceof HttpError && e.status === 403 ? "forbidden" : "login";
  }
  redirect(failure === "forbidden" ? "/" : "/login");
}
