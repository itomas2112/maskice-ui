"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type {
  Compat,
  Product,
  BackendProduct,
  CartItem,
  ProductWithStock,
  QuickState, // if you kept this in types, remove this import
} from "@/lib/types";

type ShopContextType = {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  cartOpen: boolean;
  setCartOpen: React.Dispatch<React.SetStateAction<boolean>>;
  quick: { product: ProductWithStock; color: string } | null;
  setQuick: React.Dispatch<React.SetStateAction<{ product: ProductWithStock; color: string } | null>>;
  addToCart: (p: Product, color: string, qty?: number, modelOverride?: Compat) => void;
  normalize: (bp: BackendProduct) => Product | null;
};

const ShopContext = createContext<ShopContextType | undefined>(undefined);

// storage keys + basic schema versioning
const CART_KEY = "shop.cart.v1";
const CARTOPEN_KEY = "shop.cartOpen.v1";

// If you add more models later, extend this list.
const COMPAT_VALUES: readonly Compat[] = ["iPhone 16", "iPhone 16 Pro"] as const;

function isCompat(v: unknown): v is Compat {
  return typeof v === "string" && (COMPAT_VALUES as readonly string[]).includes(v);
}

function isCartItemLike(x: unknown): x is CartItem {
  if (!x || typeof x !== "object") return false;
  const obj = x as Record<string, unknown>;
  return (
    typeof obj.productId === "string" &&
    typeof obj.color === "string" &&
    typeof obj.qty === "number" &&
    obj.qty > 0 &&
    isCompat(obj.model)
  );
}

const fixPublicPath = (p: string) => p.replace(/^\/public(\/|$)/, "/");

const normalize = (bp: BackendProduct): Product | null => {
  const compat = bp.compat as Compat;
  if (!["iPhone 16", "iPhone 16 Pro"].includes(bp.compat)) return null;

  const imageByColor: Record<string, string> = {};
  const productIdByColor: Record<string, string> = {};
  const colors: string[] = [];

  for (const v of bp.variants ?? []) {
    imageByColor[v.colors] = fixPublicPath(v.image);
    productIdByColor["id"] = String(v.product_id);
    colors.push(v.colors);
  }

  const defaultColor = colors[0] ?? "Default";

  return {
    id: bp.id,
    name: bp.name,
    compat,
    price_cents: bp.price_cents,
    colors,
    imageByColor,
    productIdByColor,
    defaultColor,
    type: bp.type,
    phone: bp.phone,
  };
};

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [quick, setQuick] = useState<{ product: ProductWithStock; color: string } | null>(null);

  // hydrate from localStorage
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(CART_KEY) : null;
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const sane = parsed.filter(isCartItemLike);
          if (sane.length) setCart(sane);
        }
      }
      const openRaw = typeof window !== "undefined" ? localStorage.getItem(CARTOPEN_KEY) : null;
      if (openRaw) setCartOpen(JSON.parse(openRaw) === true);
    } catch {}
  }, []);

  // persist cart (debounced)
  const saveTimeout = useRef<number | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (saveTimeout.current) window.clearTimeout(saveTimeout.current);
    saveTimeout.current = window.setTimeout(() => {
      try {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
      } catch {}
    }, 120);
    return () => {
      if (saveTimeout.current) window.clearTimeout(saveTimeout.current);
    };
  }, [cart]);

  // persist cartOpen
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(CARTOPEN_KEY, JSON.stringify(cartOpen));
    } catch {}
  }, [cartOpen]);

  // cross-tab sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_KEY && e.newValue) {
        try {
          const next: unknown = JSON.parse(e.newValue);
          if (Array.isArray(next)) {
            const sane = next.filter(isCartItemLike);
            setCart(sane);
          }
        } catch {}
      }
      if (e.key === CARTOPEN_KEY && e.newValue) {
        try {
          setCartOpen(JSON.parse(e.newValue) === true);
        } catch {
          setCartOpen(e.newValue === "true");
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addToCart = (p: Product, color: string, qty: number = 1, modelOverride?: Compat) => {
    if (qty <= 0) return;
    const model: Compat = modelOverride ?? p.compat;
    const dbId = p.productIdByColor[color] ?? p.productIdByColor[p.defaultColor];
    if (!dbId) return;

    setCart((c) => {
      const idx = c.findIndex((x) => x.productId === dbId && x.model === model && x.color === color);
      if (idx !== -1) {
        const next = [...c];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      return [...c, { model, color, qty, productId: dbId }];
    });
  };

  const value = useMemo(
    () => ({ cart, setCart, cartOpen, setCartOpen, quick, setQuick, addToCart, normalize }),
    [cart, cartOpen, quick]
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop(): ShopContextType {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used within <ShopProvider>");
  return ctx;
}

export function useCartCount(): number {
  const { cart } = useShop();
  return useMemo(() => cart.reduce((s, it) => s + it.qty, 0), [cart]);
}
