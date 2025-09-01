// src/hooks/useCatalogFilters.ts
import { useEffect, useMemo, useState } from "react";
import type { BackendProduct, Compat, ProductWithStock, QuantityByColor } from "@/lib/types";
import API from "@/lib/api";
import { useShop } from "@/contexts/shop";
import { useParams } from "next/navigation";
import { slugToType, slugToPhone } from "@/lib/slug"; // keep as-is if you’re using slugs

// ——— helpers without using `any`
function getStringFromKeys(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim().length > 0) return v;
  }
  return undefined;
}
function getNumberLikeFromKeys(obj: Record<string, unknown>, keys: string[], fallback = 0): number {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  }
  return fallback;
}

export function useCatalogFilters() {
  const [availableModels, setAvailableModels] = useState<Compat[]>([]);
  const [model, setModel] = useState<Compat>("iPhone 16"); // will be overridden to default available
  const [type, setType] = useState<string | undefined>(undefined);
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const { normalize } = useShop();
  const params = useParams() as { type?: string; phone?: string } | null;

  // Load + normalize products
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await API.get<BackendProduct[]>("/products");
        const rows = res.data ?? [];

        const normalized = rows
          .map((row): ProductWithStock | null => {
            const base = normalize(row);
            if (!base) return null;

            const quantityByColor: QuantityByColor = {};
            const variants = (row as { variants?: unknown[] }).variants ?? [];
            for (const vv of variants) {
              if (typeof vv !== "object" || vv === null) continue;
              const v = vv as Record<string, unknown>;

              const colorKey = getStringFromKeys(v, ["colors", "color", "colour", "Color"]);
              if (!colorKey) continue;

              const q = getNumberLikeFromKeys(v, ["quantity", "qty", "stok", "Quantity"], 0);
              quantityByColor[colorKey] = q;
            }

            return { ...base, quantityByColor };
          })
          .filter((x): x is ProductWithStock => x !== null);

        if (!cancelled) setProducts(normalized);
      } catch {
        console.error("Error loading products");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [normalize]);

  // Sync from URL params
  useEffect(() => {
    if (!params) return;
    if (params.type) setType(slugToType(params.type));
    if (params.phone) setPhone(slugToPhone(params.phone));
  }, [params, setType, setPhone]);

  // Available Types (unique)
  const availableTypes = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.type).filter(Boolean)));
  }, [products]);

  // Available Phones (unique)
  const availablePhones = useMemo(() => {
    // If you want phones constrained by selected type, uncomment next line:
    // const base = type ? products.filter(p => p.type?.toLowerCase() === type.toLowerCase()) : products;
    const base = products;
    return Array.from(new Set(base.map((p) => p.phone).filter(Boolean)));
  }, [products /*, type*/]);

  // Recompute available models whenever phone or products change
  useEffect(() => {
    const base = phone
      ? products.filter((prod) => prod.phone && phone && prod.phone.toLowerCase() === phone.toLowerCase())
      : products;

    const allModels = Array.from(new Set(base.map((p) => p.compat).filter(Boolean)));

    setAvailableModels(allModels);

    // ✅ Important: only set model when there is at least one model
    if (allModels.length) {
      // If current model is not in the list, or nothing selected yet, pick first
      if (!model || !allModels.includes(model)) {
        setModel(allModels[0]);
      }
    }
    // If there are no models for current selection, DO NOT set model (avoid undefined)
  }, [phone, products]); // model is intentionally not a dependency to avoid loops

  // Filtered list (safe against undefineds during load)
  const filtered = useMemo(() => {
    const m = model ? String(model).toLowerCase() : undefined;
    const t = type ? type.toLowerCase() : undefined;
    const ph = phone ? phone.toLowerCase() : undefined;

    return products.filter((p) => {
      const okModel = m ? String(p.compat).toLowerCase() === m : true;
      const okType = t ? (p.type ? p.type.toLowerCase() === t : false) : true;
      const okPhone = ph ? (p.phone ? p.phone.toLowerCase() === ph : false) : true;
      return okModel && okType && okPhone;
    });
  }, [products, model, type, phone]);

  return {
    model, setModel,
    type, setType,
    phone, setPhone,
    filtered,
    availableModels,
    availableTypes,
    availablePhones,
    products, loading,
  };
}
