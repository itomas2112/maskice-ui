// src/components/Drawer.tsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import type { ProductWithStock } from "@/lib/types";

/* ---- QuickView local state (kept local to avoid changing context type) ---- */
export type QuickState = { product: ProductWithStock; color: string } | null;

/* ---- Shell (generic sliding panel) ---- */
function DrawerShell({
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

/* ---- Drawer props ---- */
export type DrawerProps = {
  quick: QuickState;
  setQuick: (q: QuickState) => void;
  model: string;
  safeAdd: (prod: ProductWithStock, color: string, wanted?: number) => void;
  setCartOpen: (open: boolean) => void;
  priceFormatter: (n: number) => string; // EUR()
  basePrice: number;                      // BASE_PRICE
};

/* ---- QuickView Drawer ---- */
export function Drawer({
  quick,
  setQuick,
  model,
  safeAdd,
  setCartOpen,
  priceFormatter,
  basePrice,
}: DrawerProps) {
  const open = !!quick;
  const title = quick ? quick.product.name : "Brzi pregled";

  return (
    <DrawerShell open={open} onClose={() => setQuick(null)} title={title}>
      {quick && (
        <div className="space-y-4">
          <img
            src={
              quick.product.imageByColor[quick.color] ??
              quick.product.imageByColor[quick.product.defaultColor]
            }
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
                safeAdd(quick.product, quick.color, 1);
                setQuick(null);
                setCartOpen(true);
              }}
            >
              Dodaj u košaricu • {priceFormatter(basePrice)}
            </Button>
            <Button variant="outline" onClick={() => setQuick(null)}>
              Zatvori
            </Button>
          </div>
        </div>
      )}
    </DrawerShell>
  );
}
