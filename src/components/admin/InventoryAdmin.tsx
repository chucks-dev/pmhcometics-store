"use client";
import { useState } from "react";
import { StatusBadge } from "@/components/ui/display";
import { useToast } from "@/components/ui/feedback";
import { Button, Input, Select } from "@/components/ui/forms";
import { api, ApiError } from "@/lib/api";
import { Loadable, PageHeader, Pager, Panel, Table, useApi } from "./kit";

interface Row { id: string; name: string; sku: string; stock: number; lowStockThreshold: number; status: string }

export function InventoryAdmin() {
  const toast = useToast();
  const [q, setQ] = useState(""); const [status, setStatus] = useState(""); const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi<{ items: Row[]; total: number }>(`/api/admin/inventory?page=${page}&pageSize=30${q ? `&q=${encodeURIComponent(q)}` : ""}${status ? `&status=${status}` : ""}`);
  const [edits, setEdits] = useState<Record<string, { stock: string; low: string }>>({});
  const val = (r: Row) => edits[r.id] ?? { stock: String(r.stock), low: String(r.lowStockThreshold) };
  const dirty = (r: Row) => edits[r.id] && (edits[r.id].stock !== String(r.stock) || edits[r.id].low !== String(r.lowStockThreshold));
  return (
    <>
      <PageHeader title="Inventory" subtitle="Customers can't buy items that are out of stock." />
      <Panel>
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="min-w-[200px] flex-1"><Input placeholder="Search name or SKU" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} aria-label="Search inventory" /></div>
          <div className="w-44"><Select aria-label="Stock status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">All</option><option value="in">In stock</option><option value="low">Low stock</option><option value="out">Out of stock</option></Select></div>
        </div>
        <Loadable loading={loading && !data} error={error} reload={reload}>
          <Table rows={data?.items ?? []} columns={[
            { header: "Product", cell: (r) => <div><p className="font-medium">{r.name}</p><p className="text-xs text-muted">{r.sku}</p></div> },
            { header: "Stock", cell: (r) => <input aria-label={`Stock for ${r.name}`} className="input !min-h-[40px] w-24" inputMode="numeric" value={val(r).stock} onChange={(e) => setEdits({ ...edits, [r.id]: { ...val(r), stock: e.target.value.replace(/\D/g, "") } })} /> },
            { header: "Low-stock threshold", cell: (r) => <input aria-label={`Threshold for ${r.name}`} className="input !min-h-[40px] w-24" inputMode="numeric" value={val(r).low} onChange={(e) => setEdits({ ...edits, [r.id]: { ...val(r), low: e.target.value.replace(/\D/g, "") } })} /> },
            { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
            { header: "", className: "text-right", cell: (r) => dirty(r) ? <Button size="sm" onClick={async () => {
              try { await api(`/api/admin/inventory/${r.id}`, { method: "PATCH", body: { stock: Number(val(r).stock || 0), lowStockThreshold: Number(val(r).low || 0) } }); setEdits(({ [r.id]: _, ...rest }) => rest); toast("Stock updated"); reload(); }
              catch (e) { toast(e instanceof ApiError ? e.message : "Failed", "error"); } }}>Save</Button> : null },
          ]} />
          <Pager page={page} total={data?.total ?? 0} pageSize={30} onChange={setPage} />
        </Loadable>
      </Panel>
    </>
  );
}
