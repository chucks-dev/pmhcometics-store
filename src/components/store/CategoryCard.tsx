import Link from "next/link";
import { ProductImage } from "@/components/ui/display";

/** Arched frame: the one signature shape of the brand. Reused in hero, empty states and category tiles. */
export function CategoryCard({ name, slug, image }: { name: string; slug: string; image?: string | null }) {
  return (
    <Link href={slug === "new-arrivals" ? "/category/new-arrivals" : `/category/${slug}`} className="group block w-[132px] shrink-0 snap-start sm:w-auto">
      <div className="aspect-[3/4] overflow-hidden rounded-t-full rounded-b-2xl bg-blush ring-1 ring-line transition group-hover:ring-brand-300">
        <ProductImage src={image} alt="" className="transition duration-500 group-hover:scale-105" />
      </div>
      <p className="mt-3 text-center font-medium">{name}</p>
    </Link>
  );
}
