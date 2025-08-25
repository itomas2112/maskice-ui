// src/app/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { ProductCard } from "@/components/ProductCard";
import { useShop, useCartCount } from "@/contexts/shop";
import type { Compat, Product } from "@/lib/types";
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
  const { addToCart, quick, setQuick, setCartOpen, cart, setCart } = useShop();
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

  /**
   * Reverse indices for fast lookups:
   * - byGroupId: Product by catalog group product.id (already used)
   * - byVariantId: Product by variant (DB) id, so we can resolve cart lines that store `productId`
   * - variantDefaultColor: default color per variant id (fallback if cart color missing)
   */
  const { byGroupId, byVariantId, variantDefaultColor } = useMemo(() => {
    const _byGroup: Record<string, Product & { quantityByColor?: Record<string, number> }> = {};
    const _byVar: Record<string, Product & { quantityByColor?: Record<string, number> }> = {};
    const _varDefault: Record<string, string> = {};
    for (const p of products as (Product & { quantityByColor?: Record<string, number> })[]) {
      _byGroup[p.id] = p;
      for (const c of p.colors) {
        const vid = p.productIdByColor[c];
        if (vid) {
          _byVar[vid] = p;
          _varDefault[vid] = p.defaultColor ?? c;
        }
      }
    }
    return { byGroupId: _byGroup, byVariantId: _byVar, variantDefaultColor: _varDefault };
  }, [products]);

  // ===== Cart sanitizer that *only* removes/clamps when real stock info exists =====
  useEffect(() => {
    if (!Array.isArray(cart) || !products?.length) return;

    let changed = false;

    const next = (cart as any[]).flatMap((line) => {
      if (!line) { changed = true; return []; }

      // Ensure we can resolve the product from either the bundled `product` or the variant id we store as `productId`
      let product: (Product & { quantityByColor?: Record<string, number> }) | undefined =
        line.product && (line.product as any).id ? byGroupId[(line.product as any).id] : undefined;

      if (!product && typeof line.productId === "string") {
        product = byVariantId[line.productId];
      }
      if (!product && line.id) {
        product = byGroupId[line.id];
      }

      // normalize color if missing
      let color: string | undefined = line.color;
      if (!color && line.productId && variantDefaultColor[line.productId]) {
        color = variantDefaultColor[line.productId];
        line = { ...line, color };
        changed = true;
      }

      if (!product || !color || typeof line.qty !== "number") {
        // Cannot resolve yet — keep the line as-is (don’t nuke the cart!)
        return [line];
      }

      // Attach product for downstream UI (optional)
      if (!line.product) {
        line = { ...line, product };
        changed = true;
      }

      // Stock logic
      const hasStockInfo =
        product.quantityByColor && Object.keys(product.quantityByColor).length > 0;

      // When stock unknown, don't remove; cap softly at 10 to avoid silly values
      const rawLeft = hasStockInfo ? (product.quantityByColor![color] ?? 0) : 10;
      const left = Math.max(0, Math.min(10, rawLeft));

      if (hasStockInfo) {
        if (left <= 0) { changed = true; return []; }
        if (line.qty > left) { changed = true; return [{ ...line, qty: left }]; }
      }

      return [line];
    });

    if (changed) setCart(next as typeof cart);
  }, [products, cart, setCart, byGroupId, byVariantId, variantDefaultColor]);

  const getMaxQty = (p: Product & { quantityByColor?: Record<string, number> }, color: string) => {
    const hasStockInfo = p.quantityByColor && Object.keys(p.quantityByColor).length > 0;
    const rawLeft = hasStockInfo ? (p.quantityByColor?.[color] ?? 0) : 10; // default limit when unknown
    return Math.max(0, Math.min(10, rawLeft));
  };

  const safeAdd = (prod: Product & { quantityByColor?: Record<string, number> }, color: string, wanted = 1) => {
    const max = getMaxQty(prod, color);
    const qty = Math.min(wanted, max);
    if (qty <= 0) return;
    addToCart(prod, color, qty);
  };

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
                  onAdd={(prod, color, qty = 1) => safeAdd(prod as any, color, qty)}
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
                  // Use safeAdd here too to honor stock logic
                  safeAdd(quick.product as any, quick.color, 1);
                  setQuick(null);
                  setCartOpen(true);
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
