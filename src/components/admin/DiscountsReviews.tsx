"use client";
import { useState } from "react";
import { Rating, StatusBadge } from "@/components/ui/display";
import { Alert, Modal, useToast } from "@/components/ui/feedback";
import { Button, Checkbox, Input, Select } from "@/components/ui/forms";
import { api, ApiError, cn } from "@/lib/api";
import { formatNaira } from "@/lib/money";
import { Loadable, PageHeader, Pager, Panel, Table, useApi } from "./kit";

const BLANK = { code: "", type: "percentage", value: "10", minOrderNaira: "0", maxDiscountNaira: "", startsAt: "", expiresAt: "", usageLimit: "", isActive: true };
const toLocal = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

export function DiscountsAdmin() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi<{ items: any[] }>("/api/admin/discounts");
  const [edit, setEdit] = useState<{ id?: string; v: typeof BLANK } | null>(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState<ApiError | null>(null);
  const set = (k: keyof typeof BLANK) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setEdit((x) => x && { ...x, v: { ...x.v, [k]: e.target.value } });
  const save = async () => {
    if (!edit) return; setBusy(true); setErr(null); const v = edit.v;
    const body = {
      code: v.code, type: v.type, value: Number(v.value), minOrderNaira: Number(v.minOrderNaira) || 0,
      maxDiscountNaira: v.maxDiscountNaira ? Number(v.maxDiscountNaira) : null,
      startsAt: v.startsAt ? new Date(v.startsAt).toISOString() : null, expiresAt: v.expiresAt ? new Date(v.expiresAt).toISOString() : null,
      usageLimit: v.usageLimit ? Number(v.usageLimit) : null, isActive: v.isActive,
    };
    try { if (edit.id) await api(`/api/admin/discounts/${edit.id}`, { method: "PATCH", body }); else await api("/api/admin/discounts", { body }); setEdit(null); toast("Discount saved"); reload(); }
    catch (e) { setErr(e as ApiError); }
    setBusy(false);
  };
  return (
    <>
      <PageHeader title="Discounts" action={<Button size="sm" onClick={() => { setErr(null); setEdit({ v: BLANK }); }}>Create code</Button>} />
      <Panel><Loadable loading={loading} error={error} reload={reload}>
        <Table rows={data?.items ?? []} empty="No discount codes yet." columns={[
          { header: "Code", cell: (d) => <span className="font-mono font-semibold">{d.code}</span> },
          { header: "Discount", cell: (d) => d.type === "percentage" ? `${d.value}% off` : `${formatNaira(d.value)} off` },
          { header: "Min order", cell: (d) => formatNaira(d.minOrderKobo) }, { header: "Max discount", cell: (d) => d.maxDiscountKobo ? formatNaira(d.maxDiscountKobo) : "None" },
          { header: "Expires", cell: (d) => d.expiresAt ? new Date(d.expiresAt).toLocaleDateString("en-NG", { dateStyle: "medium" }) : "Never" },
          { header: "Used", cell: (d) => `${d.usedCount}${d.usageLimit ? ` / ${d.usageLimit}` : ""}` },
          { header: "Status", cell: (d) => <StatusBadge status={d.isActive ? "active" : "hidden"} /> },
          { header: "", className: "text-right whitespace-nowrap", cell: (d) => (
            <div className="flex justify-end gap-1">
              <Button size="sm" variant="ghost" onClick={() => { setErr(null); setEdit({ id: d.id, v: { code: d.code, type: d.type, value: String(d.type === "fixed" ? d.value / 100 : d.value), minOrderNaira: String(d.minOrderKobo / 100), maxDiscountNaira: d.maxDiscountKobo ? String(d.maxDiscountKobo / 100) : "", startsAt: toLocal(d.startsAt), expiresAt: toLocal(d.expiresAt), usageLimit: d.usageLimit ? String(d.usageLimit) : "", isActive: d.isActive } }); }}>Edit</Button>
              <Button size="sm" variant="ghost" onClick={async () => { await api(`/api/admin/discounts/${d.id}`, { method: "PATCH", body: { isActive: !d.isActive } }); reload(); }}>{d.isActive ? "Deactivate" : "Activate"}</Button>
              <Button size="sm" variant="ghost" onClick={async () => { if (confirm(`Delete ${d.code}?`)) { await api(`/api/admin/discounts/${d.id}`, { method: "DELETE" }); toast("Deleted"); reload(); } }}>Delete</Button>
            </div>) },
        ]} />
      </Loadable></Panel>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "Edit discount" : "New discount"}>
        {edit && <div className="space-y-4">
          <Input label="Code" placeholder="BEAUTY10" value={edit.v.code} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, code: e.target.value.toUpperCase() } })} error={err?.fields?.code?.[0]} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Type" value={edit.v.type} onChange={set("type")}><option value="percentage">Percentage</option><option value="fixed">Fixed amount (₦)</option></Select>
            <Input label={edit.v.type === "percentage" ? "Percent off" : "Amount off (₦)"} inputMode="decimal" value={edit.v.value} onChange={set("value")} error={err?.fields?.value?.[0]} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Minimum order (₦)" inputMode="decimal" value={edit.v.minOrderNaira} onChange={set("minOrderNaira")} />
            <Input label="Maximum discount (₦)" inputMode="decimal" value={edit.v.maxDiscountNaira} onChange={set("maxDiscountNaira")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Starts" type="datetime-local" value={edit.v.startsAt} onChange={set("startsAt")} /><Input label="Expires" type="datetime-local" value={edit.v.expiresAt} onChange={set("expiresAt")} />
          </div>
          <Input label="Usage limit (blank = unlimited)" inputMode="numeric" value={edit.v.usageLimit} onChange={set("usageLimit")} />
          <Checkbox label="Active" checked={edit.v.isActive} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, isActive: e.target.checked } })} />
          {err && !err.fields && <Alert>{err.message}</Alert>}<Button className="w-full" loading={busy} onClick={save}>Save discount</Button>
        </div>}
      </Modal>
    </>
  );
}

export function ReviewsAdmin() {
  const toast = useToast();
  const [status, setStatus] = useState("pending"); const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi<{ items: any[]; total: number }>(`/api/admin/reviews?page=${page}&pageSize=15${status ? `&status=${status}` : ""}`);
  const act = async (fn: () => Promise<unknown>, msg: string) => { try { await fn(); toast(msg); reload(); } catch (e) { toast(e instanceof ApiError ? e.message : "Failed", "error"); } };
  return (
    <>
      <PageHeader title="Reviews" subtitle="Only approved reviews appear in the store." />
      <div className="mb-4 flex gap-2">{[["pending", "Pending"], ["approved", "Approved"], ["hidden", "Hidden"], ["", "All"]].map(([v, l]) => <button key={v} onClick={() => { setStatus(v); setPage(1); }} className={cn("rounded-full border px-4 py-2 text-sm font-medium", status === v ? "border-brand-500 bg-brand-500 text-white" : "border-line bg-white")}>{l}</button>)}</div>
      <Loadable loading={loading && !data} error={error} reload={reload}>
        <div className="space-y-3">
          {data?.items.length === 0 && <p className="py-10 text-center text-muted">No reviews here.</p>}
          {data?.items.map((r) => (
            <article key={r.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-3"><Rating value={r.rating} /><StatusBadge status={r.status} /></div><span className="text-xs text-muted">{new Date(r.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}</span></div>
              <p className="mt-2 text-sm text-muted">{r.author} on <b className="text-ink">{r.productName}</b>{r.verified && " · verified purchase"}</p>
              {r.title && <p className="mt-2 font-medium">{r.title}</p>}{r.body && <p className="text-muted">{r.body}</p>}
              <div className="mt-3 flex gap-2">
                {r.status !== "approved" && <Button size="sm" onClick={() => act(() => api(`/api/admin/reviews/${r.id}`, { method: "PATCH", body: { status: "approved" } }), "Approved")}>Approve</Button>}
                {r.status !== "hidden" && <Button size="sm" variant="outline" onClick={() => act(() => api(`/api/admin/reviews/${r.id}`, { method: "PATCH", body: { status: "hidden" } }), "Hidden")}>Hide</Button>}
                <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete this review permanently?")) act(() => api(`/api/admin/reviews/${r.id}`, { method: "DELETE" }), "Deleted"); }}>Delete</Button>
              </div>
            </article>
          ))}
        </div>
        <Pager page={page} total={data?.total ?? 0} pageSize={15} onChange={setPage} />
      </Loadable>
    </>
  );
}
