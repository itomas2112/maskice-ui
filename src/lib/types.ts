export type Product = {
  id: string; // keep backend group id for UI
  name: string;
  compat: Compat;
  price_cents: number;
  colors: string[];
  imageByColor: Record<string, string>;
  productIdByColor: Record<string, string>; // <-- NEW: color -> DB product_id
  defaultColor: string;
};

export type Compat = "iPhone 16" | "iPhone 16 Pro";

export type BackendProduct = {
  id: string;                // UI slug from backend (keep for grouping)
  name: string;
  compat: string;
  price_cents: number;
  variants: {                // each color variant now carries the DB id
    product_id: string;      // <-- NEW
    colors: string;
    image: string;
  }[];
};

export type CartItem = {
  model: Compat;
  color: string;
  qty: number;
  productId: string;
};

export type QuickState = { product: Product; color: string } | null;