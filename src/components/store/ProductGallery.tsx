"use client";
import { useState } from "react";
import { ProductImage } from "@/components/ui/display";
import { cn } from "@/lib/api";

export function ProductGallery({ images, name }: { images: { url: string; alt: string | null }[]; name: string }) {
  const [i, setI] = useState(0);
  const list = images.length ? images : [{ url: "", alt: null }];
  const cur = list[i];
  return (
    <div className="flex flex-col gap-3 lg:flex-row-reverse">
      <div className="aspect-square flex-1 overflow-hidden rounded-3xl bg-blush lg:aspect-[4/5]">
        <ProductImage src={cur.url || null} alt={cur.alt ?? name} />
      </div>
      {list.length > 1 && (
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto lg:w-20 lg:flex-col" role="tablist" aria-label="Product photos">
          {list.map((img, n) => (
            <button key={n} role="tab" aria-selected={n === i} aria-label={`Photo ${n + 1}`} onClick={() => setI(n)}
              className={cn("h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 lg:h-20 lg:w-20", n === i ? "border-brand-500" : "border-transparent opacity-70 hover:opacity-100")}>
              <ProductImage src={img.url || null} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
