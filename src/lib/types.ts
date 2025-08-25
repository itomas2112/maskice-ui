export type Compat = "iPhone 16" | "iPhone 16 Pro";

export type Product = {
  id: string;
  name: string;
  compat: Compat;
  price_cents: number;
  colors: string[];
  imageByColor: Record<string, string>;
  productIdByColor: Record<string, string>;
  defaultColor: string;
  type: string;   // kept
  phone: string;  // kept
};

/** Per-color stock map */
export type QuantityByColor = Record<string, number>;

/** Product with stock info (frontend-enriched) */
export type ProductWithStock = Product & { quantityByColor: QuantityByColor };

export type BackendProduct = {
  id: string;
  name: string;
  compat: Compat;
  price_cents: number;
  type: string;
  phone: string;
  variants: { product_id: string; colors: string; image: string; quantity: number }[];
};

export type CartItem = {
  model: Compat;
  color: string;
  qty: number;
  productId: string;
};

export type QuickState = { product: ProductWithStock; color: string } | null;
