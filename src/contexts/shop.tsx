// src/contexts/shop.tsx
"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Compat, Product } from "@/lib/types";

export type CartItem = { model: Compat; color: string; qty: number; productId: string };
export type QuickState = { product: Product; color: string } | null;

type ShopContextType = {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  cartOpen: boolean;
  setCartOpen: React.Dispatch<React.SetStateAction<boolean>>;
  quick: QuickState;
  setQuick: React.Dispatch<React.SetStateAction<QuickState>>;
  addToCart: (p: Product, color: string, qty?: number, modelOverride?: Compat) => void;
};

const ShopContext = createContext<ShopContextType | undefined>(undefined);

// storage keys + basic schema versioning (handy if you change the shape later)
const CART_KEY = "shop.cart.v1";
const CARTOPEN_KEY = "shop.cartOpen.v1";

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [quick, setQuick] = useState<QuickState>(null);

  // --- hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(CART_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          // minimal validation
          const sane = parsed.filter(
            (x) =>
              x &&
              typeof x === "object" &&
              typeof (x as any).productId === "string" &&
              typeof (x as any).color === "string" &&
              typeof (x as any).qty === "number" &&
              (x as any).qty > 0 &&
              (["iPhone 16", "iPhone 16 Pro"] as const).includes((x as any).model)
          ) as CartItem[];
          if (sane.length) setCart(sane);
        }
      }
      const openRaw = typeof window !== "undefined" ? localStorage.getItem(CARTOPEN_KEY) : null;
      if (openRaw) setCartOpen(JSON.parse(openRaw) === true);
    } catch {
      // ignore corrupt storage
    }
  }, []);

  // --- persist to localStorage whenever cart changes
  const saveTimeout = useRef<number | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    // small debounce to avoid spam during rapid +/- clicks
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

  // persist cartOpen (optional)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(CARTOPEN_KEY, JSON.stringify(cartOpen));
    } catch {}
  }, [cartOpen]);

  // --- cross-tab sync (so adding in one tab updates others)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_KEY && e.newValue) {
        try {
          const next = JSON.parse(e.newValue);
          if (Array.isArray(next)) setCart(next as CartItem[]);
        } catch {}
      }
      if (e.key === CARTOPEN_KEY && e.newValue) {
        setCartOpen(e.newValue === "true");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addToCart = (p: Product, color: string, qty: number = 1, modelOverride?: Compat) => {
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
    () => ({ cart, setCart, cartOpen, setCartOpen, quick, setQuick, addToCart }),
    [cart, cartOpen, quick]
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop(): ShopContextType {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used within <ShopProvider>");
  return ctx;
}

// convenience
export function useCartCount(): number {
  const { cart } = useShop();
  return useMemo(() => cart.reduce((s, it) => s + it.qty, 0), [cart]);
}
