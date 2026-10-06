export type StockStatus = "in" | "low" | "out";
export const stockStatus = (stock: number, threshold: number): StockStatus =>
  stock <= 0 ? "out" : stock <= threshold ? "low" : "in";
export const STOCK_LABEL: Record<StockStatus, string> = { in: "In stock", low: "Low stock", out: "Out of stock" };
