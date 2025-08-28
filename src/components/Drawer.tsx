// src/components/Drawer.tsx
"use client";

import React, {useEffect, useMemo, useState} from "react";
import { Button } from "@/components/ui/button";
import type { ProductWithStock } from "@/lib/types";
import {Check} from "lucide-react";
import {useCart} from "@/hooks/useCart";
import { EUR } from "@/lib/utils";
import {  ArrowLeft } from "lucide-react";

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
          <button onClick={onClose} className="px-2 py-1 rounded-md border cursor-pointer">
            <ArrowLeft className="w-15 h-6" />
          </button>
          <h3 className="font-semibold">{title}</h3>
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
};

/* ---- QuickView Drawer ---- */
export function Drawer({
  quick,
  setQuick
}: DrawerProps) {

  const { add } = useCart()
  const [added, setAdded] = useState<boolean>(false)
  const [quantity, setQuantity] = useState<number>(1);
  const [cardColor, setCardColor] = useState<string>(() =>
    quick?.product.defaultColor ?? quick?.product.colors?.[0] ?? ""
  );
  
  // 2) When the drawer changes to a new product, resync the color
  useEffect(() => {
    if (!quick) return;
    setCardColor(quick.product.defaultColor ?? quick.product.colors?.[0] ?? "");
  }, [quick]);

  const stockLeft = quick?quick.product.quantityByColor?.[cardColor] : 0;
  const maxSelectable = Math.max(0, Math.min(10, stockLeft));
  const qtyOptions = useMemo(
    () => Array.from({ length: maxSelectable }, (_, i) => i + 1),
    [maxSelectable]
  );

  useEffect(() => {
    if (quantity > maxSelectable) setQuantity(Math.max(1, maxSelectable));
  }, [maxSelectable, quantity]);
  
  const open = !!quick;
  const title = quick ? quick.product.name : "Brzi pregled";
  
  function handleAdd() {
    quick&&add({
      product_id: quick.product.productIdByColor["id"],       // variant id
      model: quick.product.compat,
      color: quick.product.defaultColor,
      qty: quantity, // optional; defaults to 1
    })
  }
  console.log(quick)
  return (
    <DrawerShell open={open} onClose={() => setQuick(null)} title={title}>
      {quick && (
        <div className="space-y-4">
          
          <div className="basis-[75%] relative flex items-center justify-center p-2 overflow-hidden rounded-lg">
            <img
              src={
                quick.product.imageByColor[quick.color] ??
                quick.product.imageByColor[quick.product.defaultColor]
              }
              alt={`${quick.product.name} – ${quick.color}`}
              className="max-h-full max-w-full object-contain rounded-lg"
              draggable={false}
            />
          </div>

          <div className="text-sm text-gray-600">
            Model: <span className="font-medium">{quick.product.compat}</span> (zaključano)
          </div>
          
          <div className="flex gap-3">
            {/* Color */}
            <div className="flex-1">
              <label className="block text-sm mb-1">Boja</label>
              <select
                value={quick.color}
                onChange={(e) => setQuick({ product: quick.product, color: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border cursor-pointer"
              >
                {quick.product.colors.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          
            {/* Quantity */}
            <div className="w-28">
              <label className="block text-sm mb-1">Količina</label>
              <select
                value={maxSelectable === 0 ? 0 : quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border cursor-pointer"
                onClick={(e) => e.stopPropagation()}
                aria-label="Odaberi količinu"
                disabled={maxSelectable === 0}
              >
                {qtyOptions.length > 0 ? (
                  qtyOptions.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))
                ) : (
                  <option value={0}>0</option>
                )}
              </select>
            </div>
          </div>


          <div className="flex gap-2">
            <Button
              variant={added ? "secondary" : "default"}
              className={`w-full transition-colors duration-300 cursor-pointer`}
              onClick={() => {
                handleAdd();
                setAdded(true);
                setTimeout(() => setAdded(false), 900);
              }}
            >
              {added ? (
                <span className="flex items-center justify-center gap-1">
                  <Check className="w-4 h-4" /> Dodano
                </span>
              ) : (
                `Dodaj u košaricu • ${EUR(quick.product.price_cents/100)}`
              )}
            </Button>
          </div>
        </div>
      )}
    </DrawerShell>
  );
}
