import { EmptyState } from "@/components/ui/feedback";
import { MarkReadButton } from "@/components/store/MarkReadButton";
import { requireUser } from "@/server/auth/guards";
import { query } from "@/server/db/client";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser();
  const rows = await query<any>(`SELECT id, title, body, read_at, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`, [user.id]);
  return (
    <>
      <div className="mb-6 flex items-center justify-between"><h1 className="text-3xl">Notifications</h1>{rows.some((r) => !r.read_at) && <MarkReadButton />}</div>
      {!rows.length ? <EmptyState title="All quiet" text="Order updates and announcements will appear here." /> : (
        <ul className="space-y-3">
          {rows.map((n) => (
            <li key={n.id} className={`card p-5 ${n.read_at ? "" : "border-brand-300 bg-brand-50/40"}`}>
              <p className="font-semibold">{n.title}</p>{n.body && <p className="text-muted">{n.body}</p>}
              <p className="mt-1 text-xs text-muted">{new Date(n.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
