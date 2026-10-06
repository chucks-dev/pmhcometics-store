import Link from "next/link";
import { Price, ProductImage, Rating } from "@/components/ui/display";
import { STOCK_LABEL } from "@/lib/stock";
import type { ProductCardDTO } from "@/types/catalog";
import { AddToCartButton, WishlistButton } from "./buttons";

export function ProductCard({ p }: { p: ProductCardDTO }) {
  return (
    <article className="group relative flex flex-col">
      <Link href={`/product/${p.slug}`} className="relative block aspect-[4/5] overflow-hidden rounded-3xl bg-blush">
        <ProductImage src={p.image} alt={p.name} className="transition duration-500 group-hover:scale-[1.03]" />
        {p.discountPercent > 0 && <span className="badge absolute left-3 top-3 bg-brand-500 text-white">-{p.discountPercent}%</span>}
        {p.discountPercent === 0 && p.isNew && <span className="badge absolute left-3 top-3 bg-white text-brand-700">New</span>}
        {p.stockStatus !== "in" && (
          <span className={`badge absolute bottom-3 left-3 ${p.stockStatus === "out" ? "bg-ink text-white" : "bg-amber-100 text-amber-800"}`}>{STOCK_LABEL[p.stockStatus]}</span>
        )}
      </Link>
      <WishlistButton productId={p.id} className="absolute right-2.5 top-2.5 !h-10 !w-10" />
      <div className="mt-3 flex flex-1 flex-col">
        {p.brand && <p className="text-xs text-muted">{p.brand}</p>}
        <Link href={`/product/${p.slug}`} className="line-clamp-2 min-h-[2.5rem] text-[15px] font-medium leading-snug hover:text-brand-600">{p.name}</Link>
        <div className="mt-1.5"><Rating value={p.rating} count={p.reviewCount} /></div>
        <div className="mt-2"><Price current={p.currentKobo} original={p.discountPriceKobo ? p.priceKobo : null} /></div>
        <div className="mt-3 pt-0.5"><AddToCartButton productId={p.id} disabled={p.stockStatus === "out"} className="btn-sm" /></div>
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: ProductCardDTO[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
      {products.map((p) => <div key={p.id} className="relative"><ProductCard p={p} /></div>)}
    </div>
  );
}
