import { cookies } from "next/headers";
import { getCurrentUser } from "./auth/guards";
import { query, tx } from "./db/client";
import { env } from "./env";
import { deliveryFee, evaluateDiscount } from "./pricing";
import { getDeliveryConfig } from "./settings";
import { randomToken, sha256 } from "./security/crypto";
import type { CartDTO, CartItemDTO } from "@/types/catalog";

const COOKIE = "cos_cart";
const MAX_QTY = 20;

/** Finds (or creates) the current visitor's cart. Logged-in carts absorb any guest cart. */
export async function resolveCart(create: boolean): Promise<string | null> {
  const jar = await cookies();
  const guestToken = jar.get(COOKIE)?.value;
  const user = await getCurrentUser();

  if (user) {
    let [cart] = await query<{ id: string }>(`SELECT id FROM carts WHERE user_id = $1`, [user.id]);
    if (!cart && create) {
      [cart] = await query<{ id: string }>(
        `INSERT INTO carts (user_id) VALUES ($1) ON CONFLICT (user_id) WHERE user_id IS NOT NULL DO UPDATE SET updated_at = now() RETURNING id`,
        [user.id]);
    }
    if (guestToken) {
      const [guest] = await query<{ id: string }>(`SELECT id FROM carts WHERE guest_token_hash = $1`, [sha256(guestToken)]);
      if (guest) {
        if (!cart) [cart] = await query<{ id: string }>(`INSERT INTO carts (user_id) VALUES ($1) RETURNING id`, [user.id]);
        await tx(async (c) => {
          await c.query(
            `INSERT INTO cart_items (cart_id, product_id, quantity)
             SELECT $1, product_id, quantity FROM cart_items WHERE cart_id = $2
             ON CONFLICT (cart_id, product_id) DO UPDATE SET quantity = LEAST(cart_items.quantity + EXCLUDED.quantity, ${MAX_QTY})`,
            [cart.id, guest.id]);
          await c.query(`DELETE FROM carts WHERE id = $1`, [guest.id]);
        });
      }
      jar.delete(COOKIE);
    }
    return cart?.id ?? null;
  }

  if (guestToken) {
    const [cart] = await query<{ id: string }>(`SELECT id FROM carts WHERE guest_token_hash = $1`, [sha256(guestToken)]);
    if (cart) return cart.id;
  }
  if (!create) return null;
  const token = randomToken();
  const [cart] = await query<{ id: string }>(`INSERT INTO carts (guest_token_hash) VALUES ($1) RETURNING id`, [sha256(token)]);
  jar.set(COOKIE, token, { httpOnly: true, secure: env.isProd, sameSite: "lax", path: "/", maxAge: 30 * 86400 });
  return cart.id;
}

export async function loadCartItems(cartId: string): Promise<CartItemDTO[]> {
  const rows = await query(
    `SELECT ci.quantity, p.id, p.slug, p.name, p.brand, p.price_kobo, p.discount_price_kobo, p.stock, p.status, p.deleted_at,
            (SELECT url FROM product_images i WHERE i.product_id = p.id ORDER BY is_primary DESC, sort_order LIMIT 1) AS image
       FROM cart_items ci JOIN products p ON p.id = ci.product_id
      WHERE ci.cart_id = $1 ORDER BY ci.added_at`, [cartId]);
  return rows.map((r: any) => {
    const unit = Number(r.discount_price_kobo ?? r.price_kobo);
    const available = r.status === "published" && !r.deleted_at && r.stock >= r.quantity && r.stock > 0;
    return {
      productId: r.id, slug: r.slug, name: r.name, brand: r.brand, image: r.image, unitKobo: unit,
      originalKobo: Number(r.price_kobo), quantity: r.quantity, stock: r.stock, available, lineKobo: unit * r.quantity,
    };
  });
}

export async function priceCart(
  items: CartItemDTO[],
  opts: { code?: string | null; state?: string | null } = {},
): Promise<CartDTO> {
  const subtotal = items.reduce((s, i) => s + i.lineKobo, 0);
  let discount = 0;
  let discountCode: string | null = null;
  let discountError: string | null = null;
  if (opts.code && subtotal > 0) {
    const d = await evaluateDiscount(opts.code, subtotal);
    if (d.ok) { discount = d.amountKobo; discountCode = d.code; } else discountError = d.reason;
  }
  const delivery = await deliveryFee(opts.state ?? null, subtotal - discount);
  const cfg = await getDeliveryConfig();
  return {
    items, count: items.reduce((s, i) => s + i.quantity, 0),
    subtotalKobo: subtotal, deliveryKobo: delivery, discountKobo: discount, totalKobo: subtotal - discount + delivery,
    discountCode, discountError,
    freeDeliveryRemainingKobo: cfg.freeOverKobo > 0 ? Math.max(0, cfg.freeOverKobo - (subtotal - discount)) : 0,
  };
}

export async function getCartDTO(opts: { code?: string | null; state?: string | null } = {}): Promise<CartDTO> {
  const id = await resolveCart(false);
  return priceCart(id ? await loadCartItems(id) : [], opts);
}

export const MAX_CART_QTY = MAX_QTY;
