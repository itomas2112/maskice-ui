// src/app/page.tsx
// Minimalistički storefront s katalog filtrom (iPhone 16 / 16 Pro),
// karticama proizvoda s odabirom boje i "Brzi pregledom" s zaključanim modelom.

"use client";

import React, {useEffect, useMemo, useState} from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import API from "@/lib/api"; // adjust path if needed
import { Header } from "@/components/layout/Header";

const EUR = (n: number) => new Intl.NumberFormat("hr-HR", { style: "currency", currency: "EUR" }).format(n);
const BASE_PRICE = 3.0;

// Katalog — mali i fokusiran
type Product = {
  id: string;
  name: string;
  image: string;
  colors: string[];
  compat: ("iPhone 16" | "iPhone 16 Pro")[];
};

type CartItemPayload = {
  product_id: string;
  qty: number;
  color: string;
  model: Compat;
};

type QuoteItemOut = {
  product_id: string;
  name: string;
  color: string;
  model: Compat;
  qty: number;
  unit_price_cents: number;
  line_total_cents: number;
};

type QuoteOut = {
  items: QuoteItemOut[];
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
};

type OrderItemOut = {
  id: string;
  product_id: string;
  product_name: string;
  image: string;
  color: string;
  model: Compat;
  qty: number;
  unit_price_cents: number;
  line_total_cents: number;
};

type OrderOut = {
  id: string;
  status: string;
  currency: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  items: OrderItemOut[];
};

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

type CheckoutSessionResp = { checkout_url: string; order_id: string };

type Compat = "iPhone 16" | "iPhone 16 Pro";

// --------- Pomoćna komponenta ---------
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-bold">{children}</h2>;
}

// --------- Kartica proizvoda ---------
function ProductCard({
  product,
  model,
  onAdd,
  onQuickView,
}: {
  product: Product;
  model: "iPhone 16" | "iPhone 16 Pro";
  onAdd: (p: Product, color: string) => void;
  onQuickView: (p: Product, color: string) => void;
}) {
  const [cardColor, setCardColor] = useState<string>(product.colors[0]);

  return (
    <div className="rounded-lg border overflow-hidden bg-white shadow h-[50vh] md:h-[45vh] lg:h-[42vh] flex flex-col">
      {/* Slika ~58% visine kartice */}
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-[58%] object-cover"
      />

      {/* Sadržaj ispod */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-semibold leading-snug">{product.name}</div>
            <div className="text-xs text-gray-500 mt-0.5">{model}</div>
          </div>
          <div className="text-lg font-bold">{EUR(BASE_PRICE)}</div>
        </div>

        <label className="block text-xs text-gray-600 mt-3">Boja</label>
        <select
          value={cardColor}
          onChange={(e) => setCardColor(e.target.value)}
          className="mt-1 w-full px-3 py-2 rounded-lg border"
        >
          {product.colors.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        {/* Akcije na dnu kartice */}
        <div className="mt-3 flex gap-2 mt-auto">
          <Button className="flex-1" onClick={() => onAdd(product, cardColor)}>
            Dodaj
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => onQuickView(product, cardColor)}>
            Brzi pregled
          </Button>
        </div>
      </div>
    </div>
  );
}

// --------- Bočni "drawer" ---------
function Drawer({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: React.ReactNode; title: string; }) {
  return (
    <div className={`fixed inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
      <div onClick={onClose} className={`absolute inset-0 bg-black/30 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} />
      <aside className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow border-l transition-transform ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="px-2 py-1 rounded-md border cursor-pointer">Zatvori</button>
        </div>
        <div className="p-4 overflow-y-auto h-[calc(100%-56px)]">{children}</div>
      </aside>
    </div>
  );
}

export default function Page() {
  // Globalna košarica (pojednostavljeno)
  const [cart, setCart] = useState<{ model: "iPhone 16" | "iPhone 16 Pro"; color: string; qty: number; productId: string }[]>([]);
  const cartCount = useMemo(() => cart.reduce((s, it) => s + it.qty, 0), [cart]);
  const [products, setProducts] = useState<Product[]>([]);
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
  
  // Filtar kataloga — padajući izbornik
  const [catalogModel, setCatalogModel] = useState<"iPhone 16" | "iPhone 16 Pro">("iPhone 16");
  
  const [quote, setQuote] = useState<QuoteOut | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [creating, setCreating] = useState(false);


  // Stanje za Brzi pregled
  const [quick, setQuick] = useState<{ product: Product; color: string } | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const productById = (id: string) => products.find(p => p.id === id)!;

  const filtered = useMemo(
    () => products.filter((p) => p.compat.includes(catalogModel)),
    [products, catalogModel] // ← add products here
  );
  
  const formOk =
    customer.first_name.trim() &&
    customer.last_name.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email) &&
    customer.address_line1.trim() &&
    customer.city.trim() &&
    customer.postal_code.trim() &&
    customer.country.trim();

  const addToCart = (p: Product, color: string) =>
    setCart((c) => {
      const idx = c.findIndex(
        (x) => x.productId === p.id && x.model === catalogModel && x.color === color
      );
      if (idx !== -1) {
        // ista stavka → povećaj količinu
        const next = [...c];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      // nova stavka
      return [...c, { model: catalogModel, color, qty: 1, productId: p.id }];
    });

  const keyOf = (x: { productId: string; model: "iPhone 16" | "iPhone 16 Pro"; color: string }) =>
    `${x.productId}-${x.model}-${x.color}`;
  
  const goTop = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  
  const scrollToId = (id: string) => {
    const el = document.querySelector(id) as HTMLElement | null;
    if (!el) return;
    const headerOffset = 72; // visina sticky headera
    const y = el.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  };
  
  const items = useMemo(
    () => cart.map(it => ({
      product_id: it.productId,
      qty: it.qty,
      color: it.color,
      model: it.model,
    })),
    [cart]
  );
  
  useEffect(() => {
    if (items.length === 0) { setQuote({ items: [], subtotal_cents: 0, shipping_cents: 0, total_cents: 0 }); return; }
    const fetchQuote = async () => {
      try {
        setQuoting(true);
        const res = await API.post<QuoteOut>("/checkout/quote", items);
        setQuote(res.data);
      } finally {
        setQuoting(false);
      }
    };
    fetchQuote();
  }, [items]); // now stable because items is memoized
  
  useEffect(() => {
    API.get('/products').then((res)=>{
      setProducts(res.data)
    }).catch(()=>{
      console.log("Error loading products")
    })
  }, []);
  
  const handleCheckout = async () => {
    if (cart.length === 0) return;
  
    if (!formOk) {
      alert("Molimo ispunite podatke za dostavu (ime, prezime, email, adresu).");
      return;
    }
  
    try {
      setCreating(true);
  
      const items = cart.map(it => ({
        product_id: it.productId,
        qty: it.qty,
        color: it.color,
        model: it.model, // must be exactly "iPhone 16" or "iPhone 16 Pro"
      }));
  
      // 🔧 map flat fields -> nested address expected by backend
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
            country: customer.country, // e.g. "HR"
          },
        },
      };
  
      const res = await API.post<CheckoutSessionResp>("/checkout/session", payload);
      window.location.href = res.data.checkout_url;
      console.log(res.data)
    } catch (err: any) {
      // show exact FastAPI validation errors to debug quickly
      const detail = err?.response?.data?.detail ?? err.message;
      console.error("Error starting checkout", err);
      alert(`Greška pri pokretanju plaćanja:\n${JSON.stringify(detail, null, 2)}`);
    } finally {
      setCreating(false);
    }
  };


  return (
    <div id="top" className="min-h-screen text-gray-900 bg-gradient-to-br from-amber-50 via-white to-emerald-50">
      {/* Zaglavlje */}
      <Header
        cartCount={cartCount}
        setCartOpen = {setCartOpen}
      />


      <main className="max-w-7xl mx-auto px-4 py-20 md:py-28 space-y-16">
        {/* Hero */}
      <section className="flex flex-col md:flex-row items-center gap-10 md:gap-14 min-h-[52vh] md:min-h-[60vh]">
        {/* Tekst – uvijek prvi */}
        <div className="w-full md:flex-1">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.05] tracking-tight mb-5">
            Maskica {EUR(BASE_PRICE)}.
          </h1>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.05] tracking-tight mb-5">
            Staklo {EUR(BASE_PRICE)}.
          </h1>
          <p className="mt-4 text-gray-600 max-w-prose">
            Jednostavan dizajn. Isporuka u roku 0-2 dana.
          </p>
          <div className="mt-6 flex gap-3">
            {/*<button*/}
            {/*  onClick={() => scrollToId("#catalog")}*/}
            {/*  className="px-4 py-2 rounded-lg bg-black text-white font-medium"*/}
            {/*>*/}
            {/*  Otvori katalog*/}
            {/*</button>*/}
          </div>
        </div>
      
        {/* Slika – uvijek druga */}
<div className="w-full md:flex-1 relative h-[56vh] sm:h-[62vh] md:h-[70vh] lg:h-[78vh] xl:h-[84vh] lg:-mr-12 xl:-mr-20">
  {/* glow/sjena može ostati kako jest */}

  <img
    src="/iphone16pro_4k_transparent_png8.png"
    alt="Maskica za iPhone"
    className="absolute bottom-10 left-1/2 -translate-x-1/2
               w-[100%] sm:w-[115%] md:w-[130%] lg:w-[145%] xl:w-[160%]
               max-w-none drop-shadow-2xl animate-floatY
               pointer-events-none select-none"
  />
</div>
      </section>

        {/* Katalog s izborom modela */}
        <section id="catalog" className="space-y-4 scroll-mt-24 md:scroll-mt-28">
          <SectionTitle>Istraži ponudu</SectionTitle>
          <div className="grid sm:grid-cols-3 gap-4 items-end">
            <div className="sm:col-span-1">
              <label className="text-sm">Odaberi model</label>
              <select
                value={catalogModel}
                onChange={(e) => setCatalogModel(e.target.value as "iPhone 16" | "iPhone 16 Pro")}
                className="mt-1 w-full px-3 py-2 rounded-lg border"
              >
                <option value="iPhone 16">iPhone 16</option>
                <option value="iPhone 16 Pro">iPhone 16 Pro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
            {filtered.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                model={catalogModel}
                onAdd={(prod, color) => addToCart(prod, color)}
                onQuickView={(prod, color) => setQuick({ product: prod, color })}
              />
            ))}
            {!filtered.length && (
              <div className="col-span-full text-center text-gray-600 border rounded-lg p-10">Nema rezultata.</div>
            )}
          </div>
        </section>

        {/* Zašto mi? */}
        <section id="why" className="grid md:grid-cols-3 gap-4 scroll-mt-24 md:scroll-mt-28">
          {[
            { title: "Veleuvoz", text: "Kupujemo izravno od tvornica." },
            { title: "Jedinstvena cijena", text: "Svaka maskica košta samo 3 €." },
            { title: "EU skladište", text: "Brza dostava i jednostavan povrat." },
          ].map((f) => (
            <div key={f.title} className="rounded-lg border p-4">
              <div className="font-medium">{f.title}</div>
              <p className="text-sm text-gray-600 mt-1">{f.text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t mt-16" id="contact">
        <div className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold">€</div>
              <span className="font-semibold">Maske za mobitel</span>
            </div>
            <p className="mt-3 text-sm text-gray-600 max-w-prose">
              Uvozimo izravno od proizvođača i šaljemo u naš EU hub — zato možemo prodavati vrhunske maskice za 3 €.
              PDV uključen.
            </p>
          </div>
          <div id="faq">
            <h4 className="font-semibold">Česta pitanja</h4>
            <ul className="mt-3 text-sm text-gray-700 space-y-2">
              <li><span className="font-medium">Zašto tako jeftino?</span> Kupujemo na veliko i držimo niske marže — ušteda ide vama.</li>
              <li><span className="font-medium">Povrat?</span> Povrat novca u roku 30 dana, bez pitanja.</li>
              <li><span className="font-medium">Dostava?</span> 48–72 h u HR/EU. Besplatno iznad 25 €.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Kontakt</h4>
            <p className="mt-3 text-sm text-gray-700">Email: support@eurocase.example</p>
            <p className="text-sm text-gray-700">Instagram: @eurocase.shop</p>
            <p className="text-xs text-gray-500 mt-4">© {new Date().getFullYear()} Maske za mobitel — Sva prava pridržana.</p>
          </div>
        </div>
      </footer>

      {/* Brzi pregled — model je zaključan na odabrani */}
      <Drawer open={!!quick} onClose={() => setQuick(null)} title={quick ? quick.product.name : "Brzi pregled"}>
        {quick && (
          <div className="space-y-4">
            <img src={quick.product.image} alt={quick.product.name} className="w-full h-48 object-cover rounded-lg border" />
            <div className="text-sm text-gray-600">Model: <span className="font-medium">{catalogModel}</span> (zaključano)</div>

            <div>
              <label className="text-sm">Boja</label>
              <select
                value={quick.color}
                onChange={(e) => setQuick({ product: quick.product, color: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-lg border"
              >
                {quick.product.colors.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => { addToCart(quick.product, quick.color); setQuick(null); }}>
                Dodaj u košaricu • {EUR(BASE_PRICE)}
              </Button>
              <Button variant="outline" onClick={() => setQuick(null)}>Zatvori</Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Košarica */}
      <Drawer open={cartOpen} onClose={() => setCartOpen(false)} title="Vaša košarica">
        <div className="space-y-3">
          {cart.length === 0 && <p className="text-sm text-gray-600">Vaša košarica je prazna.</p>}
          {cart.map((it) => {
            const p = productById(it.productId);
            const itemKey = keyOf(it);

            return (
              <div
                key={itemKey}
                className="flex items-center justify-between gap-3 rounded-lg p-3 border bg-white"
              >
                <div className="flex items-center gap-3">
                  <img src={p.image} alt={p.name} className="w-16 h-16 rounded-md object-cover border" />
                  <div>
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-gray-600">{it.model} · {it.color}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="w-7 h-7 border rounded cursor-pointer"
                    onClick={() =>
                      setCart((c) =>
                        c.map((x) => keyOf(x) === itemKey ? { ...x, qty: Math.max(1, x.qty - 1) } : x)
                      )
                    }
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm">{it.qty}</span>
                  <button
                    className="w-7 h-7 border rounded cursor-pointer"
                    onClick={() =>
                      setCart((c) =>
                        c.map((x) => keyOf(x) === itemKey ? { ...x, qty: x.qty + 1 } : x)
                      )
                    }
                  >
                    +
                  </button>
                </div>

                <div className="text-sm font-medium">{EUR(it.qty * BASE_PRICE)}</div>
                <button
                  className="text-sm text-red-600 cursor-pointer"
                  onClick={() => setCart((c) => c.filter((x) => keyOf(x) !== itemKey))}
                >
                  Ukloni
                </button>
              </div>
            );
          })}
        </div>
        <div className="mt-4 border-t pt-3">
          {(() => {
            // prefer server quote; fall back to client-side quick calc if quote missing
            if (!quote) {
              const subtotal = cart.reduce((s, it) => s + it.qty * BASE_PRICE, 0);
              const shipping = subtotal >= 25 || subtotal === 0 ? 0 : 2.00;
              const total = subtotal + shipping;
              return (
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span>Zbroj stavki</span><span>{EUR(subtotal)}</span></div>
                  <div className="flex justify-between">
                    <span>Dostava</span><span>{shipping ? EUR(shipping) : "Besplatno"}</span></div>
                  <div className="flex justify-between font-semibold text-base mt-1">
                    <span>Ukupno</span><span>{EUR(total)}</span></div>
                  <Button
                    className="w-full mt-3 cursor-pointer"
                    disabled={cart.length === 0 || creating}
                    onClick={handleCheckout}
                  >
                    {creating ? "Kreiram…" : "Plati (simulacija)"}
                  </Button>
                </div>
              );
            }
            
            const subtotal = quote.subtotal_cents / 100;
            const shipping = quote.shipping_cents / 100;
            const total = quote.total_cents / 100;
            
            return (
              <div className="space-y-1 text-sm">
                {quoting && <div className="text-xs text-gray-500">Računam cijene…</div>}
                <div className="flex justify-between"><span>Zbroj stavki</span><span>{EUR(subtotal)}</span></div>
                <div className="flex justify-between">
                  <span>Dostava</span><span>{shipping ? EUR(shipping) : "Besplatno"}</span></div>
                <div className="flex justify-between font-semibold text-base mt-1">
                  <span>Ukupno</span><span>{EUR(total)}</span></div>
                {/* NEW – Customer details form */}
                {cartCount>0
                  ?(<div className="mt-6 space-y-3 border rounded-lg p-3 bg-white">
                  <div className="font-medium">Podaci za dostavu</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      className="border rounded-md px-3 py-2"
                      placeholder="Ime"
                      value={customer.first_name}
                      onChange={(e) => setCustomer({...customer, first_name: e.target.value})}
                    />
                    <input
                      className="border rounded-md px-3 py-2"
                      placeholder="Prezime"
                      value={customer.last_name}
                      onChange={(e) => setCustomer({...customer, last_name: e.target.value})}
                    />
                  </div>
                  <input
                    className="border rounded-md px-3 py-2 w-full"
                    placeholder="Email"
                    type="email"
                    value={customer.email}
                    onChange={(e) => setCustomer({...customer, email: e.target.value})}
                  />
                  <input
                    className="border rounded-md px-3 py-2 w-full"
                    placeholder="Adresa (ulica i broj)"
                    value={customer.address_line1}
                    onChange={(e) => setCustomer({...customer, address_line1: e.target.value})}
                  />
                  <input
                    className="border rounded-md px-3 py-2 w-full"
                    placeholder="Adresa 2 (opcionalno)"
                    value={customer.address_line2 ?? ""}
                    onChange={(e) => setCustomer({...customer, address_line2: e.target.value})}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      className="border rounded-md px-3 py-2"
                      placeholder="Grad"
                      value={customer.city}
                      onChange={(e) => setCustomer({...customer, city: e.target.value})}
                    />
                    <input
                      className="border rounded-md px-3 py-2"
                      placeholder="Poštanski broj"
                      value={customer.postal_code}
                      onChange={(e) => setCustomer({...customer, postal_code: e.target.value})}
                    />
                    <input
                      className="border rounded-md px-3 py-2"
                      placeholder="Država (npr. HR)"
                      maxLength={2}
                      value={customer.country}
                      onChange={(e) => setCustomer({...customer, country: e.target.value.toUpperCase()})}
                    />
                  </div>
                  {!formOk && (
                    <div className="text-xs text-red-600">Molimo ispunite sva obavezna polja. Trenutno dostavljamo samo unutar RH.</div>
                  )}
                </div>
                  ):(<></>)}
                <Button
                  className="w-full mt-3 cursor-pointer"
                  disabled={cart.length === 0 || creating || quoting}
                  onClick={handleCheckout}
                >
                  {creating ? "Kreiram…" : "Plati (simulacija)"}
                </Button>
              </div>
            );
          })()}
        </div>
      </Drawer>
    </div>
  );
}
