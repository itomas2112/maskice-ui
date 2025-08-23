import { useEffect, useMemo, useState } from "react";
import type {BackendProduct, Compat, Product} from "@/lib/types";
import API from "@/lib/api";
import {useShop} from "@/contexts/shop";

export function useCatalogFilters() {
  const [model, setModel] = useState<Compat>("iPhone 16");
  const [type, setType] = useState<string | undefined>(undefined);
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true)
  const [products, setProducts] = useState<Product[]>([]);
  const { normalize } = useShop()
  
  useEffect(() => {
    API.get<BackendProduct[]>("/products")
      .then((res) => {
        const normalized: Product[] = (res.data ?? [])
          .map(normalize)
          .filter((x): x is Product => !!x);
        setProducts(normalized);
        setLoading(false)
      })
      .catch(() => {
        console.error("Error loading products");
      });
  }, []);

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
    products, loading
  };
}
