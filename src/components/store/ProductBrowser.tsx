import Link from "next/link";
import { Suspense } from "react";
import { FilterDrawer, SortSelect } from "@/components/store/FilterDrawer";
import { ProductGrid } from "@/components/store/ProductCard";
import { EmptyState } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/forms";
import { Pagination } from "@/components/ui/display";
import { cn } from "@/lib/api";
import { getCategories, getFacets, listProducts, type ProductFilters } from "@/server/catalog";

export type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const num = (v?: string) => (v && !isNaN(+v) ? +v : undefined);

export function parseFilters(sp: SP): ProductFilters {
  return {
    q: one(sp.q)?.slice(0, 100), minPrice: num(one(sp.minPrice)), maxPrice: num(one(sp.maxPrice)), skinType: one(sp.skinType),
    minRating: num(one(sp.minRating)), brands: one(sp.brand)?.split(",").filter(Boolean), inStock: one(sp.inStock) === "1",
    sort: one(sp.sort), page: num(one(sp.page)),
  };
}

export async function ProductBrowser({ basePath, sp, title, subtitle, category, showCategories = true }:
  { basePath: string; sp: SP; title: string; subtitle?: string; category?: string; showCategories?: boolean }) {
  const filters = { ...parseFilters(sp), category };
  const [result, facets, categories] = await Promise.all([listProducts(filters), getFacets(), getCategories()]);
  const params = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, one(v)]));
  const chip = (href: string, label: string, active: boolean) => (
    <Link key={href} href={href} className={cn("shrink-0 rounded-full border px-4 py-2 text-sm font-medium", active ? "border-brand-500 bg-brand-500 text-white" : "border-line bg-white hover:border-brand-300")}>{label}</Link>
  );
  return (
    <div className="container-x py-8">
      <h1 className="text-4xl sm:text-5xl">{title}</h1>
      {subtitle && <p className="mt-2 max-w-xl text-muted">{subtitle}</p>}
      {showCategories && (
        <div className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {chip("/shop", "All", basePath === "/shop")}
          {categories.map((c) => chip(`/category/${c.slug}`, c.name, category === c.slug))}
          {chip("/category/new-arrivals", "New Arrivals", category === "new-arrivals")}
        </div>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <p className="text-sm text-muted">{result.total} {result.total === 1 ? "product" : "products"}</p>
        <div className="flex items-center gap-3">
          <Suspense><FilterDrawer brands={facets.brands} /></Suspense>
          <Suspense><SortSelect /></Suspense>
        </div>
      </div>
      <div className="mt-8">
        {result.items.length ? (
          <>
            <ProductGrid products={result.items} />
            <Pagination page={result.page} pages={result.pages} basePath={basePath} params={params} />
          </>
        ) : (
          <EmptyState title="Nothing matches yet" text="Try removing a filter or searching for something else." action={<ButtonLink href={basePath} variant="outline">Clear filters</ButtonLink>} />
        )}
      </div>
    </div>
  );
}
