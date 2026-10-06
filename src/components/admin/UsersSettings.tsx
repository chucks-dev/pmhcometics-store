"use client";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/ui/display";
import { Alert, Modal, Skeleton, useToast } from "@/components/ui/feedback";
import { Button, Input, PasswordInput, Select } from "@/components/ui/forms";
import { api, ApiError } from "@/lib/api";
import { koboToNaira, nairaToKobo } from "@/lib/money";
import { Loadable, PageHeader, Panel, Table, useApi } from "./kit";

const ROLES = [["super_admin", "Super Admin"], ["product_manager", "Product Manager"], ["order_manager", "Order Manager"], ["support_admin", "Support Admin"]];

export function UsersAdmin() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi<{ items: any[] }>("/api/admin/users");
  const [create, setCreate] = useState(false); const [f, setF] = useState({ fullName: "", email: "", password: "", role: "support_admin" });
  const [edit, setEdit] = useState<any>(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState<ApiError | null>(null); const [uri, setUri] = useState("");
  const secret = uri ? new URL(uri).searchParams.get("secret") : "";
  return (
    <>
      <PageHeader title="Admin users" subtitle="Super Admins have full access. Others only see what their role needs." action={<Button size="sm" onClick={() => { setErr(null); setUri(""); setCreate(true); }}>Add admin</Button>} />
      <Panel><Loadable loading={loading} error={error} reload={reload}>
        <Table rows={data?.items ?? []} columns={[
          { header: "Admin", cell: (a) => <div><p className="font-medium">{a.fullName}</p><p className="text-xs text-muted">{a.email}</p></div> },
          { header: "Role", cell: (a) => <span className="capitalize">{a.role.replace("_", " ")}</span> }, { header: "Status", cell: (a) => <StatusBadge status={a.status} /> },
          { header: "Last login", cell: (a) => a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : "Never" },
          { header: "", className: "text-right", cell: (a) => <Button size="sm" variant="ghost" onClick={() => setEdit({ id: a.id, role: a.role, status: a.status, name: a.fullName })}>Edit</Button> },
        ]} />
      </Loadable></Panel>

      <Modal open={create} onClose={() => { setCreate(false); setUri(""); reload(); }} title={uri ? "Set up two-factor" : "New admin"}>
        {uri ? (
          <div className="space-y-4">
            <Alert kind="success">Admin created. Share these 2FA details privately. They are shown only once.</Alert>
            <p className="text-sm text-muted">In an authenticator app (Google Authenticator, 1Password, Authy), add an account by entering this key manually:</p>
            <p className="break-all rounded-2xl bg-blush p-4 font-mono text-sm">{secret}</p>
            <p className="text-xs text-muted">Or paste this link into a QR generator you trust:</p>
            <p className="break-all rounded-2xl bg-blush p-3 font-mono text-xs">{uri}</p>
            <Button className="w-full" onClick={() => { navigator.clipboard?.writeText(secret ?? ""); toast("Key copied"); }}>Copy key</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Input label="Full name" value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} error={err?.fields?.fullName?.[0]} />
            <Input label="Email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} error={err?.fields?.email?.[0]} />
            <PasswordInput label="Temporary password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} error={err?.fields?.password?.[0]} hint="12+ characters with upper, lower, number and symbol." />
            <Select label="Role" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
            {err && !err.fields && <Alert>{err.message}</Alert>}
            <Button className="w-full" loading={busy} onClick={async () => {
              setBusy(true); setErr(null);
              try { const r = await api<{ otpauthUri: string }>("/api/admin/users", { body: f }); setUri(r.otpauthUri); setF({ fullName: "", email: "", password: "", role: "support_admin" }); } catch (e) { setErr(e as ApiError); }
              setBusy(false);
            }}>Create admin</Button>
          </div>
        )}
      </Modal>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit ? `Edit ${edit.name}` : ""}>
        {edit && <div className="space-y-4">
          <Select label="Role" value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value })}>{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
          <Select label="Status" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}><option value="active">Active</option><option value="suspended">Suspended</option></Select>
          <p className="text-xs text-muted">Saving signs this admin out of all devices.</p>
          <Button className="w-full" onClick={async () => { try { await api(`/api/admin/users/${edit.id}`, { method: "PATCH", body: { role: edit.role, status: edit.status } }); toast("Admin updated"); setEdit(null); reload(); } catch (e) { toast(e instanceof ApiError ? e.message : "Failed", "error"); } }}>Save</Button>
        </div>}
      </Modal>
    </>
  );
}

export function SettingsAdmin({ canAudit }: { canAudit: boolean }) {
  const toast = useToast();
  const [s, setS] = useState<any>(null); const [busy, setBusy] = useState(false);
  const audit = useApi<{ items: any[] }>(canAudit ? "/api/admin/audit?pageSize=30" : null);
  useEffect(() => { api<any>("/api/admin/settings").then((r) => setS({ lagos: String(koboToNaira(r.delivery.lagosKobo)), other: String(koboToNaira(r.delivery.otherKobo)), free: String(koboToNaira(r.delivery.freeOverKobo)), ...r.store })); }, []);
  if (!s) return <Skeleton className="h-64 w-full" />;
  return (
    <>
      <PageHeader title="Settings" action={<Button loading={busy} onClick={async () => {
        setBusy(true);
        try { await api("/api/admin/settings", { method: "PUT", body: { delivery: { lagosKobo: nairaToKobo(s.lagos), otherKobo: nairaToKobo(s.other), freeOverKobo: nairaToKobo(s.free) }, store: { name: s.name, supportEmail: s.supportEmail, supportPhone: s.supportPhone } } }); toast("Settings saved"); }
        catch (e) { toast(e instanceof ApiError ? e.message : "Failed", "error"); }
        setBusy(false);
      }}>Save settings</Button>} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Delivery fees (₦)"><div className="space-y-4">
          <Input label="Lagos" inputMode="decimal" value={s.lagos} onChange={(e) => setS({ ...s, lagos: e.target.value })} />
          <Input label="All other states" inputMode="decimal" value={s.other} onChange={(e) => setS({ ...s, other: e.target.value })} />
          <Input label="Free delivery over" inputMode="decimal" value={s.free} onChange={(e) => setS({ ...s, free: e.target.value })} hint="Set to 0 to turn free delivery off." />
        </div></Panel>
        <Panel title="Store details"><div className="space-y-4">
          <Input label="Store name" value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} />
          <Input label="Support email" type="email" value={s.supportEmail} onChange={(e) => setS({ ...s, supportEmail: e.target.value })} />
          <Input label="Support phone" value={s.supportPhone} onChange={(e) => setS({ ...s, supportPhone: e.target.value })} />
        </div></Panel>
      </div>
      {canAudit && (
        <Panel title="Audit log" className="mt-4">
          <Table rows={(audit.data?.items ?? []).map((a) => ({ ...a, id: String(a.id) }))} empty="No activity yet." columns={[
            { header: "When", cell: (a: any) => new Date(a.createdAt).toLocaleString("en-NG", { dateStyle: "short", timeStyle: "short" }) },
            { header: "Who", cell: (a: any) => a.actorEmail ?? a.actorType }, { header: "Action", cell: (a: any) => <span className="font-mono text-xs">{a.action}</span> },
            { header: "IP", cell: (a: any) => a.ip ?? "n/a" },
          ]} />
        </Panel>
      )}
    </>
  );
}
