// app/liked/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import API from "@/lib/api";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { Product, BackendProduct, Compat } from "@/lib/types";
import { useShop } from "@/contexts/shop";

const fixPublicPath = (p: string) => p.replace(/^\/public(\/|$)/, "/");

const normalize = (bp: BackendProduct): Product | null => {
  const compat = bp.compat as Compat;
  if (!["iPhone 16", "iPhone 16 Pro"].includes(bp.compat)) return null;

  const imageByColor: Record<string, string> = {};
  const productIdByColor: Record<string, string> = {};
  const colors: string[] = [];
  

  for (const v of bp.variants ?? []) {
    const img = fixPublicPath(v.image);
    imageByColor[v.colors] = img;
    productIdByColor[v.colors] = String(v.product_id); // normalize to string
    colors.push(v.colors);
  }

  const defaultColor = colors[0] ?? "Default";

  return {
    id: bp.id, // keep group id; NOT the DB id
    name: bp.name,
    compat,
    price_cents: bp.price_cents,
    colors,
    imageByColor,
    productIdByColor, // <-- NEW
    defaultColor,
  };
};


export default function LikedPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, setQuick, cart, setCartOpen } = useShop();
  
  const cartCount = useMemo(() => cart.reduce((s, it) => s + it.qty, 0), [cart]);

  // load liked ids
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("likedProducts") || "[]");
      setLikedIds(Array.isArray(stored) ? stored : []);
    } catch {
      setLikedIds([]);
    }
  }, []);

  // fetch all products
  useEffect(() => {
    let alive = true;
  
    API.get<BackendProduct[]>("/products")
      .then((res) => {
        const normalized: Product[] = (res.data ?? [])
          .map(normalize)                       // your existing normalizer
          .filter((x): x is Product => !!x);    // keep only valid
        if (alive) setAllProducts(normalized);
      })
      .catch((err) => {
        console.error("Error loading products", err);
        if (alive) setAllProducts([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
  
    return () => {
      alive = false;
    };
  }, []);

  const likedProducts = useMemo(
    () => allProducts.filter((p) => likedIds.includes(p.id)),
    [allProducts, likedIds]
  );

  const clearFavorites = () => {
    localStorage.setItem("likedProducts", JSON.stringify([]));
    setLikedIds([]);
  };

  // no-op handlers to satisfy ProductCard props; you can wire these to your cart/quickview later
  const noopAdd = () => {};
  const noopQuick = () => {};
  console.log(likedProducts)
  return (
    <div className="min-h-screen bg-white">
      <Header cartCount={cartCount} showBasket={true} setCartOpen={setCartOpen} />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Favorites</h1>
          {likedIds.length > 0 && (
            <Button variant="outline" onClick={clearFavorites} className="cursor-pointer">
              Clear favorites
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-gray-600">Loading…</div>
        ) : likedProducts.length === 0 ? (
          <div className="text-gray-600">
            You haven’t liked any products yet. Go back and tap the heart on a product to save it here.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
            {likedProducts.map((p) => (
              <div key={p.id} className="max-w-[420px] w-full mx-auto">
                {/* ⬅️ NEW wrapper */}
                <ProductCard
                  product={p}
                  model={p.compat}
                  onAdd={(prod, color, qty) => addToCart(prod, color, qty)}
                  onQuickView={(prod, color, qty) => setQuick({ product: prod, color })}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
