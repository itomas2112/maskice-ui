export type Product = {
  id: string;
  name: string;
  compat: Compat;
  price_cents: number;
  colors: string[];
  imageByColor: Record<string, string>;
  productIdByColor: Record<string, string>;
  defaultColor: string;
  type: string;   // ← NEW
  phone: string;  // ← NEW
};

export type Compat = "iPhone 16" | "iPhone 16 Pro";

export type BackendProduct = {
  id: string;
  name: string;
  compat: Compat;
  price_cents: number;
  type: string;
  phone: string;
  variants: { product_id: string; colors: string; image: string, quantity: number }[];
};

export type CartItem = {
  model: Compat;
  color: string;
  qty: number;
  productId: string;
};

export type QuickState = { product: Product; color: string } | null;