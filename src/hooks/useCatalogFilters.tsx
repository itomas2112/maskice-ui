// src/hooks/useCatalogFilters.ts
import { useEffect, useMemo, useState } from "react";
import type { BackendProduct, Compat, Product } from "@/lib/types";
import API from "@/lib/api";
import { useShop } from "@/contexts/shop";

type QuantityByColor = Record<string, number>;

export function useCatalogFilters() {
  const [model, setModel] = useState<Compat>("iPhone 16");
  const [type, setType] = useState<string | undefined>(undefined);
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [products, setProducts] = useState<Product[]>([]);
  const { normalize } = useShop();

  useEffect(() => {
    API.get<BackendProduct[]>("/products")
      .then((res) => {
        const rows = res.data ?? [];

        const normalized: Product[] = rows
          .map((row) => {
            const base = normalize(row);
            if (!base) return null;

            const quantityByColor: QuantityByColor = {};
            for (const v of row.variants ?? []) {
              // Be lenient with backend field names: colors/color & quantity/qty
              const colorKey =
                (v as any).colors ??
                (v as any).color ??
                (v as any).colour ??
                (v as any).Color ??
                undefined;
              if (!colorKey) continue;

              const qRaw =
                (v as any).quantity ??
                (v as any).qty ??
                (v as any).stok ??
                (v as any).Quantity ??
                0;
              const q = Number.isFinite(Number(qRaw)) ? Number(qRaw) : 0;

              quantityByColor[colorKey] = q;
            }

            return { ...base, quantityByColor } as Product & {
              quantityByColor: QuantityByColor;
            };
          })
          .filter((x): x is Product & { quantityByColor: QuantityByColor } => !!x);

        setProducts(normalized);
        setLoading(false);
      })
      .catch(() => {
        console.error("Error loading products");
        setLoading(false);
      });
  }, [normalize]);

  // All models present in catalog
  const availableModels = useMemo(() => {
    const set = new Set<Compat>();
    for (const p of products) set.add(p.compat);
    return Array.from(set);
  }, [products]);

  // Types/phones for the selected model
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

  // Filtered products
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

  // Keep selections valid when data changes
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
