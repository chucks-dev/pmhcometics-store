import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/store/ProductGallery";
import { ProductGrid } from "@/components/store/ProductCard";
import { PurchasePanel } from "@/components/store/PurchasePanel";
import { ReviewForm } from "@/components/store/ReviewForm";
import { Price, Rating, SectionTitle } from "@/components/ui/display";
import { SKIN_TYPE_OPTIONS } from "@/lib/constants";
import { STOCK_LABEL } from "@/lib/stock";
import { getApprovedReviews, getProduct, getRelated } from "@/server/catalog";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const p = await getProduct((await params).id);
  return { title: p?.name ?? "Product", description: p?.description?.slice(0, 160) };
}

function Section({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-b border-line py-1">
      <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between text-lg font-medium">
        {title}<span className="text-2xl text-muted transition group-open:rotate-45">+</span>
      </summary>
      <div className="pb-5 text-muted">{children}</div>
    </details>
  );
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await getProduct((await params).id);
  if (!p) notFound();
  const [reviews, related] = await Promise.all([getApprovedReviews({ productId: p.id, limit: 20 }), getRelated(p.id, p.categorySlug)]);
  const skin = p.skinTypes.map((s) => SKIN_TYPE_OPTIONS.find((o) => o.value === s)?.label ?? s);

  return (
    <div className="container-x py-6 lg:py-10">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={p.images} name={p.name} />
        <div>
          {p.brand && <p className="text-sm text-muted">{p.brand}</p>}
          <h1 className="mt-1 text-3xl sm:text-4xl">{p.name}</h1>
          <div className="mt-3 flex items-center gap-3"><Rating value={p.rating} count={p.reviewCount} size="md" /></div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Price current={p.currentKobo} original={p.discountPriceKobo ? p.priceKobo : null} size="lg" />
            {p.discountPercent > 0 && <span className="badge bg-brand-500 text-white">Save {p.discountPercent}%</span>}
          </div>
          <p className={`mt-3 text-sm font-medium ${p.stockStatus === "out" ? "text-red-600" : p.stockStatus === "low" ? "text-amber-700" : "text-emerald-700"}`}>
            {STOCK_LABEL[p.stockStatus]}{p.stockStatus === "low" ? `: only ${p.stock} left` : ""}
          </p>
          <div className="mt-6"><PurchasePanel productId={p.id} stock={p.stock} /></div>
          <div className="mt-8 border-t border-line">
            {p.description && <Section title="Description" open><p className="whitespace-pre-line">{p.description}</p></Section>}
            {p.benefits.length > 0 && <Section title="Benefits"><ul className="list-disc space-y-1 pl-5">{p.benefits.map((b) => <li key={b}>{b}</li>)}</ul></Section>}
            {p.ingredients && <Section title="Ingredients"><p>{p.ingredients}</p></Section>}
            {p.howToUse && <Section title="How to use"><p className="whitespace-pre-line">{p.howToUse}</p></Section>}
            {skin.length > 0 && <Section title="Skin type"><p>Suitable for: {skin.join(", ")}.</p></Section>}
          </div>
        </div>
      </div>

      <section className="mt-16" id="reviews">
        <SectionTitle title={`Customer reviews${p.reviewCount ? ` (${p.reviewCount})` : ""}`} />
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4">
            {reviews.length ? reviews.map((r) => (
              <article key={r.id} className="card p-5">
                <div className="flex items-center justify-between"><Rating value={r.rating} /><span className="text-xs text-muted">{new Date(r.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}</span></div>
                {r.title && <h3 className="mt-2 font-sans font-semibold">{r.title}</h3>}
                {r.body && <p className="mt-1 text-muted">{r.body}</p>}
                <p className="mt-3 text-sm">{r.author}{r.verified && <span className="ml-2 text-emerald-700">Verified purchase</span>}</p>
              </article>
            )) : <p className="text-muted">No reviews yet. Be the first after your purchase.</p>}
          </div>
          <div className="card h-fit p-5"><h3 className="mb-4 font-sans text-lg font-semibold">Write a review</h3><ReviewForm productId={p.id} /></div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-16"><SectionTitle title="You may also like" /><ProductGrid products={related} /></section>
      )}
    </div>
  );
}
