import { z } from "zod";

export const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(254);

/** Accepts 08012345678, 8012345678, 2348012345678, +2348012345678 -> stores +2348012345678 */
export const nigerianPhone = z
  .string()
  .trim()
  .transform((s) => s.replace(/[\s-]/g, ""))
  .refine((s) => /^(\+234|234|0)?[789][01]\d{8}$/.test(s), "Enter a valid Nigerian phone number")
  .transform((s) => "+234" + s.replace(/^(\+234|234|0)/, ""));

export const customerPassword = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(128)
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/\d/, "Include at least one number");

export const adminPassword = z
  .string()
  .min(12, "Use at least 12 characters")
  .max(128)
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/\d/, "Include a number")
  .regex(/[^A-Za-z0-9]/, "Include a symbol");

export const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name").max(100),
    email,
    phone: nigerianPhone,
    password: customerPassword,
    confirmPassword: z.string(),
    acceptedTerms: z.literal(true, { errorMap: () => ({ message: "You must accept the Terms & Privacy Policy" }) }),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match" });

export const loginSchema = z.object({ email, password: z.string().min(1).max(128) });
export const tokenSchema = z.object({ token: z.string().min(20).max(200) });
export const emailOnlySchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ token: z.string().min(20).max(200), password: customerPassword, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match" });

export const adminLoginSchema = z.object({ email, password: z.string().min(1).max(128) });
export const totpSchema = z.object({ code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code") });

export const SKIN_TYPES = ["normal", "dry", "oily", "combination", "sensitive", "not_sure"] as const;
export const INTERESTS = ["skincare", "makeup", "hair_care", "body_care", "fragrance"] as const;
export const GOALS = [
  "hydration", "brightening", "acne_care", "anti_aging", "even_skin_tone", "hair_growth", "sun_protection",
] as const;

export const preferencesSchema = z.object({
  skinType: z.enum(SKIN_TYPES),
  interests: z.array(z.enum(INTERESTS)).max(INTERESTS.length),
  goals: z.array(z.enum(GOALS)).max(GOALS.length),
});
