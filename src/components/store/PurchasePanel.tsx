"use client";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { useStore } from "./StoreProvider";
import { WishlistButton } from "./buttons";
import { Button } from "@/components/ui/forms";

export function PurchasePanel({ productId, stock }: { productId: string; stock: number }) {
  const { addToCart } = useStore();
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const max = Math.min(stock, 20);
  const out = stock <= 0;
  return (
    <div className="flex flex-wrap items-center gap-3">
      {!out && (
        <div className="flex h-12 items-center rounded-full border border-line bg-white" role="group" aria-label="Quantity">
          <button type="button" aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty(qty - 1)} className="flex h-12 w-12 items-center justify-center disabled:opacity-40"><Minus className="h-4 w-4" /></button>
          <span className="w-8 text-center font-semibold" aria-live="polite">{qty}</span>
          <button type="button" aria-label="Increase quantity" disabled={qty >= max} onClick={() => setQty(qty + 1)} className="flex h-12 w-12 items-center justify-center disabled:opacity-40"><Plus className="h-4 w-4" /></button>
        </div>
      )}
      <Button className="flex-1 min-w-[160px]" disabled={out} loading={busy}
        onClick={async () => { setBusy(true); await addToCart(productId, qty); setBusy(false); }}>
        {out ? "Out of stock" : "Add to cart"}
      </Button>
      <WishlistButton productId={productId} className="!h-12 !w-12 border border-line" />
    </div>
  );
}
