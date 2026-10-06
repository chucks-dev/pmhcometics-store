import { z } from "zod";
import { NIGERIAN_STATES } from "@/lib/constants";
import { nigerianPhone } from "./auth";

export const addressSchema = z.object({
  label: z.string().trim().max(40).optional().nullable(),
  fullName: z.string().trim().min(2).max(100), phone: nigerianPhone,
  state: z.enum(NIGERIAN_STATES), city: z.string().trim().min(2).max(80),
  street: z.string().trim().min(5).max(200), additionalInfo: z.string().trim().max(300).optional().nullable(),
  isDefault: z.boolean().optional(),
});
