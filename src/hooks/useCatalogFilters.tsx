// src/hooks/useCatalogFilters.ts
import { useEffect, useMemo, useState } from "react";
import type { BackendProduct, Compat, Product, ProductWithStock, QuantityByColor } from "@/lib/types";
import API from "@/lib/api";
import { useShop } from "@/contexts/shop";

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
  const [model, setModel] = useState<Compat>("iPhone 16");
  const [type, setType] = useState<string | undefined>(undefined);
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const { normalize } = useShop();

  useEffect(() => {
    API.get<BackendProduct[]>("/products")
      .then((res) => {
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
  
              // Be lenient with backend field names
              const colorKey = getStringFromKeys(v, ["colors", "color", "colour", "Color"]);
              if (!colorKey) continue;
  
              const q = getNumberLikeFromKeys(v, ["quantity", "qty", "stok", "Quantity"], 0);
              quantityByColor[colorKey] = q;
            }
  
            // Always return ProductWithStock
            return { ...base, quantityByColor };
          })
          .filter((x): x is ProductWithStock => x !== null);
  
        setProducts(normalized);
        setLoading(false);
      })
      .catch(() => {
        console.error("Error loading products");
        setLoading(false);
      });
  }, [normalize]);

  const availableModels = useMemo(() => {
    const set = new Set<Compat>();
    for (const p of products) set.add(p.compat);
    return Array.from(set);
  }, [products]);

  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) if (p.compat === model && p.type) set.add(p.type);
    return Array.from(set);
  }, [products, model]);

  const availablePhones = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) if (p.compat === model && p.phone) set.add(p.phone);
    return Array.from(set);
  }, [products, model]);

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          p.compat === model &&
          (!type || p.type === type) &&
          (!phone || p.phone === phone)
      ),
    [products, model, type, phone]
  );

  useEffect(() => {
    if (availableModels.length && !availableModels.includes(model)) {
      setModel(availableModels[0]);
    }
  }, [availableModels, model]);

  useEffect(() => {
    if (type && !availableTypes.includes(type)) setType(undefined);
  }, [availableTypes, type]);

  useEffect(() => {
    if (phone && !availablePhones.includes(phone)) setPhone(undefined);
  }, [availablePhones, phone]);

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
