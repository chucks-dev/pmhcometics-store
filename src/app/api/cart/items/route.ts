import { z } from "zod";
import { getCartDTO, MAX_CART_QTY, resolveCart } from "@/server/cart";
import { query } from "@/server/db/client";
import { HttpError, ok, parseJson, route } from "@/server/http";

const schema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(MAX_CART_QTY).default(1),
});

export const POST = route(async (req) => {
  const { productId, quantity: parsedQuantity } = await parseJson(req, schema);
  const quantity = parsedQuantity ?? 1;

  const [p] = await query<{ stock: number }>(
    `SELECT stock FROM products WHERE id = $1 AND status = 'published' AND deleted_at IS NULL`,
    [productId]
  );

  if (!p) throw new HttpError(404, "This product is no longer available.");
  if (p.stock <= 0) throw new HttpError(409, "Sorry, this item is out of stock.", "OUT_OF_STOCK");

  const cartId = (await resolveCart(true))!;
  const [existing] = await query<{ quantity: number }>(
    `SELECT quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2`,
    [cartId, productId]
  );

  const next = Math.min(
    (existing?.quantity ?? 0) + quantity,
    p.stock,
    MAX_CART_QTY
  );

  await query(
    `INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1,$2,$3)
     ON CONFLICT (cart_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity`,
    [cartId, productId, next]
  );

  await query(`UPDATE carts SET updated_at = now() WHERE id = $1`, [cartId]);

  return ok({
    cart: await getCartDTO(),
    capped: next < (existing?.quantity ?? 0) + quantity,
  });
});
