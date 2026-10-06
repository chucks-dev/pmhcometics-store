import { z } from "zod";
import { SKIN_TYPES } from "./auth";

export const productSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(5000).optional().nullable(),
  categoryId: z.string().uuid(),
  brand: z.string().trim().max(80).optional().nullable(),
  sku: z.string().trim().min(2).max(60),
  priceNaira: z.number().positive().max(100_000_000),
  discountPriceNaira: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0).max(1_000_000),
  lowStockThreshold: z.number().int().min(0).max(10_000).default(5),
  ingredients: z.string().trim().max(5000).optional().nullable(),
  benefits: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
  howToUse: z.string().trim().max(3000).optional().nullable(),
  skinTypes: z.array(z.enum(SKIN_TYPES)).default([]),
  status: z.enum(["draft", "published"]),
  isFeatured: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  images: z.array(z.object({ url: z.string().url().max(500), alt: z.string().max(200).optional().nullable() })).max(10).default([]),
}).refine((d) => d.discountPriceNaira == null || d.discountPriceNaira < d.priceNaira, {
  path: ["discountPriceNaira"], message: "Discount price must be lower than the price",
});
export type ProductInput = z.infer<typeof productSchema>;
