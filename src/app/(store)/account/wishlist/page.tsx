import { WishlistView } from "@/components/store/WishlistView";

export const metadata = { title: "My wishlist" };

export default function AccountWishlist() {
  return <><h1 className="mb-6 text-3xl">Wishlist</h1><WishlistView /></>;
}
