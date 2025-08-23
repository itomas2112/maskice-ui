import { useEffect, useMemo, useState } from "react";
import type { Compat, Product } from "@/lib/types";

export function useCatalogFilters(products: Product[]) {
  const [model, setModel] = useState<Compat>("iPhone 16");
  const [type, setType] = useState<string | undefined>(undefined);
  const [phone, setPhone] = useState<string | undefined>(undefined);

  // All models present in catalog
  const availableModels = useMemo(() => {
    const set = new Set<Compat>();
    for (const p of products) set.add(p.compat);
    return Array.from(set);
  }, [products]);

  // Types/phones for the selected model
  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) if (p.compat === model) set.add(p.type);
    return Array.from(set);
  }, [products, model]);

  const availablePhones = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) if (p.compat === model) set.add(p.phone);
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
      setModel(availableModels[0]); // pick first available model
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
  };
}
