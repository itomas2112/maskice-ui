import React, { useEffect, useMemo, useState } from "react";
import { Check, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProductWithStock, Compat } from "@/lib/types";
import { EUR } from "@/lib/utils";

export function ProductCard({
  product,
  model,
  onAdd,
  onQuickView,
}: {
  product: ProductWithStock;                           // centralized type
  model: Compat;
  onAdd: (p: ProductWithStock, color: string, qty: number) => void;
  onQuickView: (p: ProductWithStock, color: string, qty: number) => void;
}) {
  const [cardColor, setCardColor] = useState<string>(product.defaultColor);
  const [quantity, setQuantity] = useState<number>(1);
  const [added, setAdded] = useState<boolean>(false);
  const [liked, setLiked] = useState<boolean>(false);

  const price = product.price_cents / 100;
  const imgSrc =
    product.imageByColor[cardColor] ??
    product.imageByColor[product.defaultColor];

  // --- STOCK HELPERS ----------------------------------------------------- //
  const stockLeft = product.quantityByColor?.[cardColor] ?? 0;
  const maxSelectable = Math.max(0, Math.min(10, stockLeft));
  const qtyOptions = useMemo(
    () => Array.from({ length: maxSelectable }, (_, i) => i + 1),
    [maxSelectable]
  );

  useEffect(() => {
    if (quantity > maxSelectable) setQuantity(Math.max(1, maxSelectable));
  }, [maxSelectable, quantity]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("likedProducts") || "[]");
    if (stored.includes(product.id)) setLiked(true);
  }, [product.id]);

  const toggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const stored = JSON.parse(localStorage.getItem("likedProducts") || "[]");
    let updated: string[];
    if (liked) {
      updated = stored.filter((id: string) => id !== product.id);
      setLiked(false);
    } else {
      updated = [...stored, product.id];
      setLiked(true);
    }
    localStorage.setItem("likedProducts", JSON.stringify(updated));
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    const safeQty = Math.min(quantity, maxSelectable);
    if (safeQty <= 0) return;
    onAdd(product, cardColor, safeQty);
    setAdded(true);
    setTimeout(() => setAdded(false), 900);
  };

  const handleQuickView = () => onQuickView(product, cardColor, quantity);

  return (
    <div
      className="
        rounded-lg border overflow-hidden bg-white shadow
        flex flex-col cursor-pointer transition hover:shadow-md
        w-full aspect-[4/5] min-h-[clamp(360px,38vh,560px)]
      "
      onClick={handleQuickView}
      role="button"
      aria-label={`${product.name} – brzi pregled`}
    >
      {/* Image area */}
      <div className="basis-[75%] relative flex items-center justify-center p-2 overflow-hidden rounded-t-lg">
        <img
          src={imgSrc}
          alt={`${product.name} – ${cardColor}`}
          className="max-h-full max-w-full object-contain rounded-lg"
          draggable={false}
        />

        {/* ❤️ Like button */}
        <button
          onClick={toggleLike}
          aria-label="Add to favorites"
          className="absolute top-2 right-2 bg-white/80 rounded-full p-1 shadow hover:bg-white cursor-pointer"
        >
          <Heart
            className={`w-5 h-5 hover:fill-red-500 ${
              liked ? "fill-red-500 text-red-500" : "text-gray-600"
            }`}
          />
        </button>

        {/* Stock badge */}
        <div className="absolute left-2 top-2 text-xs px-2 py-1 rounded bg-white/80 border">
          Na stanju: <span className="font-semibold">{stockLeft}</span>
        </div>
      </div>

      {/* Content area */}
      <div className="basis-[25%] px-4 pb-4 pt-2 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-semibold leading-snug truncate">
              {product.name}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{model}</div>
          </div>
          <div className="text-lg font-bold shrink-0">{EUR(price)}</div>
        </div>

        {/* Color & Quantity */}
        <div className="flex flex-col">
          <label className="block text-xs text-gray-600 mb-1">
            Boja &amp; Količina
          </label>
          <div className="flex gap-2 sm:flex-row flex-col">
            {/* Color select */}
            <select
              value={cardColor}
              onChange={(e) => setCardColor(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border cursor-pointer"
              onClick={(e) => e.stopPropagation()}
              aria-label="Odaberi boju"
            >
              {product.colors.map((c) => {
                const left = product.quantityByColor?.[c] ?? 0;
                const soldOut = left <= 0;
                return (
                  <option key={c} value={c} disabled={soldOut}>
                    {c} {soldOut ? "— rasprodano" : ""}
                  </option>
                );
              })}
            </select>

            {/* Quantity select */}
            <select
              value={Math.min(quantity, maxSelectable)}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full sm:w-24 px-3 py-2 rounded-lg border cursor-pointer"
              onClick={(e) => e.stopPropagation()}
              aria-label="Odaberi količinu"
              disabled={maxSelectable === 0}
            >
              {qtyOptions.length > 0 ? (
                qtyOptions.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))
              ) : (
                <option value={0}>0</option>
              )}
            </select>
          </div>
        </div>

        {/* Add button */}
        <div className="mt-auto">
          <Button
            className={`w-full transition-colors duration-300 cursor-pointer ${
              added ? "bg-gray-300 text-gray-700" : ""
            }`}
            onClick={handleAdd}
            disabled={added || maxSelectable <= 0}
          >
            {maxSelectable <= 0
              ? "Nema na zalihi"
              : added
                ? <span className="flex items-center justify-center gap-1">
                    <Check className="w-4 h-4" /> Dodano
                  </span>
                : "Dodaj"}
          </Button>
        </div>
      </div>
    </div>
  );
}
