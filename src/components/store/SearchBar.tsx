"use client";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { formatNaira } from "@/lib/money";
import type { ProductCardDTO } from "@/types/catalog";
import { ProductImage } from "@/components/ui/display";

export function SearchBar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ProductCardDTO[]>([]);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) setTimeout(() => input.current?.focus(), 50); else { setQ(""); setResults([]); } }, [open]);
  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      try { setResults((await api<{ items: ProductCardDTO[] }>(`/api/products?q=${encodeURIComponent(q)}&pageSize=5`)).items); } catch { /* ignore */ }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[55] bg-white/98 backdrop-blur animate-slideUp" role="dialog" aria-label="Search">
      <div className="container-x pt-4">
        <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) { onClose(); router.push(`/search?q=${encodeURIComponent(q.trim())}`); } }} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder="Search products, brands…" className="input pl-12" aria-label="Search products" />
          </div>
          <button type="button" onClick={onClose} aria-label="Close search" className="flex h-12 w-12 items-center justify-center rounded-full hover:bg-blush"><X className="h-5 w-5" /></button>
        </form>
        <ul className="mt-4 max-w-2xl">
          {results.map((p) => (
            <li key={p.id}>
              <Link href={`/product/${p.slug}`} onClick={onClose} className="flex items-center gap-3 rounded-2xl p-2 hover:bg-blush">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl"><ProductImage src={p.image} alt="" /></div>
                <div className="min-w-0 flex-1"><p className="truncate font-medium">{p.name}</p><p className="text-sm text-muted">{formatNaira(p.currentKobo)}</p></div>
              </Link>
            </li>
          ))}
          {q.trim().length >= 2 && !results.length && <li className="p-3 text-muted">No matches yet. Try another word.</li>}
        </ul>
      </div>
    </div>
  );
}
