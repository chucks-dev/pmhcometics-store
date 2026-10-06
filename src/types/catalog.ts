import type { StockStatus } from "@/lib/stock";

export interface ProductCardDTO {
  id: string; slug: string; name: string; brand: string | null;
  priceKobo: number; discountPriceKobo: number | null; currentKobo: number; discountPercent: number;
  image: string | null; rating: number; reviewCount: number;
  stock: number; stockStatus: StockStatus; categoryName: string; categorySlug: string;
  isNew: boolean; isBestSeller: boolean;
}

export interface ProductDetailDTO extends ProductCardDTO {
  description: string | null; benefits: string[]; ingredients: string | null; howToUse: string | null;
  skinTypes: string[]; images: { url: string; alt: string | null }[]; sku: string;
}

export interface ReviewDTO { id: string; rating: number; title: string | null; body: string | null; author: string; createdAt: string; productName?: string; verified: boolean }

export interface CartItemDTO {
  productId: string; slug: string; name: string; brand: string | null; image: string | null;
  unitKobo: number; originalKobo: number; quantity: number; stock: number; available: boolean; lineKobo: number;
}
export interface CartDTO {
  items: CartItemDTO[]; count: number;
  subtotalKobo: number; deliveryKobo: number; discountKobo: number; totalKobo: number;
  discountCode: string | null; discountError: string | null; freeDeliveryRemainingKobo: number;
}
