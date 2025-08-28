"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import API from "@/lib/api"; // your axios instance

// ---------- Types (match your backend) ----------
// ---------- Types (match new backend) ----------
export type CartItemIn = {
  product_id: string;
  color: string;
  model: string;   // no more Literal, backend accepts any string
  qty: number;
};

export type CartLineOut = {
  product_id: string;
  color: string;
  model: string;
  qty: number;
  name: string;
  unit_price_cents: number;
  line_total_cents: number;
};

export type CartSummaryOut = {
  items: CartLineOut[];
  subtotal_cents: number;   // products total
  shipping_cents: number;   // delivery
  total_cents: number;      // subtotal + shipping
};


// ---------- cart_id cookie ----------
function getOrCreateCartId(): string {
  if (typeof document === "undefined") return ""; // SSR guard
  const m = document.cookie.match(/(?:^|;\s*)cart_id=([A-Za-z0-9]{32})/);
  if (m?.[1]) return m[1];

  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const id = Array.from(bytes, b => alphabet[b % alphabet.length]).join("");
  document.cookie = `cart_id=${id}; Path=/; Max-Age=31536000; SameSite=Lax`;
  return id;
}

// If you prefer, you can move this into a request interceptor globally.
// Kept inline here to avoid changing your API instance file.
function withCartHeaders(cartId: string) {
  return { headers: { "X-Cart-Id": cartId } };
}

// ---------- Hook ----------
export function useCart() {
  const cartId = useMemo(getOrCreateCartId, []);
  const [data, setData] = useState<CartSummaryOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    if (!cartId) return;
    setLoading(true);
    try {
      const res = await API.get<CartSummaryOut>("/cart", withCartHeaders(cartId));
      setData(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || "Failed to load cart");
    } finally {
      setLoading(false);
    }
  }, [cartId]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  // --- Mutations ---
  const add = useCallback(
    async (item: CartItemIn) => {
      await API.post("/cart/items", item, withCartHeaders(cartId));
      await fetchCart();
    },
    [cartId, fetchCart]
  );

  const setQty = useCallback(
    async (item: CartItemIn) => {
      await API.patch("/cart/items", item, withCartHeaders(cartId));
      await fetchCart();
    },
    [cartId, fetchCart]
  );

  const remove = useCallback(
    async (item: Omit<CartItemIn, "qty">) => {
      await API.delete(
        `/cart/items/${item.product_id}/${item.color}/${item.model}`,
        { ...withCartHeaders(cartId) } // wrap as config object
      );
      await fetchCart();
    },
    [cartId, fetchCart]
  );

  const clear = useCallback(async () => {
    await API.delete("/cart", withCartHeaders(cartId));
    await fetchCart();
  }, [cartId, fetchCart]);

  return {
    cart: data,
    isLoading: loading,
    error,
    refresh: fetchCart,
    add,
    setQty,
    remove,
    clear,
    itemCount: data?.items?.reduce((acc, it) => acc + it.qty, 0) ?? 0,
  };
}

