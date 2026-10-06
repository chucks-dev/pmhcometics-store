export const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta",
  "Ebonyi","Edo","Ekiti","Enugu","FCT (Abuja)","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina",
  "Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers",
  "Sokoto","Taraba","Yobe","Zamfara",
] as const;

export const SKIN_TYPE_OPTIONS = [
  { value: "normal", label: "Normal" }, { value: "dry", label: "Dry" }, { value: "oily", label: "Oily" },
  { value: "combination", label: "Combination" }, { value: "sensitive", label: "Sensitive" },
  { value: "not_sure", label: "Not sure" },
] as const;

export const INTEREST_OPTIONS = [
  { value: "skincare", label: "Skincare" }, { value: "makeup", label: "Makeup" },
  { value: "hair_care", label: "Hair Care" }, { value: "body_care", label: "Body Care" },
  { value: "fragrance", label: "Fragrance" },
] as const;

export const GOAL_OPTIONS = [
  { value: "hydration", label: "Hydration" }, { value: "brightening", label: "Brightening" },
  { value: "acne_care", label: "Acne care" }, { value: "anti_aging", label: "Anti-aging" },
  { value: "even_skin_tone", label: "Even skin tone" }, { value: "hair_growth", label: "Hair growth" },
  { value: "sun_protection", label: "Sun protection" },
] as const;

/** Customer-facing tracking steps, in order. */
export const ORDER_STEPS = [
  { status: "confirmed", label: "Order confirmed" },
  { status: "payment_confirmed", label: "Payment confirmed" },
  { status: "processing", label: "Processing" },
  { status: "shipped", label: "Shipped" },
  { status: "out_for_delivery", label: "Out for delivery" },
  { status: "delivered", label: "Delivered" },
] as const;

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending_payment: "Awaiting payment", confirmed: "Order confirmed", payment_confirmed: "Payment confirmed",
  processing: "Processing", shipped: "Shipped", out_for_delivery: "Out for delivery",
  delivered: "Delivered", cancelled: "Cancelled", refunded: "Refunded",
};

export const DEFAULT_DELIVERY = { lagosKobo: 250_000, otherKobo: 400_000, freeOverKobo: 5_000_000 };
