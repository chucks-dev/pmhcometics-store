import { ProductGrid } from "@/components/store/ProductCard";
import { EmptyState } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/forms";
import { getCurrentUser } from "@/server/auth/guards";
import { listProducts } from "@/server/catalog";
import { query } from "@/server/db/client";

export async function WishlistView() {
  const user = await getCurrentUser();
  if (!user) {
    return <EmptyState title="Save what you love" text="Log in to keep a wishlist you can come back to on any device." action={<ButtonLink href="/login?next=/wishlist">Log in</ButtonLink>} />;
  }
  const ids = (await query<{ product_id: string }>(
    `SELECT wi.product_id FROM wishlist_items wi JOIN wishlists w ON w.id = wi.wishlist_id WHERE w.user_id = $1 ORDER BY wi.added_at DESC`, [user.id])).map((r) => r.product_id);
  if (!ids.length) return <EmptyState title="Your wishlist is empty" text="Tap the heart on any product to save it here." action={<ButtonLink href="/shop">Browse products</ButtonLink>} />;
  const { items } = await listProducts({ ids, pageSize: 48 });
  return <ProductGrid products={ids.map((id) => items.find((p) => p.id === id)!).filter(Boolean)} />;
}
