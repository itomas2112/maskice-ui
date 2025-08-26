// app/liked/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { useShop } from "@/contexts/shop";
import {useCatalogFilters} from "@/hooks/useCatalogFilters";

export default function LikedPage() {
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const { addToCart, setQuick, cart, setCartOpen } = useShop();
  const { products, loading } = useCatalogFilters()
  
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

  const likedProducts = useMemo(
    () => products.filter((p) => likedIds.includes(p.id)),
    [products, likedIds]
  );

  const clearFavorites = () => {
    localStorage.setItem("likedProducts", JSON.stringify([]));
    setLikedIds([]);
  };
  
  const {
    type, setType, setPhone,
    availablePhones,
  } = useCatalogFilters();
  
  return (
    <div className="min-h-screen bg-white">
      <Header
        cartCount={cartCount}
        setCartOpen={setCartOpen}
        setType={setType}
        availablePhones={availablePhones}
        setPhone={setPhone}
        type={type}
      />
      
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
