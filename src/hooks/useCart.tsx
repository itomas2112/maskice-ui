"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import API from "@/lib/api"; // your axios instance

// ---------- Types (match your backend) ----------
export type CartItemIn = {
  product_id: string;
  color: string;
  model: "iPhone 16" | "iPhone 16 Pro"; // adjust if you add more
  qty: number;
};

export type QuoteItem = CartItemIn & {
  name: string;
  unit_price_cents: number;
  line_total_cents: number;
};

export type QuoteOut = {
  items: QuoteItem[];
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
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
  const [data, setData] = useState<QuoteOut | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    if (!cartId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await API.get<QuoteOut>("/cart", withCartHeaders(cartId));
      setData(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || "Failed to load cart");
    } finally {
      setLoading(false);
    }
  }, [cartId]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // --- Mutations (simple: call backend, then refresh) ---
  const add = useCallback(
    async (item: Omit<CartItemIn, "qty"> & { qty?: number }) => {
      const body = { action: "add", ...item, qty: item.qty ?? 1 };
      await API.patch<QuoteOut>("/cart/items", body, withCartHeaders(cartId));
      await fetchCart();
    },
    [cartId, fetchCart]
  );

  const setQty = useCallback(
    async (item: CartItemIn) => {
      const body = { action: "set", ...item };
      await API.patch<QuoteOut>("/cart/items", body, withCartHeaders(cartId));
      await fetchCart();
    },
    [cartId, fetchCart]
  );

  const remove = useCallback(
    async (item: Omit<CartItemIn, "qty">) => {
      const body = { action: "remove", ...item, qty: 0 };
      await API.patch<QuoteOut>("/cart/items", body, withCartHeaders(cartId));
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
    // convenience:
    itemCount:
      data?.items?.reduce((acc, it) => acc + (Number.isFinite(it.qty) ? it.qty : 0), 0) ?? 0,
  };
}
