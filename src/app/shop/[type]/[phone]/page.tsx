// src/app/page.tsx
"use client";

import { Header } from "@/components/layout/Header";
import { ProductCard } from "@/components/ProductCard";
import { useShop } from "@/contexts/shop";
import type { Compat } from "@/lib/types";
import { useCatalogFilters } from "@/hooks/useCatalogFilters";
import {Drawer} from "@/components/Drawer";
import {PageFooter} from "@/components/layout/Footer";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-bold">{children}</h2>;
}

export default function Page() {
  const { quick, setQuick, setCartOpen } = useShop();
  
  const {
    model, setModel,
    type, setType,
    setPhone,
    filtered,
    availableModels,
    availablePhones
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
              >
                {availableModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
            {filtered.map((p) => (
              <div key={p.id} className="max-w-[420px] w-full mx-auto">
                <ProductCard
                  product={p}
                  onQuickView={(prod, color) => setQuick({ product: prod, color })}
                />
              </div>
            ))}
            {!filtered.length && (
              <div className="col-span-full text-center text-gray-600 border rounded-lg p-10">Nema rezultata.</div>
            )}
          </div>
        </section>
        <Drawer
          quick={quick}
          setQuick={setQuick}
        />
      </main>

      <PageFooter />
    </div>
  );
}
