import { z } from "zod";

export const discountSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/, "3-30 letters, numbers, - or _"),
  type: z.enum(["percentage", "fixed"]),
  value: z.number().positive(),                 // percent, or naira for fixed
  minOrderNaira: z.number().min(0).default(0),
  maxDiscountNaira: z.number().positive().optional().nullable(),
  startsAt: z.string().datetime({ offset: true }).optional().nullable(),
  expiresAt: z.string().datetime({ offset: true }).optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().default(true),
}).refine((d) => d.type !== "percentage" || d.value <= 100, { path: ["value"], message: "Percentage can't exceed 100" });
