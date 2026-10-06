import Link from "next/link";
import { ACCOUNT_LINKS } from "@/components/store/account-links";
import { StatusBadge } from "@/components/ui/display";
import { requireUser } from "@/server/auth/guards";
import { query } from "@/server/db/client";
import { formatNaira } from "@/lib/money";

export const metadata = { title: "My account" };

export default async function AccountHome() {
  const user = await requireUser();
  const [recent] = await query<any>(`SELECT order_number, status, total_kobo, created_at FROM orders WHERE user_id = $1 AND status <> 'pending_payment' ORDER BY created_at DESC LIMIT 1`, [user.id]);
  return (
    <>
      <h1 className="text-3xl sm:text-4xl">My account</h1>
      <p className="mt-1 text-muted">{user.email}</p>
      {recent && (
        <Link href="/account/orders" className="card mt-6 flex items-center justify-between gap-4 p-5 hover:shadow-lift">
          <div><p className="text-sm text-muted">Latest order</p><p className="font-semibold">#{recent.order_number} · {formatNaira(recent.total_kobo)}</p></div>
          <StatusBadge status={recent.status} />
        </Link>
      )}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {ACCOUNT_LINKS.filter(([h]) => h !== "/account").map(([h, l]) => (
          <Link key={h} href={h} className="card flex min-h-[64px] items-center px-5 font-medium hover:border-brand-300">{l}</Link>
        ))}
      </div>
    </>
  );
}
