"use client";
import { SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, Checkbox, Radio, Select } from "@/components/ui/forms";
import { Modal } from "@/components/ui/feedback";
import { SKIN_TYPE_OPTIONS } from "@/lib/constants";

const SORTS = [
  ["recommended", "Recommended"], ["newest", "Newest"], ["price_asc", "Price: Low to High"],
  ["price_desc", "Price: High to Low"], ["rating", "Best Rated"],
];

function FilterForm({ brands, onDone }: { brands: string[]; onDone: () => void }) {
  const router = useRouter(); const path = usePathname(); const sp = useSearchParams();
  const [min, setMin] = useState(sp.get("minPrice") ? String(Number(sp.get("minPrice")) / 100) : "");
  const [max, setMax] = useState(sp.get("maxPrice") ? String(Number(sp.get("maxPrice")) / 100) : "");
  const [skin, setSkin] = useState(sp.get("skinType") ?? "");
  const [rating, setRating] = useState(sp.get("minRating") ?? "");
  const [sel, setSel] = useState<string[]>(sp.get("brand")?.split(",").filter(Boolean) ?? []);
  const [inStock, setInStock] = useState(sp.get("inStock") === "1");

  const apply = () => {
    const n = new URLSearchParams(sp.toString()); n.delete("page");
    const set = (k: string, v: string) => (v ? n.set(k, v) : n.delete(k));
    set("minPrice", min ? String(Math.round(Number(min) * 100)) : ""); set("maxPrice", max ? String(Math.round(Number(max) * 100)) : "");
    set("skinType", skin); set("minRating", rating); set("brand", sel.join(",")); set("inStock", inStock ? "1" : "");
    router.push(`${path}?${n}`); onDone();
  };
  const clear = () => { const n = new URLSearchParams(); ["q", "sort"].forEach((k) => sp.get(k) && n.set(k, sp.get(k)!)); router.push(`${path}?${n}`); onDone(); };

  return (
    <div className="space-y-6">
      <fieldset><legend className="label">Price range (₦)</legend>
        <div className="flex items-center gap-2">
          <input className="input" inputMode="numeric" placeholder="Min" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} aria-label="Minimum price" />
          <span className="text-muted">–</span>
          <input className="input" inputMode="numeric" placeholder="Max" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} aria-label="Maximum price" />
        </div></fieldset>
      <Select label="Skin type" value={skin} onChange={(e) => setSkin(e.target.value)}>
        <option value="">Any</option>{SKIN_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>
      <fieldset><legend className="label">Rating</legend>
        {[["", "Any rating"], ["4", "4 stars & up"], ["3", "3 stars & up"]].map(([v, l]) => <Radio key={v} name="rating" label={l} checked={rating === v} onChange={() => setRating(v)} />)}
      </fieldset>
      {brands.length > 0 && (
        <fieldset><legend className="label">Brand</legend>
          {brands.map((b) => <Checkbox key={b} label={b} checked={sel.includes(b)} onChange={(e) => setSel(e.target.checked ? [...sel, b] : sel.filter((x) => x !== b))} />)}
        </fieldset>
      )}
      <Checkbox label="In stock only" checked={inStock} onChange={(e) => setInStock(e.target.checked)} />
      <div className="sticky bottom-0 -mx-5 flex gap-3 border-t border-line bg-white px-5 pt-4">
        <Button variant="outline" className="flex-1" onClick={clear} type="button">Clear</Button>
        <Button className="flex-1" onClick={apply} type="button">Show results</Button>
      </div>
    </div>
  );
}

export function SortSelect() {
  const router = useRouter(); const path = usePathname(); const sp = useSearchParams();
  return (
    <div className="min-w-[170px]">
      <Select aria-label="Sort by" value={sp.get("sort") ?? "recommended"} onChange={(e) => {
        const n = new URLSearchParams(sp.toString()); n.set("sort", e.target.value); n.delete("page"); router.push(`${path}?${n}`);
      }}>{SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
    </div>
  );
}

export function FilterDrawer({ brands }: { brands: string[] }) {
  const [open, setOpen] = useState(false);
  const sp = useSearchParams();
  const active = ["minPrice", "maxPrice", "skinType", "minRating", "brand", "inStock"].filter((k) => sp.get(k)).length;
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-outline btn-sm gap-2"><SlidersHorizontal className="h-4 w-4" />Filters{active > 0 && <span className="badge bg-brand-500 text-white">{active}</span>}</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Filters" sheet>
        <FilterForm brands={brands} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}
