"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useShop } from "@/contexts/shop";
import API from "@/lib/api";
import { EUR } from "@/lib/utils";
import { useCart } from "@/hooks/useCart"; // 👈 useCart instead of local logic
import type { CartLineOut } from "@/hooks/useCart";

// If you later move the terms route, just update this one constant.
const TERMS_ROUTE = "/uvjeti_koristenja"; // matches app/(root)/uvjeti-koristenja/page.tsx

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
  const { cart, setQty, remove, refresh } = useCart();

  useEffect(() => {
    if (cartOpen) refresh(); // important: re-pull after add and when cookie is present
  }, [cartOpen, refresh]);

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

  // ▼ New: TOS acceptance + UX/error state
  const [acceptedTos, setAcceptedTos] = useState(false);
  const [tosError, setTosError] = useState(false);
  const [shakeBtn, setShakeBtn] = useState(false);

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

    // Block payment if TOS not accepted – but allow clicking to show UX feedback
    if (!acceptedTos) {
      setTosError(true);
      setShakeBtn(true);
      // stop shaking after one cycle
      window.setTimeout(() => setShakeBtn(false), 450);
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
                  {it.image && (
                    <img
                      src={it.image}
                      alt={it.name}
                      className="w-16 h-16 object-cover rounded border"
                    />
                  )}
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
                    onClick={() => (it.qty > 1) && setQty({ ...it, qty: -1 })}
                  >
                    −
                  </button>
                  <input
                    className="w-10 h-7 text-center border rounded"
                    value={it.qty}
                    onChange={(e) => setQty({ ...it, qty: Math.max(1, Number(e.target.value) || 1) })}
                  />
                  <button
                    className="w-7 h-7 border rounded cursor-pointer"
                    onClick={() => setQty({ ...it, qty: 1 })}
                  >
                    +
                  </button>
                </div>

                <div className="text-sm font-medium">{EUR(it.line_total_cents / 100)}</div>

                <button
                  className="text-sm text-red-600 cursor-pointer"
                  onClick={() => remove({ product_id: it.product_id, color: it.color, model: it.model })}
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
                  onChange={(e) => setCustomer({ ...customer, country: e.target.value.toUpperCase() })}
                />
              </div>
              {!formOk && (
                <div className="text-xs text-red-600">
                  Molimo ispunite sva obavezna polja. Trenutno dostavljamo samo unutar RH.
                </div>
              )}
            </div>
          )}

          {/* ▼ Terms of Service acceptance */}
          {cart && cart.items.length > 0 && (
            <div className="mt-2">
              <label className={`flex items-start gap-2 select-none ${tosError ? "text-red-600" : "text-gray-800"}`}>
                <input
                  id="accept-tos"
                  type="checkbox"
                  className={`mt-1 h-4 w-4 cursor-pointer border rounded ${tosError ? "border-red-600" : "border-gray-300"}`}
                  checked={acceptedTos}
                  onChange={(e) => {
                    setAcceptedTos(e.target.checked);
                    if (e.target.checked) setTosError(false);
                  }}
                />
                <span className="text-sm">
                  Kupovinom kao gost, prihvaćam opće <a
                    href={TERMS_ROUTE}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`underline ${tosError ? "text-red-700" : ""}`}
                  >
                    uvjete korištenja
                  </a>.
                </span>
              </label>
              {tosError && (
                <p className="mt-1 text-xs text-red-600">
                  Molimo potvrdite da prihvaćate opće uvjete korištenja prije plaćanja.
                </p>
              )}
            </div>
          )}

          <Button
            className={`w-full mt-3 cursor-pointer ${shakeBtn ? "btn-shake" : ""}`}
            disabled={!cart || cart.items.length === 0 || creating || !formOk}
            onClick={handleCheckout}
            aria-live="polite"
          >
            {creating ? "Kreiram…" : "Plati"}
          </Button>

          {/* Local styles for the shake animation */}
          <style jsx>{`
            @keyframes btn-shake {
              10% { transform: translateX(-4px); }
              20% { transform: translateX(4px); }
              30% { transform: translateX(-4px); }
              40% { transform: translateX(4px); }
              50% { transform: translateX(-3px); }
              60% { transform: translateX(3px); }
              70% { transform: translateX(-2px); }
              80% { transform: translateX(2px); }
              90% { transform: translateX(-1px); }
              100%{ transform: translateX(0); }
            }
            .btn-shake { animation: btn-shake 0.45s linear; }
          `}</style>
        </div>
      </aside>
    </div>
  );
}
