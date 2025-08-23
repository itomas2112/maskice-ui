// src/app/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import API from "@/lib/api";
import { Header } from "@/components/layout/Header";
import { ProductCard } from "@/components/ProductCard";
import { useShop, useCartCount } from "@/contexts/shop";
import type { Compat, Product, BackendProduct } from "@/lib/types";
import { useCatalogFilters } from "@/hooks/useCatalogFilters";

const EUR = (n: number) =>
  new Intl.NumberFormat("hr-HR", { style: "currency", currency: "EUR" }).format(n);
const BASE_PRICE = 3.0;

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-bold">{children}</h2>;
}

// --------- Lokalni Drawer za "Brzi pregled" ---------
function Drawer({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className={`fixed inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/30 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow border-l transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="px-2 py-1 rounded-md border cursor-pointer">
            Zatvori
          </button>
        </div>
        <div className="p-4 overflow-y-auto h-[calc(100%-56px)]">{children}</div>
      </aside>
    </div>
  );
}

export default function Page() {
  const { addToCart, quick, setQuick, setCartOpen, normalize } = useShop();
  const cartCount = useCartCount();
  
  const [width, setWidth] = useState<number>(0);
  

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = width < 980;

  const goTop = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  
  const {
    model, setModel,
    type, setType,
    phone, setPhone,
    filtered,
    availableModels,
    availableTypes,
    availablePhones,
    products
  } = useCatalogFilters();
  
  return (
    <div id="top" className="min-h-screen text-gray-900 bg-gradient-to-br from-amber-50 via-white to-emerald-50">
      {/* Zaglavlje */}
      <Header
        cartCount={cartCount}
        setCartOpen={setCartOpen}
        setType={setType}
        availablePhones={availablePhones}
        setPhone={setPhone}
        type={type}
      />

      <main className="max-w-7xl mx-auto px-4 py-20 md:py-28 space-y-16">
        {/* Hero */}
        <section
          className={`flex gap-10 md:gap-14 min-h-[30vh] ${
            !isMobile ? "flex-row justify-between" : "flex-col"
          } items-center`}
        >
          {/* Text – left or top */}
          <div
            className={`w-full flex-1 ${!isMobile ? "text-left items-start" : "text-center items-center"} flex flex-col`}
          >
            <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.05] tracking-tight mb-5">
              Maskica {EUR(BASE_PRICE)}.
            </h1>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.05] tracking-tight mb-5">
              Staklo {EUR(BASE_PRICE)}.
            </h1>
            <p className={`mt-4 text-gray-600 max-w-prose ${!isMobile ? "" : "mx-auto"}`}>
              Jednostavan dizajn. Isporuka u roku 0–2 dana.
            </p>
          </div>

          {/* Image – right or bottom */}
          <div className="w-full flex-1 relative flex items-center justify-center">
            <img
              src="/iphone16pro_4k_transparent_png8.png"
              alt="Maskica za iPhone"
              className="w-[80%] md:w-[100%] lg:w-[120%] max-h-[60vh] object-contain drop-shadow-2xl animate-floatY pointer-events-none select-none"
            />
          </div>
        </section>

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
                  model={model}
                  onAdd={(prod, color, qty) => addToCart(prod, color, qty)}
                  onQuickView={(prod, color) => setQuick({ product: prod, color })}
                />
              </div>
            ))}
            {!filtered.length && (
              <div className="col-span-full text-center text-gray-600 border rounded-lg p-10">Nema rezultata.</div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t mt-16" id="contact">
        <div className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2">
              <a href="#top" onClick={goTop} className="flex items-center gap-2 select-none" aria-label="Na vrh stranice">
                <span className="inline-flex h-6 w-6 rounded-full bg-gradient-to-tr from-zinc-900 to-zinc-700 ring-1 ring-black/10 shadow-sm" />
                <span className="font-semibold tracking-tight">maskino</span>
              </a>
            </div>
          </div>
          <div id="faq">
            <h4 className="font-semibold">Česta pitanja</h4>
            <ul className="mt-3 text-sm text-gray-700 space-y-2">
              <li>
                <span className="font-medium">Zašto tako jeftino?</span> Kupujemo na veliko i držimo niske marže.
              </li>
              <li>
                <span className="font-medium">Povrat?</span> Povrat novca u roku 30 dana, ako je proizvod oštećen.
              </li>
              <li>
                <span className="font-medium">Dostava?</span> Unutar 24 sata narudžba će biti uručena u BoxNow. Unutar
                0–48h u HR. Besplatno iznad 20€.
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Kontakt</h4>
            <p className="mt-3 text-sm text-gray-700">Email: support@eurocase.example</p>
            <p className="text-sm text-gray-700">Instagram: @eurocase.shop</p>
            <p className="text-xs text-gray-500 mt-4">© {new Date().getFullYear()} Maske za mobitel — Sva prava pridržana.</p>
          </div>
        </div>
      </footer>

      {/* Brzi pregled — model zaključan na odabrani */}
      <Drawer open={!!quick} onClose={() => setQuick(null)} title={quick ? quick.product.name : "Brzi pregled"}>
        {quick && (
          <div className="space-y-4">
            <img
              src={quick.product.imageByColor[quick.color] ?? quick.product.imageByColor[quick.product.defaultColor]}
              alt={`${quick.product.name} – ${quick.color}`}
              className="w-full h-48 object-cover rounded-lg border"
            />
            <div className="text-sm text-gray-600">
              Model: <span className="font-medium">{model}</span> (zaključano)
            </div>

            <div>
              <label className="text-sm">Boja</label>
              <select
                value={quick.color}
                onChange={(e) => setQuick({ product: quick.product, color: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-lg border"
              >
                {quick.product.colors.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  addToCart(quick.product, quick.color);
                  setQuick(null);
                  setCartOpen(true); // open cart after adding from Quick View
                }}
              >
                Dodaj u košaricu • {EUR(BASE_PRICE)}
              </Button>
              <Button variant="outline" onClick={() => setQuick(null)}>
                Zatvori
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
