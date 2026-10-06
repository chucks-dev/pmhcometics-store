import { z } from "zod";
import { listProducts } from "@/server/catalog";
import { ok, route } from "@/server/http";

const num = z.coerce.number().optional();
const schema = z.object({
  q: z.string().max(100).optional(), category: z.string().max(60).optional(),
  minPrice: num, maxPrice: num, minRating: num, skinType: z.string().max(20).optional(),
  sort: z.string().max(20).optional(), page: num, pageSize: num,
  brand: z.string().max(300).optional(), inStock: z.string().optional(),
});

export const GET = route(async (req) => {
  const p = schema.parse(Object.fromEntries(req.nextUrl.searchParams));
  const data = await listProducts({
    ...p, brands: p.brand ? p.brand.split(",") : undefined, inStock: p.inStock === "1",
  });
  return ok(data);
});
