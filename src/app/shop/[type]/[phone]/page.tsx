// src/app/page.tsx
"use client";

import { Header } from "@/components/layout/Header";
import { ProductCard } from "@/components/ProductCard";
import { useShop } from "@/contexts/shop";
import type { Compat } from "@/lib/types";
import { useCatalogFilters } from "@/hooks/useCatalogFilters";
import { Drawer } from "@/components/Drawer";
import { PageFooter } from "@/components/layout/Footer";
import React from "react";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-bold">{children}</h2>;
}

/** Simple skeleton block with subtle shimmer */
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

/** Grid of skeleton "cards" while products are loading */
function LoadingGrid({ count = 9 }: { count?: number }) {
  const items = Array.from({ length: count });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-2" role="status" aria-live="polite">
      {items.map((_, i) => (
        <div key={i} className="max-w-[420px] w-full mx-auto">
          <div className="rounded-2xl border bg-white shadow-sm p-4">
            {/* Image area */}
            <SkeletonBlock className="aspect-[3/4]" />
            {/* Text rows */}
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

      {/* Shimmer keyframes once per page */}
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

export default function Page() {
  const { quick, setQuick, setCartOpen } = useShop();

  const {
    model, setModel,
    type, setType,
    setPhone,
    filtered,
    availableModels,
    availablePhones,
    loading
  } = useCatalogFilters();

  return (
    <div id="top" className="min-h-screen text-gray-900 bg-gradient-to-br from-amber-50 via-white to-emerald-50">
      {/* Zaglavlje */}
      <Header
        setCartOpen={setCartOpen}
        setType={setType}
        availablePhones={availablePhones}
        setPhone={setPhone}
        type={type}
      />

      <main className="max-w-7xl mx-auto px-4 py-20 md:py-28 space-y-16">
        {/* Katalog s izborom modela */}
        <section id="catalog" className="space-y-4 scroll-mt-24 md:scroll-mt-28">
          <SectionTitle>Istraži ponudu</SectionTitle>
          <div className="grid sm:grid-cols-3 gap-4 items-end">
            <div className="sm:col-span-1">
              <label className="text-sm">Odaberi model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value as Compat)}
                className="mt-1 w-full px-3 py-2 rounded-lg border"
                aria-busy={loading ? "true" : "false"}
              >
                {availableModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Loading state for catalog */}
          {loading ? (
            <LoadingGrid count={9} />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
                {filtered.map((p) => (
                  <div key={p.id} className="max-w-[420px] w-full mx-auto">
                    <ProductCard
                      product={p}
                      onQuickView={(prod, color) => setQuick({ product: prod, color })}
                    />
                  </div>
                ))}
              </div>
              {!filtered.length && (
                <div className="col-span-full text-center text-gray-600 border rounded-lg p-10">
                  Nema rezultata.
                </div>
              )}
            </>
          )}
        </section>

        {/* Brzi pregled */}
        <Drawer quick={quick} setQuick={setQuick} />
      </main>

      <PageFooter />
    </div>
  );
}
