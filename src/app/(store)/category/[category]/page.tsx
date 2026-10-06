import { notFound } from "next/navigation";
import { ProductBrowser, type SP } from "@/components/store/ProductBrowser";
import { getCategories } from "@/server/catalog";

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  return { title: category === "new-arrivals" ? "New Arrivals" : category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) };
}

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ category: string }>; searchParams: Promise<SP> }) {
  const { category } = await params;
  if (category === "new-arrivals") {
    return <ProductBrowser basePath="/category/new-arrivals" sp={await searchParams} category="new-arrivals" title="New arrivals" subtitle="Added in the last 30 days." />;
  }
  const cat = (await getCategories()).find((c) => c.slug === category);
  if (!cat) notFound();
  return <ProductBrowser basePath={`/category/${cat.slug}`} sp={await searchParams} category={cat.slug} title={cat.name} subtitle={cat.description ?? undefined} />;
}
