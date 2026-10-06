import { z } from "zod";
import { getCartDTO, MAX_CART_QTY, resolveCart } from "@/server/cart";
import { query } from "@/server/db/client";
import { ok, parseJson, route } from "@/server/http";

type Ctx = { params: Promise<{ productId: string }> };

export const PATCH = route<Ctx>(async (req, { params }) => {
  const { productId } = await params;
  const { quantity } = await parseJson(req, z.object({ quantity: z.number().int().min(1).max(MAX_CART_QTY) }));
  const cartId = await resolveCart(false);
  if (cartId) {
    await query(
      `UPDATE cart_items SET quantity = LEAST($3, GREATEST(1, (SELECT stock FROM products WHERE id = $2)))
        WHERE cart_id = $1 AND product_id = $2`, [cartId, productId, quantity]);
  }
  return ok({ cart: await getCartDTO() });
});

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const { productId } = await params;
  const cartId = await resolveCart(false);
  if (cartId) await query(`DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2`, [cartId, productId]);
  return ok({ cart: await getCartDTO() });
});
