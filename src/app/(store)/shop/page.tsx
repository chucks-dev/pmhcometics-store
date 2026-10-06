import { ProductBrowser, type SP } from "@/components/store/ProductBrowser";

export const metadata = { title: "Shop" };

export default async function Shop({ searchParams }: { searchParams: Promise<SP> }) {
  return <ProductBrowser basePath="/shop" sp={await searchParams} title="Shop all" subtitle="Skincare, makeup and beauty essentials, all in one place." />;
}
