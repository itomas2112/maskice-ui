"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type {
  Compat,
  Product,
  BackendProduct,
  CartItem,
  ProductWithStock,
} from "@/lib/types";

type ShopContextType = {
  cartOpen: boolean;
  setCartOpen: React.Dispatch<React.SetStateAction<boolean>>;
  quick: { product: ProductWithStock; color: string } | null;
  setQuick: React.Dispatch<React.SetStateAction<{ product: ProductWithStock; color: string } | null>>;
  normalize: (bp: BackendProduct) => Product | null;
};

const ShopContext = createContext<ShopContextType | undefined>(undefined);

// storage keys + basic schema versioning
const CART_KEY = "shop.cart.v1";
const CARTOPEN_KEY = "shop.cartOpen.v1";

// If you add more models later, extend this list.
const COMPAT_VALUES: readonly Compat[] = []; // or any list you want

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
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [quick, setQuick] = useState<{ product: ProductWithStock; color: string } | null>(null);
  
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

  const value = useMemo(
    () => ({ cartOpen, setCartOpen, quick, setQuick, normalize }),
    [cartOpen, quick]
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop(): ShopContextType {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used within <ShopProvider>");
  return ctx;
}