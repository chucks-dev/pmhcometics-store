import Link from "next/link";
import { ProductGrid } from "@/components/store/ProductCard";
import { CategoryCard } from "@/components/store/CategoryCard";
import { Newsletter } from "@/components/store/Newsletter";
import { ProductImage, Rating, SectionTitle } from "@/components/ui/display";
import { ButtonLink } from "@/components/ui/forms";
import { getCurrentUser } from "@/server/auth/guards";
import { getApprovedReviews, getBestSellers, getCategories, getHomepageContent, getNewArrivals, getRecommendations, listProducts } from "@/server/catalog";
import type { ProductCardDTO } from "@/types/catalog";

export const metadata = { title: "Your Beauty. Your Way." };

async function pick(ids: string[], fallback: () => Promise<ProductCardDTO[]>) {
  if (!ids.length) return fallback();
  const { items } = await listProducts({ ids, pageSize: 12 });
  return ids.map((id) => items.find((p) => p.id === id)).filter(Boolean) as ProductCardDTO[];
}

export default async function Home() {
  const user = await getCurrentUser();
  const [content, categories, reviews] = await Promise.all([getHomepageContent(), getCategories(), getApprovedReviews({ limit: 8 })]);
  const [arrivals, bestSellers, picks] = await Promise.all([
    pick(content.newArrivalIds, () => getNewArrivals(4)),
    pick(content.bestSellerIds, () => getBestSellers(4)),
    user ? getRecommendations(user.id, 4) : Promise.resolve([]),
  ]);
  const banners = content.banners.length ? content.banners : [
    { title: "Free delivery on bigger baskets", text: "Spend over ₦50,000 and get 30% 0ff delivery fee.", href: "/shop" },
    { title: "Try BEAUTY10", text: "5% off orders over ₦20,000 while it lasts.", href: "/shop" },
  ];
  const h = content.hero;

  return (
    <>
      <section className="container-x grid items-center gap-8 pb-4 pt-8 lg:grid-cols-2 lg:gap-16 lg:pt-14">
        <div>
          <h1 className="text-[2.75rem] leading-[1.05] sm:text-6xl lg:text-7xl">{h.title}</h1>
          <p className="mt-5 max-w-md text-lg text-muted">{h.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={h.ctaHref}>{h.ctaLabel}</ButtonLink>
            <ButtonLink href="#collections" variant="outline">Explore Collections</ButtonLink>
          </div>
        </div>
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          <div className="aspect-4/5 overflow-hidden rounded-t-full rounded-b-4xl bg-blush shadow-lift ring-1 ring-line">
            <ProductImage src={h.imageUrl} alt="" />
          </div>
        </div>
      </section>

      {user && (
        <section className="container-x mt-14">
          <SectionTitle title={`Welcome back, ${user.full_name.split(" ")[0]} `} />
          <p className="-mt-3 mb-6 text-muted">Here&apos;s what we picked for you.</p>
          {picks.length ? <><h3 className="mb-4 font-sans text-lg font-semibold">Recommended For You</h3><ProductGrid products={picks} /></>
            : <p className="text-muted">Tell us your <Link className="text-brand-600 underline" href="/account/preferences">beauty preferences</Link> and we&apos;ll tailor this space.</p>}
        </section>
      )}

      <section id="collections" className="container-x mt-16 scroll-mt-20">
        <SectionTitle title="Shop by category" />
        <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-6">
          {categories.map((c) => <CategoryCard key={c.id} name={c.name} slug={c.slug} image={c.image_url} />)}
          <CategoryCard name="New Arrivals" slug="new-arrivals" />
        </div>
      </section>

      {arrivals.length > 0 && (
        <section className="container-x mt-16">
          <SectionTitle title="New arrivals" action={<Link href="/category/new-arrivals" className="text-sm font-semibold text-brand-600">View all</Link>} />
          <ProductGrid products={arrivals} />
        </section>
      )}

      <section className="container-x mt-16 grid gap-4 md:grid-cols-2">
        {banners.slice(0, 2).map((b) => (
          <Link key={b.title} href={b.href} className="group flex min-h-45 flex-col justify-end overflow-hidden rounded-4xl bg-linear-to-br from-brand-100 to-blush p-7 transition hover:shadow-lift">
            <h3 className="text-2xl">{b.title}</h3><p className="mt-1 text-muted">{b.text}</p>
          </Link>
        ))}
      </section>

      {bestSellers.length > 0 && (
        <section className="container-x mt-16">
          <SectionTitle title="Best sellers" action={<Link href="/shop?sort=rating" className="text-sm font-semibold text-brand-600">View all</Link>} />
          <ProductGrid products={bestSellers} />
        </section>
      )}

      {reviews.length > 0 && (
        <section className="container-x mt-16">
          <SectionTitle title="Loved by our customers" />
          <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {reviews.map((r) => (
              <figure key={r.id} className="card w-70 shrink-0 snap-start p-5">
                <Rating value={r.rating} />
                {r.title && <p className="mt-3 font-medium">{r.title}</p>}
                <blockquote className="mt-1 line-clamp-4 text-muted">{r.body}</blockquote>
                <figcaption className="mt-4 text-sm">{r.author}<span className="text-muted"> on {r.productName}</span></figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
      <Newsletter />
    </>
  );
}
