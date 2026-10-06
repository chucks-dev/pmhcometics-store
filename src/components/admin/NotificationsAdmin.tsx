"use client";
import { useState } from "react";
import { EmptyState, useToast } from "@/components/ui/feedback";
import { Button, Input, Textarea } from "@/components/ui/forms";
import { api, ApiError } from "@/lib/api";
import { Loadable, PageHeader, Panel, useApi } from "./kit";

export function NotificationsAdmin({ canSend }: { canSend: boolean }) {
  const toast = useToast();
  const { data, loading, error, reload } = useApi<{ items: any[]; unread: number }>("/api/admin/notifications");
  const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [busy, setBusy] = useState(false);
  return (
    <>
      <PageHeader title="Notifications" action={data && data.unread > 0 ? <Button size="sm" variant="outline" onClick={async () => { await api("/api/admin/notifications", { method: "PATCH", body: {} }); reload(); }}>Mark all as read</Button> : undefined} />
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Loadable loading={loading} error={error} reload={reload}>
          {data?.items.length ? <ul className="space-y-3">{data.items.map((n) => (
            <li key={n.id} className={`card p-4 ${n.readAt ? "" : "border-brand-300 bg-brand-50/40"}`}>
              <p className="font-medium">{n.title}</p>{n.body && <p className="text-muted">{n.body}</p>}
              <p className="mt-1 text-xs text-muted">{new Date(n.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</p>
            </li>))}</ul> : <EmptyState title="Nothing new" text="New orders, reviews and messages show up here." />}
        </Loadable>
        {canSend && (
          <Panel title="Send an announcement" className="h-fit">
            <form className="space-y-4" onSubmit={async (e) => {
              e.preventDefault(); if (!confirm("Send this to every active customer's notification inbox?")) return; setBusy(true);
              try { const r = await api<{ sent: number }>("/api/admin/notifications", { body: { title, body: body || undefined } }); toast(`Sent to ${r.sent} customers`); setTitle(""); setBody(""); }
              catch (x) { toast(x instanceof ApiError ? x.message : "Failed", "error"); }
              setBusy(false);
            }}>
              <Input label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} />
              <Textarea label="Message" value={body} onChange={(e) => setBody(e.target.value)} />
              <Button className="w-full" loading={busy}>Send to all customers</Button>
            </form>
          </Panel>
        )}
      </div>
    </>
  );
}
