// src/components/CartDrawer.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useShop } from "@/contexts/shop";
import API from "@/lib/api";
import type { BackendProduct, Product, Compat } from "@/lib/types";
import {useCatalogFilters} from "@/hooks/useCatalogFilters";

const EUR = (n: number) =>
  new Intl.NumberFormat("hr-HR", { style: "currency", currency: "EUR" }).format(n);

type Customer = {
  first_name: string;
  last_name: string;
  email: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  postal_code: string;
  country: string; // e.g. "HR"
};

const CUSTOMER_KEY = "shop.customer.v1";

export default function CartDrawer() {
  const { cartOpen, setCartOpen, cart, setCart } = useShop();

  // Load catalog so we can render names/images/prices regardless of route
  const { products } = useCatalogFilters()

  // Customer form state (persist to localStorage)
  const [customer, setCustomer] = useState<Customer>({
    first_name: "",
    last_name: "",
    email: "",
    address_line1: "",
    address_line2: "",
    city: "",
    postal_code: "",
    country: "HR",
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CUSTOMER_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          setCustomer((c) => ({ ...c, ...parsed }));
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
    } catch {}
  }, [customer]);

  const formOk =
    customer.first_name.trim() &&
    customer.last_name.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email) &&
    customer.address_line1.trim() &&
    customer.city.trim() &&
    customer.postal_code.trim() &&
    customer.country.trim();

  const productByVariant = (dbId: string, color: string) =>
    products.find((p) => p.productIdByColor[color] === dbId);

  const keyOf = (x: { productId: string; model: Compat; color: string }) =>
    `${x.productId}-${x.model}-${x.color}`;

  const subtotal = useMemo(
    () =>
      cart.reduce((s, it) => {
        const p = productByVariant(it.productId, it.color);
        return p ? s + (p.price_cents / 100) * it.qty : s;
      }, 0),
    [cart, products]
  );

  const shipping = subtotal >= 25 || subtotal === 0 ? 0 : 2.0;
  const total = subtotal + shipping;

  const [creating, setCreating] = useState(false);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!formOk) {
      alert("Molimo ispunite podatke za dostavu (ime, prezime, email, adresu).");
      return;
    }
    try {
      setCreating(true);
      const items = cart.map((it) => ({
        product_id: it.productId,
        qty: it.qty,
        color: it.color,
        model: it.model,
      }));
      const payload = {
        items,
        customer: {
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email,
          address: {
            line1: customer.address_line1,
            line2: customer.address_line2 || null,
            city: customer.city,
            postal_code: customer.postal_code,
            country: customer.country,
          },
        },
      };
      const res = await API.post<{ checkout_url: string; order_id: string }>(
        "/checkout/session",
        payload
      );
      window.location.href = res.data.checkout_url;
    } catch (err: unknown) {
      let detail = "Unknown error";
      if (err instanceof Error) {
        detail = err.message;
      } else if (typeof err === "object" && err && "response" in err) {
        const resp = (err as { response?: { data?: { detail?: unknown } } }).response;
        if (resp?.data?.detail !== undefined) {
          detail =
            typeof resp.data.detail === "string"
              ? resp.data.detail
              : JSON.stringify(resp.data.detail, null, 2);
        }
      }
      console.error("Error starting checkout", err);
      alert(`Greška pri pokretanju plaćanja:\n${detail}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 ${cartOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
      <div
        onClick={() => setCartOpen(false)}
        className={`absolute inset-0 bg-black/30 transition-opacity ${
          cartOpen ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow border-l transition-transform ${
          cartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Vaša košarica</h3>
          <button onClick={() => setCartOpen(false)} className="px-2 py-1 rounded-md border cursor-pointer">
            Zatvori
          </button>
        </div>

        {/* Everything INSIDE the drawer */}
        <div className="p-4 overflow-y-auto h-[calc(100%-56px)] space-y-3">
          {/* Items */}
          {cart.length === 0 && <p className="text-sm text-gray-600">Vaša košarica je prazna.</p>}
          {cart.map((it) => {
            const p = productByVariant(it.productId, it.color);
            const itemKey = keyOf(it);
            const img = p ? (p.imageByColor[it.color] ?? p.imageByColor[p.defaultColor]) : undefined;
            const unit = p ? p.price_cents / 100 : 0;

            return (
              <div key={itemKey} className="flex items-center justify-between gap-3 rounded-lg p-3 border bg-white">
                <div className="flex items-center gap-3">
                  {img ? (
                    <img
                      src={img}
                      alt={`${p?.name ?? "Proizvod"} – ${it.color}`}
                      className="w-16 h-16 rounded-md object-cover border"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-md border bg-gray-100" />
                  )}
                  <div>
                    <div className="text-sm font-medium">{p?.name ?? "Nepoznat proizvod"}</div>
                    <div className="text-xs text-gray-600">
                      {it.model} · {it.color}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="w-7 h-7 border rounded cursor-pointer"
                    onClick={() =>
                      setCart((c) =>
                        c.map((x) =>
                          keyOf(x) === itemKey ? { ...x, qty: Math.max(1, x.qty - 1) } : x
                        )
                      )
                    }
                    aria-label="Smanji količinu"
                  >
                    −
                  </button>
                  <input
                    className="w-10 h-7 text-center border rounded"
                    value={it.qty}
                    onChange={(e) => {
                      const v = Math.max(1, Number(e.target.value) || 1);
                      setCart((c) => c.map((x) => (keyOf(x) === itemKey ? { ...x, qty: v } : x)));
                    }}
                    aria-label="Količina"
                  />
                  <button
                    className="w-7 h-7 border rounded cursor-pointer"
                    onClick={() =>
                      setCart((c) =>
                        c.map((x) => (keyOf(x) === itemKey ? { ...x, qty: x.qty + 1 } : x))
                      )
                    }
                    aria-label="Povećaj količinu"
                  >
                    +
                  </button>
                </div>

                <div className="text-sm font-medium">{EUR(it.qty * unit)}</div>

                <button
                  className="text-sm text-red-600 cursor-pointer"
                  onClick={() => setCart((c) => c.filter((x) => keyOf(x) !== itemKey))}
                >
                  Ukloni
                </button>
              </div>
            );
          })}

          {/* Totals */}
          <div className="mt-4 border-t pt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Zbroj stavki</span>
              <span>{EUR(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Dostava</span>
              <span>{shipping ? EUR(shipping) : "Besplatno"}</span>
            </div>
            <div className="flex justify-between font-semibold text-base mt-1">
              <span>Ukupno</span>
              <span>{EUR(total)}</span>
            </div>
          </div>

          {/* Podaci za dostavu */}
          {cart.length > 0 && (
            <div className="mt-3 space-y-3 border rounded-lg p-3 bg-white">
              <div className="font-medium">Podaci za dostavu</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  className="border rounded-md px-3 py-2"
                  placeholder="Ime"
                  value={customer.first_name}
                  onChange={(e) => setCustomer({ ...customer, first_name: e.target.value })}
                />
                <input
                  className="border rounded-md px-3 py-2"
                  placeholder="Prezime"
                  value={customer.last_name}
                  onChange={(e) => setCustomer({ ...customer, last_name: e.target.value })}
                />
              </div>
              <input
                className="border rounded-md px-3 py-2 w-full"
                placeholder="Email"
                type="email"
                value={customer.email}
                onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
              />
              <input
                className="border rounded-md px-3 py-2 w-full"
                placeholder="Adresa (ulica i broj)"
                value={customer.address_line1}
                onChange={(e) => setCustomer({ ...customer, address_line1: e.target.value })}
              />
              <input
                className="border rounded-md px-3 py-2 w-full"
                placeholder="Adresa 2 (opcionalno)"
                value={customer.address_line2 ?? ""}
                onChange={(e) => setCustomer({ ...customer, address_line2: e.target.value })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  className="border rounded-md px-3 py-2"
                  placeholder="Grad"
                  value={customer.city}
                  onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                />
                <input
                  className="border rounded-md px-3 py-2"
                  placeholder="Poštanski broj"
                  value={customer.postal_code}
                  onChange={(e) => setCustomer({ ...customer, postal_code: e.target.value })}
                />
                <input
                  className="border rounded-md px-3 py-2"
                  placeholder="Država (npr. HR)"
                  maxLength={2}
                  value={customer.country}
                  onChange={(e) =>
                    setCustomer({ ...customer, country: e.target.value.toUpperCase() })
                  }
                />
              </div>
              {!formOk && (
                <div className="text-xs text-red-600">
                  Molimo ispunite sva obavezna polja. Trenutno dostavljamo samo unutar RH.
                </div>
              )}
            </div>
          )}

          {/* Pay button */}
          <Button
            className="w-full mt-3 cursor-pointer"
            disabled={cart.length === 0 || creating || !formOk}
            onClick={handleCheckout}
          >
            {creating ? "Kreiram…" : "Plati (simulacija)"}
          </Button>
        </div>
      </aside>
    </div>
  );
}
