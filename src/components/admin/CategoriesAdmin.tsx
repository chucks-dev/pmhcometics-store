"use client";
import { useState } from "react";
import { StatusBadge } from "@/components/ui/display";
import { Alert, Modal, useToast } from "@/components/ui/feedback";
import { Button, Checkbox, Input } from "@/components/ui/forms";
import { api, ApiError } from "@/lib/api";
import { Loadable, PageHeader, Panel, Table, useApi } from "./kit";

interface Cat { id: string; name: string; slug: string; description: string | null; imageUrl: string | null; sortOrder: number; isActive: boolean; productCount: number }
const BLANK = { name: "", description: "", imageUrl: "", sortOrder: "0", isActive: true };

export function CategoriesAdmin() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi<{ items: Cat[] }>("/api/admin/categories");
  const [edit, setEdit] = useState<{ id?: string; v: typeof BLANK } | null>(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const save = async () => {
    if (!edit) return; setBusy(true); setErr("");
    const body = { name: edit.v.name, description: edit.v.description || null, imageUrl: edit.v.imageUrl || null, sortOrder: Number(edit.v.sortOrder) || 0, isActive: edit.v.isActive };
    try { if (edit.id) await api(`/api/admin/categories/${edit.id}`, { method: "PATCH", body }); else await api("/api/admin/categories", { body }); setEdit(null); toast("Category saved"); reload(); }
    catch (e) { setErr(e instanceof ApiError ? e.message : "Failed"); }
    setBusy(false);
  };
  return (
    <>
      <PageHeader title="Categories" action={<Button size="sm" onClick={() => { setErr(""); setEdit({ v: BLANK }); }}>Add category</Button>} />
      <Panel><Loadable loading={loading} error={error} reload={reload}>
        <Table rows={data?.items ?? []} columns={[
          { header: "Name", cell: (c) => <span className="font-medium">{c.name}</span> }, { header: "Slug", cell: (c) => c.slug },
          { header: "Products", cell: (c) => c.productCount }, { header: "Order", cell: (c) => c.sortOrder },
          { header: "Status", cell: (c) => <StatusBadge status={c.isActive ? "active" : "hidden"} /> },
          { header: "", className: "text-right", cell: (c) => (
            <div className="flex justify-end gap-1">
              <Button size="sm" variant="ghost" onClick={() => { setErr(""); setEdit({ id: c.id, v: { name: c.name, description: c.description ?? "", imageUrl: c.imageUrl ?? "", sortOrder: String(c.sortOrder), isActive: c.isActive } }); }}>Edit</Button>
              <Button size="sm" variant="ghost" onClick={async () => { if (!confirm(`Delete ${c.name}?`)) return; try { await api(`/api/admin/categories/${c.id}`, { method: "DELETE" }); toast("Deleted"); reload(); } catch (e) { toast(e instanceof ApiError ? e.message : "Failed", "error"); } }}>Delete</Button>
            </div>) },
        ]} />
      </Loadable></Panel>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "Edit category" : "New category"}>
        {edit && <div className="space-y-4">
          <Input label="Name" value={edit.v.name} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, name: e.target.value } })} />
          <Input label="Description" value={edit.v.description} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, description: e.target.value } })} />
          <Input label="Image URL" value={edit.v.imageUrl} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, imageUrl: e.target.value } })} hint="Paste a URL from an uploaded product photo." />
          <Input label="Sort order" inputMode="numeric" value={edit.v.sortOrder} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, sortOrder: e.target.value } })} />
          <Checkbox label="Visible in store" checked={edit.v.isActive} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, isActive: e.target.checked } })} />
          {err && <Alert>{err}</Alert>}<Button className="w-full" loading={busy} onClick={save}>Save category</Button>
        </div>}
      </Modal>
    </>
  );
}
