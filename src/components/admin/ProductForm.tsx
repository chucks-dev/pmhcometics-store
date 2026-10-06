"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert, Skeleton, useToast } from "@/components/ui/feedback";
import { Button, Checkbox, Chip, Input, Select, Textarea } from "@/components/ui/forms";
import { api, ApiError } from "@/lib/api";
import { SKIN_TYPE_OPTIONS } from "@/lib/constants";
import { ImageUploader, type Img } from "./ImageUploader";
import { PageHeader, Panel, useApi } from "./kit";

const BLANK = { name: "", description: "", categoryId: "", brand: "", sku: "", priceNaira: "", discountPriceNaira: "", stock: "0", lowStockThreshold: "5", ingredients: "", benefits: "", howToUse: "", skinTypes: [] as string[], status: "draft", isFeatured: false, isBestSeller: false };

export function ProductForm({ id }: { id?: string }) {
  const router = useRouter(); const toast = useToast();
  const cats = useApi<{ items: { id: string; name: string }[] }>("/api/admin/categories");
  const [f, setF] = useState(BLANK); const [images, setImages] = useState<Img[]>([]);
  const [loaded, setLoaded] = useState(!id); const [busy, setBusy] = useState(false); const [err, setErr] = useState<ApiError | null>(null);

  useEffect(() => {
    if (!id) return;
    api<{ product: any }>(`/api/admin/products/${id}`).then(({ product: p }) => {
      setF({ ...BLANK, name: p.name, description: p.description ?? "", categoryId: p.categoryId, brand: p.brand ?? "", sku: p.sku, priceNaira: String(p.priceNaira), discountPriceNaira: p.discountPriceNaira ? String(p.discountPriceNaira) : "", stock: String(p.stock), lowStockThreshold: String(p.lowStockThreshold), ingredients: p.ingredients ?? "", benefits: (p.benefits ?? []).join("\n"), howToUse: p.howToUse ?? "", skinTypes: p.skinTypes ?? [], status: p.status, isFeatured: p.isFeatured, isBestSeller: p.isBestSeller });
      setImages(p.images ?? []); setLoaded(true);
    }).catch(() => router.push("/products"));
  }, [id, router]);

  const set = (k: keyof typeof BLANK) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const fe = (k: string) => err?.fields?.[k]?.[0];

  const submit = async () => {
    setBusy(true); setErr(null);
    const body = {
      name: f.name, description: f.description || null, categoryId: f.categoryId, brand: f.brand || null, sku: f.sku,
      priceNaira: Number(f.priceNaira), discountPriceNaira: f.discountPriceNaira ? Number(f.discountPriceNaira) : null,
      stock: Number(f.stock), lowStockThreshold: Number(f.lowStockThreshold), ingredients: f.ingredients || null,
      benefits: f.benefits.split("\n").map((s) => s.trim()).filter(Boolean), howToUse: f.howToUse || null,
      skinTypes: f.skinTypes, status: f.status, isFeatured: f.isFeatured, isBestSeller: f.isBestSeller,
      images: images.map((i) => ({ url: i.url, alt: i.alt ?? null })),
    };
    try {
      if (id) await api(`/api/admin/products/${id}`, { method: "PATCH", body }); else await api("/api/admin/products", { body });
      toast(id ? "Product saved" : "Product created"); router.push("/products");
    } catch (e) { setErr(e as ApiError); setBusy(false); window.scrollTo({ top: 0, behavior: "smooth" }); }
  };

  if (!loaded) return <Skeleton className="h-96 w-full" />;
  return (
    <>
      <PageHeader title={id ? "Edit product" : "Add product"} />
      {err && <div className="mb-4"><Alert>{err.fields ? "Please fix the highlighted fields." : err.message}</Alert></div>}
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <Panel title="Details">
            <div className="space-y-4">
              <Input label="Product name" value={f.name} onChange={set("name")} error={fe("name")} />
              <Textarea label="Description" value={f.description} onChange={set("description")} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Select label="Category" value={f.categoryId} onChange={set("categoryId")} error={fe("categoryId")}><option value="">Choose…</option>{cats.data?.items.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
                <Input label="Brand" value={f.brand} onChange={set("brand")} />
              </div>
            </div>
          </Panel>
          <Panel title="Photos"><ImageUploader images={images} onChange={setImages} /></Panel>
          <Panel title="Product information">
            <div className="space-y-4">
              <Textarea label="Benefits (one per line)" value={f.benefits} onChange={set("benefits")} />
              <Textarea label="Ingredients" value={f.ingredients} onChange={set("ingredients")} />
              <Textarea label="How to use" value={f.howToUse} onChange={set("howToUse")} />
              <fieldset><legend className="label">Skin type</legend><div className="flex flex-wrap gap-2">
                {SKIN_TYPE_OPTIONS.map((o) => <Chip key={o.value} selected={f.skinTypes.includes(o.value)} onClick={() => setF((x) => ({ ...x, skinTypes: x.skinTypes.includes(o.value) ? x.skinTypes.filter((s) => s !== o.value) : [...x.skinTypes, o.value] }))}>{o.label}</Chip>)}
              </div><p className="mt-2 text-xs text-muted">Describe benefits in everyday terms. Avoid medical or clinical claims.</p></fieldset>
            </div>
          </Panel>
        </div>
        <div className="space-y-4">
          <Panel title="Pricing & stock">
            <div className="space-y-4">
              <Input label="Price (₦)" inputMode="decimal" value={f.priceNaira} onChange={set("priceNaira")} error={fe("priceNaira")} />
              <Input label="Discount price (₦, optional)" inputMode="decimal" value={f.discountPriceNaira} onChange={set("discountPriceNaira")} error={fe("discountPriceNaira")} />
              <Input label="SKU" value={f.sku} onChange={set("sku")} error={fe("sku")} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Stock" inputMode="numeric" value={f.stock} onChange={set("stock")} error={fe("stock")} />
                <Input label="Low-stock alert at" inputMode="numeric" value={f.lowStockThreshold} onChange={set("lowStockThreshold")} />
              </div>
            </div>
          </Panel>
          <Panel title="Visibility">
            <div className="space-y-2">
              <Select label="Status" value={f.status} onChange={set("status")}><option value="draft">Draft (hidden)</option><option value="published">Published</option></Select>
              <Checkbox label="Featured on homepage" checked={f.isFeatured} onChange={(e) => setF({ ...f, isFeatured: e.target.checked })} />
              <Checkbox label="Mark as best seller" checked={f.isBestSeller} onChange={(e) => setF({ ...f, isBestSeller: e.target.checked })} />
            </div>
          </Panel>
          <div className="flex gap-3"><Button variant="outline" onClick={() => router.push("/products")}>Cancel</Button><Button className="flex-1" loading={busy} onClick={submit}>{id ? "Save changes" : "Create product"}</Button></div>
        </div>
      </div>
    </>
  );
}
