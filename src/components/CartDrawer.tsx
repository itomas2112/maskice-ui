"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useShop } from "@/contexts/shop";
import API from "@/lib/api";
import { EUR } from "@/lib/utils";
import { useCart } from "@/hooks/useCart"; // 👈 useCart instead of local logic
import type { CartLineOut } from "@/hooks/useCart";

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
  const { cartOpen, setCartOpen } = useShop();
  const { cart, setQty, remove } = useCart();
  
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
      if (raw) setCustomer((c) => ({ ...c, ...JSON.parse(raw) }));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
    } catch {}
  }, [customer]);

  const [creating, setCreating] = useState(false);

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) return;
    if (
      !(
        customer.first_name.trim() &&
        customer.last_name.trim() &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email) &&
        customer.address_line1.trim() &&
        customer.city.trim() &&
        customer.postal_code.trim() &&
        customer.country.trim()
      )
    ) {
      alert("Molimo ispunite podatke za dostavu (ime, prezime, email, adresu).");
      return;
    }
    try {
      setCreating(true);
      const payload = {
        items: cart.items.map((it) => ({
          product_id: it.product_id,
          qty: it.qty,
          color: it.color,
          model: it.model,
        })),
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
      console.error("Error starting checkout", err);
      alert("Greška pri pokretanju plaćanja.");
    } finally {
      setCreating(false);
    }
  };

  const formOk =
    customer.first_name.trim() &&
    customer.last_name.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email) &&
    customer.address_line1.trim() &&
    customer.city.trim() &&
    customer.postal_code.trim() &&
    customer.country.trim();

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

        <div className="p-4 overflow-y-auto h-[calc(100%-56px)] space-y-3">
          {/* Items */}
          {!cart || cart.items.length === 0 ? (
            <p className="text-sm text-gray-600">Vaša košarica je prazna.</p>
          ) : (
            cart.items.map((it: CartLineOut) => (
              <div
                key={`${it.product_id}-${it.model}-${it.color}`}
                className="flex items-center justify-between gap-3 rounded-lg p-3 border bg-white"
              >
                <div className="flex items-center gap-3">
                  {/* You can still resolve image from catalog if you need */}
                  <div>
                    <div className="text-sm font-medium">{it.name}</div>
                    <div className="text-xs text-gray-600">
                      {it.model} · {it.color}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="w-7 h-7 border rounded cursor-pointer"
                    onClick={() =>
                      setQty({ ...it, qty: Math.max(1, it.qty - 1) })
                    }
                  >
                    −
                  </button>
                  <input
                    className="w-10 h-7 text-center border rounded"
                    value={it.qty}
                    onChange={(e) =>
                      setQty({ ...it, qty: Math.max(1, Number(e.target.value) || 1) })
                    }
                  />
                  <button
                    className="w-7 h-7 border rounded cursor-pointer"
                    onClick={() =>
                      setQty({ ...it, qty: it.qty + 1 })
                    }
                  >
                    +
                  </button>
                </div>

                <div className="text-sm font-medium">{EUR(it.line_total_cents / 100)}</div>

                <button
                  className="text-sm text-red-600 cursor-pointer"
                  onClick={() =>
                    remove({ product_id: it.product_id, color: it.color, model: it.model })
                  }
                >
                  Ukloni
                </button>
              </div>
            ))
          )}

          {/* Totals */}
          {cart && (
            <div className="mt-4 border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Zbroj stavki</span>
                <span>{EUR(cart.subtotal_cents / 100)}</span>
              </div>
              <div className="flex justify-between">
                <span>Dostava</span>
                <span>{cart.shipping_cents ? EUR(cart.shipping_cents / 100) : "Besplatno"}</span>
              </div>
              <div className="flex justify-between font-semibold text-base mt-1">
                <span>Ukupno</span>
                <span>{EUR(cart.total_cents / 100)}</span>
              </div>
            </div>
          )}

          {/* Shipping form */}
          {cart && cart.items.length > 0 && (
            <div className="mt-3 space-y-3 border rounded-lg p-3 bg-white">
              {/* ... keep your customer form unchanged ... */}
            </div>
          )}

          <Button
            className="w-full mt-3 cursor-pointer"
            disabled={!cart || cart.items.length === 0 || creating || !formOk}
            onClick={handleCheckout}
          >
            {creating ? "Kreiram…" : "Plati (simulacija)"}
          </Button>
        </div>
      </aside>
    </div>
  );
}
