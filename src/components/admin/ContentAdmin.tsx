"use client";
import { useEffect, useState } from "react";
import { Alert, Skeleton, useToast } from "@/components/ui/feedback";
import { Button, Checkbox, Input, Textarea } from "@/components/ui/forms";
import { api, ApiError } from "@/lib/api";
import { ImageUploader } from "./ImageUploader";
import { PageHeader, Panel, useApi } from "./kit";

interface Banner { title: string; text: string; href: string; imageUrl?: string | null }

function Picker({ title, hint, products, selected, onChange }: { title: string; hint: string; products: { id: string; name: string }[]; selected: string[]; onChange: (ids: string[]) => void }) {
  return (
    <Panel title={title}>
      <p className="-mt-2 mb-3 text-sm text-muted">{hint}</p>
      <div className="grid max-h-64 gap-x-6 overflow-y-auto sm:grid-cols-2">
        {products.map((p) => <Checkbox key={p.id} label={p.name} checked={selected.includes(p.id)} onChange={(e) => onChange(e.target.checked ? [...selected, p.id].slice(0, 12) : selected.filter((x) => x !== p.id))} />)}
      </div>
    </Panel>
  );
}

export function ContentAdmin() {
  const toast = useToast();
  const prods = useApi<{ items: { id: string; name: string; status: string }[] }>("/api/admin/products?pageSize=100&status=published");
  const [loaded, setLoaded] = useState(false); const [busy, setBusy] = useState(false); const [err, setErr] = useState<ApiError | null>(null);
  const [hero, setHero] = useState({ title: "", description: "", imageUrl: "", ctaLabel: "", ctaHref: "" });
  const [banners, setBanners] = useState<Banner[]>([]);
  const [featured, setFeatured] = useState<string[]>([]); const [arrivals, setArrivals] = useState<string[]>([]); const [best, setBest] = useState<string[]>([]);

  useEffect(() => {
    api<{ content: any }>("/api/admin/content").then(({ content: c }) => {
      setHero({ title: c.hero.title, description: c.hero.description, imageUrl: c.hero.imageUrl ?? "", ctaLabel: c.hero.ctaLabel, ctaHref: c.hero.ctaHref });
      setBanners(c.banners); setFeatured(c.featuredIds); setArrivals(c.newArrivalIds); setBest(c.bestSellerIds); setLoaded(true);
    });
  }, []);

  const save = async () => {
    setBusy(true); setErr(null);
    try {
      await api("/api/admin/content", { method: "PUT", body: {
        hero: { ...hero, imageUrl: hero.imageUrl || null },
        banners: banners.filter((b) => b.title).map((b) => ({ ...b, imageUrl: b.imageUrl || null })),
        featuredIds: featured, newArrivalIds: arrivals, bestSellerIds: best,
      } });
      toast("Homepage updated");
    } catch (e) { setErr(e as ApiError); }
    setBusy(false);
  };

  if (!loaded) return <Skeleton className="h-96 w-full" />;
  const products = prods.data?.items ?? [];
  return (
    <>
      <PageHeader title="Homepage content" subtitle="Changes appear on the storefront right away." action={<Button loading={busy} onClick={save}>Save changes</Button>} />
      {err && <div className="mb-4"><Alert>{err.fields ? "Please check the highlighted fields." : err.message}</Alert></div>}
      <div className="space-y-4">
        <Panel title="Hero banner">
          <div className="space-y-4">
            <Input label="Hero title" value={hero.title} onChange={(e) => setHero({ ...hero, title: e.target.value })} error={err?.fields?.["hero"]?.[0]} />
            <Textarea label="Hero description" value={hero.description} onChange={(e) => setHero({ ...hero, description: e.target.value })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Button label" value={hero.ctaLabel} onChange={(e) => setHero({ ...hero, ctaLabel: e.target.value })} />
              <Input label="Button link" value={hero.ctaHref} onChange={(e) => setHero({ ...hero, ctaHref: e.target.value })} hint="A path such as /shop" />
            </div>
            <div><p className="label">Hero image</p><ImageUploader images={hero.imageUrl ? [{ url: hero.imageUrl }] : []} onChange={(i) => setHero({ ...hero, imageUrl: i[i.length - 1]?.url ?? "" })} /></div>
          </div>
        </Panel>
        <Panel title="Promotional banners (up to 2 shown)">
          <div className="space-y-5">
            {banners.map((b, i) => (
              <div key={i} className="grid gap-3 rounded-2xl border border-line p-4 sm:grid-cols-3">
                <Input label="Title" value={b.title} onChange={(e) => setBanners(banners.map((x, n) => n === i ? { ...x, title: e.target.value } : x))} />
                <Input label="Text" value={b.text} onChange={(e) => setBanners(banners.map((x, n) => n === i ? { ...x, text: e.target.value } : x))} />
                <Input label="Link" value={b.href} onChange={(e) => setBanners(banners.map((x, n) => n === i ? { ...x, href: e.target.value } : x))} />
                <Button variant="ghost" size="sm" onClick={() => setBanners(banners.filter((_, n) => n !== i))}>Remove banner</Button>
              </div>
            ))}
            {banners.length < 4 && <Button variant="outline" size="sm" onClick={() => setBanners([...banners, { title: "", text: "", href: "/shop" }])}>Add banner</Button>}
          </div>
        </Panel>
        <Picker title="Featured products" hint="Up to 12. Leave empty to use products marked Featured." products={products} selected={featured} onChange={setFeatured} />
        <Picker title="New arrivals" hint="Pick products to show in New arrivals. Leave empty to show the newest automatically." products={products} selected={arrivals} onChange={setArrivals} />
        <Picker title="Best sellers" hint="Pick products to show in Best sellers. Leave empty to choose automatically." products={products} selected={best} onChange={setBest} />
      </div>
    </>
  );
}
