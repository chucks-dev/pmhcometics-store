import { WishlistView } from "@/components/store/WishlistView";

export const metadata = { title: "Wishlist" };

export default function WishlistPage() {
  return <div className="container-x py-8"><h1 className="mb-8 text-4xl sm:text-5xl">Wishlist</h1><WishlistView /></div>;
}
