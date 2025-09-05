// app/liked/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { useShop } from "@/contexts/shop";
import { useCatalogFilters } from "@/hooks/useCatalogFilters";
import { Drawer } from "@/components/Drawer";

/** Skeleton shimmer block */
function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-xl bg-gray-200/80",
        "after:absolute after:inset-0 after:-translate-x-full",
        "after:animate-[shimmer_2s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/50 after:to-transparent",
        className,
      ].join(" ")}
      aria-hidden="true"
    />
  );
}

/** Grid of skeleton "cards" */
function LoadingGrid({ count = 6 }: { count?: number }) {
  const items = Array.from({ length: count });
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-2"
      role="status"
      aria-live="polite"
    >
      {items.map((_, i) => (
        <div key={i} className="max-w-[420px] w-full mx-auto">
          <div className="rounded-2xl border bg-white shadow-sm p-4">
            {/* Image placeholder */}
            <SkeletonBlock className="aspect-[3/4]" />
            {/* Text placeholders */}
            <div className="mt-4 space-y-3">
              <SkeletonBlock className="h-5 w-3/4" />
              <SkeletonBlock className="h-4 w-1/2" />
              <div className="flex gap-2 pt-2">
                <SkeletonBlock className="h-8 w-24" />
                <SkeletonBlock className="h-8 w-16" />
              </div>
            </div>
          </div>
        </div>
      ))}
      <style jsx global>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

export default function LikedPage() {
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const { quick, setQuick, setCartOpen } = useShop();
  const { products, loading, type, setType, setPhone, availablePhones } = useCatalogFilters();

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

  return (
    <div className="min-h-screen bg-white">
      <Header
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
          <LoadingGrid count={6} />
        ) : likedProducts.length === 0 ? (
          <div className="text-gray-600">
            You haven’t liked any products yet. Go back and tap the heart on a product to save it here.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
            {likedProducts.map((p) => (
              <div key={p.id} className="max-w-[420px] w-full mx-auto">
                <ProductCard
                  product={p}
                  onQuickView={(prod, color) => setQuick({ product: prod, color })}
                />
              </div>
            ))}
          </div>
        )}

        <Drawer quick={quick} setQuick={setQuick} />
      </main>
    </div>
  );
}
