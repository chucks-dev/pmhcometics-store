"use client";
import { useCallback, useEffect, useState } from "react";
import { Alert, EmptyState, Modal, Skeleton, useToast } from "@/components/ui/feedback";
import { Button, Checkbox, Input, Select } from "@/components/ui/forms";
import { api, ApiError } from "@/lib/api";
import { NIGERIAN_STATES } from "@/lib/constants";

interface Addr { id: string; label: string | null; fullName: string; phone: string; state: string; city: string; street: string; additionalInfo: string | null; isDefault: boolean }
const BLANK = { label: "", fullName: "", phone: "", state: "Lagos", city: "", street: "", additionalInfo: "", isDefault: false };

export function AddressManager() {
  const toast = useToast();
  const [list, setList] = useState<Addr[] | null>(null);
  const [editing, setEditing] = useState<{ id?: string; v: typeof BLANK } | null>(null);
  const [err, setErr] = useState<ApiError | null>(null); const [busy, setBusy] = useState(false);
  const load = useCallback(() => api<{ addresses: Addr[] }>("/api/account/addresses").then((r) => setList(r.addresses)), []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!editing) return; setBusy(true); setErr(null);
    try {
      const body = { ...editing.v, label: editing.v.label || null, additionalInfo: editing.v.additionalInfo || null };
      if (editing.id) await api(`/api/account/addresses/${editing.id}`, { method: "PATCH", body }); else await api("/api/account/addresses", { body });
      setEditing(null); toast("Address saved"); load();
    } catch (e) { setErr(e as ApiError); }
    setBusy(false);
  };
  const set = (k: keyof typeof BLANK) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setEditing((x) => x && { ...x, v: { ...x.v, [k]: e.target.value } });
  const fe = (k: string) => err?.fields?.[k]?.[0];

  if (!list) return <Skeleton className="h-32 w-full" />;
  return (
    <>
      {!list.length ? <EmptyState title="No saved addresses" text="Save one now to speed up checkout." /> : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {list.map((a) => (
            <li key={a.id} className="card p-5">
              <div className="flex items-center gap-2"><p className="font-semibold">{a.label || a.fullName}</p>{a.isDefault && <span className="badge bg-brand-50 text-brand-700">Default</span>}</div>
              <p className="mt-2 text-muted">{a.fullName}<br />{a.street}, {a.city}, {a.state}<br />{a.phone}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing({ id: a.id, v: { ...BLANK, ...a, label: a.label ?? "", additionalInfo: a.additionalInfo ?? "" } })}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={async () => { await api(`/api/account/addresses/${a.id}`, { method: "DELETE" }); toast("Address removed"); load(); }}>Remove</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Button className="mt-6" onClick={() => { setErr(null); setEditing({ v: BLANK }); }}>Add address</Button>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit address" : "New address"} sheet>
        {editing && (
          <div className="space-y-4">
            <Input label="Label (optional)" placeholder="Home, Work…" value={editing.v.label} onChange={set("label")} />
            <Input label="Full name" value={editing.v.fullName} onChange={set("fullName")} error={fe("fullName")} />
            <Input label="Phone number" type="tel" value={editing.v.phone} onChange={set("phone")} error={fe("phone")} />
            <Select label="State" value={editing.v.state} onChange={set("state")}>{NIGERIAN_STATES.map((s) => <option key={s}>{s}</option>)}</Select>
            <Input label="City / town" value={editing.v.city} onChange={set("city")} error={fe("city")} />
            <Input label="Street address" value={editing.v.street} onChange={set("street")} error={fe("street")} />
            <Input label="Additional info (optional)" value={editing.v.additionalInfo} onChange={set("additionalInfo")} />
            <Checkbox label="Make this my default address" checked={editing.v.isDefault} onChange={(e) => setEditing({ ...editing, v: { ...editing.v, isDefault: e.target.checked } })} />
            {err && !err.fields && <Alert>{err.message}</Alert>}
            <Button className="w-full" loading={busy} onClick={save}>Save address</Button>
          </div>
        )}
      </Modal>
    </>
  );
}
