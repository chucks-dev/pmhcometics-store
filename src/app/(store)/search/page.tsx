import { ProductBrowser, type SP } from "@/components/store/ProductBrowser";

export const metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim();
  return <ProductBrowser basePath="/search" sp={sp} title={q ? `Results for “${q}”` : "Search"} subtitle={q ? undefined : "Type a product, brand or concern in the search bar."} showCategories={false} />;
}
