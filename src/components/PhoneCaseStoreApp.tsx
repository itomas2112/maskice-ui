// src/app/page.tsx
// Minimalistički storefront s katalog filtrom (iPhone 16 / 16 Pro),
// karticama proizvoda s odabirom boje i "Brzi pregledom" s zaključanim modelom.

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import API from "@/lib/api"; // adjust path if needed
import { Header } from "@/components/layout/Header";
import { Check } from "lucide-react"; // ✅ tick icon

const EUR = (n: number) =>
  new Intl.NumberFormat("hr-HR", { style: "currency", currency: "EUR" }).format(n);
const BASE_PRICE = 3.0;

// Katalog — mali i fokusiran
type BackendProduct = {
  id: string;
  name: string;
  compat: string; // backend sends a single model string
  price_cents: number;
  variants: { colors: string; image: string }[];
};

type Product = {
  id: string;
  name: string;
  compat: Compat;                 // single model
  price_cents: number;
  colors: string[];
  imageByColor: Record<string, string>; // color -> image
  defaultColor: string;
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

const fixPublicPath = (p: string) => p.replace(/^\/public(\/|$)/, "/");

const normalize = (bp: BackendProduct): Product | null => {
  // guard for unknown models (keeps type safety while allowing backend to grow)
  const compat = bp.compat as Compat;
  if (!["iPhone 16", "iPhone 16 Pro"].includes(bp.compat)) return null;

  const imageByColor: Record<string, string> = {};
  const colors: string[] = [];
  for (const v of bp.variants ?? []) {
    const img = fixPublicPath(v.image);
    imageByColor[v.colors] = img;
    colors.push(v.colors);
  }
  const defaultColor = colors[0] ?? "Default";

  return {
    id: bp.id,
    name: bp.name,
    compat,
    price_cents: bp.price_cents,
    colors,
    imageByColor,
    defaultColor,
  };
};

// --------- Kartica proizvoda ---------
function ProductCard({
  product,
  model,
  onAdd,
  onQuickView,
}: {
  product: Product;
  model: Compat; // "iPhone 16" | "iPhone 16 Pro" (catalog filter selection)
  onAdd: (p: Product, color: string, qty: number) => void;
  onQuickView: (p: Product, color: string, qty: number) => void;
}) {
  const [cardColor, setCardColor] = useState<string>(product.defaultColor);
  const [quantity, setQuantity] = useState<number>(1);
  const [added, setAdded] = useState<boolean>(false);

  const price = product.price_cents / 100;
  const imgSrc = product.imageByColor[cardColor] ?? product.imageByColor[product.defaultColor];

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAdd(product, cardColor, quantity);
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
      <div className="basis-[75%] flex items-center justify-center p-2 overflow-hidden rounded-t-lg">
      <img
        src={imgSrc}
        alt={`${product.name} – ${cardColor}`}
        className="max-h-full max-w-full object-contain rounded-lg"
        draggable={false}
      />
      </div>

      {/* Content area */}
      <div className="basis-[25%] px-4 pb-4 pt-2 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-semibold leading-snug truncate">{product.name}</div>
            <div className="text-xs text-gray-500 mt-0.5">{model}</div>
          </div>
          <div className="text-lg font-bold shrink-0">{EUR(price)}</div>
        </div>

        {/* Color & Quantity */}
        <div className="flex flex-col">
          <label className="block text-xs text-gray-600 mb-1">Boja &amp; Količina</label>
          <div className="flex gap-2 sm:flex-row flex-col">
            <select
              value={cardColor}
              onChange={(e) => setCardColor(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border"
              onClick={(e) => e.stopPropagation()}
              aria-label="Odaberi boju"
            >
              {product.colors.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full sm:w-24 px-3 py-2 rounded-lg border"
              onClick={(e) => e.stopPropagation()}
              aria-label="Odaberi količinu"
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Add button */}
        <div className="mt-auto">
          <Button
            className={`w-full transition-colors duration-300 ${
              added ? "bg-gray-300 text-gray-700" : ""
            }`}
            onClick={handleAdd}
            disabled={added || quantity < 1}
          >
            {added ? (
              <span className="flex items-center justify-center gap-1">
                <Check className="w-4 h-4" /> Dodano
              </span>
            ) : (
              "Dodaj"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --------- Bočni "drawer" ---------
function Drawer({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className={`fixed inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/30 transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow border-l transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="px-2 py-1 rounded-md border cursor-pointer">
            Zatvori
          </button>
        </div>
        <div className="p-4 overflow-y-auto h-[calc(100%-56px)]">{children}</div>
      </aside>
    </div>
  );
}

export default function Page() {
  // Globalna košarica (pojednostavljeno)
  const [cart, setCart] = useState<
    { model: "iPhone 16" | "iPhone 16 Pro"; color: string; qty: number; productId: string }[]
  >([]);
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
  const [width, setWidth] = useState<number>(0);

  // Stanje za Brzi pregled
  const [quick, setQuick] = useState<{ product: Product; color: string } | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const productById = (id: string) => products.find((p) => p.id === id);

  const filtered = useMemo(
    () => products.filter((p) => p.compat === catalogModel),
    [products, catalogModel]
  );

  const formOk =
    customer.first_name.trim() &&
    customer.last_name.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email) &&
    customer.address_line1.trim() &&
    customer.city.trim() &&
    customer.postal_code.trim() &&
    customer.country.trim();

  const addToCart = (p: Product, color: string, qty: number = 1) =>
    setCart((c) => {
      const idx = c.findIndex(
        (x) => x.productId === p.id && x.model === catalogModel && x.color === color
      );
      if (idx !== -1) {
        const next = [...c];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty }; // 🔑 add exactly selected qty
        return next;
      }
      return [...c, { model: catalogModel, color, qty, productId: p.id }]; // 🔑 start with selected qty
    });

  const keyOf = (x: {
    productId: string;
    model: "iPhone 16" | "iPhone 16 Pro";
    color: string;
  }) => `${x.productId}-${x.model}-${x.color}`;

  const goTop = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const items = useMemo(
    () =>
      cart.map((it) => ({
        product_id: it.productId,
        qty: it.qty,
        color: it.color,
        model: it.model,
      })),
    [cart]
  );

  useEffect(() => {
    if (items.length === 0) {
      setQuote({ items: [], subtotal_cents: 0, shipping_cents: 0, total_cents: 0 });
      return;
    }
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
    API.get("/products")
      .then((res) => {
        const normalized: Product[] = (res.data as BackendProduct[])
          .map(normalize)
          .filter((x): x is Product => !!x);
        setProducts(normalized);
      })
      .catch(() => {
        console.error("Error loading products");
      });
  }, []);

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
      model: it.model, // must be exactly "iPhone 16" or "iPhone 16 Pro"
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

    const res = await API.post<CheckoutSessionResp>("/checkout/session", payload);
    window.location.href = res.data.checkout_url;
  } catch (err: unknown) {
    // narrow 'unknown' to extract a useful message without using 'any'
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

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    handleResize(); // set immediately on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = width < 980;

  return (
    <div
      id="top"
      className="min-h-screen text-gray-900 bg-gradient-to-br from-amber-50 via-white to-emerald-50"
    >
      {/* Zaglavlje */}
      <Header cartCount={cartCount} setCartOpen={setCartOpen} />

      <main className="max-w-7xl mx-auto px-4 py-20 md:py-28 space-y-16">
        {/* Hero */}
        <section
          className={`flex gap-10 md:gap-14 min-h-[30vh] ${
            !isMobile ? "flex-row justify-between" : "flex-col"
          } items-center`}
        >
          {/* Text – left or top */}
          <div
            className={`w-full flex-1 ${
              !isMobile ? "text-left items-start" : "text-center items-center"
            } flex flex-col`}
          >
            <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.05] tracking-tight mb-5">
              Maskica {EUR(BASE_PRICE)}.
            </h1>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.05] tracking-tight mb-5">
              Staklo {EUR(BASE_PRICE)}.
            </h1>
            <p className={`mt-4 text-gray-600 max-w-prose ${!isMobile ? "" : "mx-auto"}`}>
              Jednostavan dizajn. Isporuka u roku 0-2 dana.
            </p>
          </div>

          {/* Image – right or bottom */}
          <div className="w-full flex-1 relative flex items-center justify-center">
            <img
              src="/iphone16pro_4k_transparent_png8.png"
              alt="Maskica za iPhone"
              className="w-[80%] md:w-[100%] lg:w-[120%] max-h-[60vh] object-contain
                         drop-shadow-2xl animate-floatY
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
                onChange={(e) =>
                  setCatalogModel(e.target.value as "iPhone 16" | "iPhone 16 Pro")
                }
                className="mt-1 w-full px-3 py-2 rounded-lg border"
              >
                <option value="iPhone 16">iPhone 16</option>
                <option value="iPhone 16 Pro">iPhone 16 Pro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
            {filtered.map((p) => (
              <div key={p.id} className="max-w-[420px] w-full mx-auto">
                {/* ⬅️ NEW wrapper */}
                <ProductCard
                  product={p}
                  model={catalogModel}
                  onAdd={(prod, color, qty) => addToCart(prod, color, qty)}
                  onQuickView={(prod, color, qty) => setQuick({ product: prod, color })}
                />
              </div>
            ))}
            {!filtered.length && (
              <div className="col-span-full text-center text-gray-600 border rounded-lg p-10">
                Nema rezultata.
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t mt-16" id="contact">
        <div className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2">
              <a
                href="#top"
                onClick={goTop}
                className="flex items-center gap-2 select-none"
                aria-label="Na vrh stranice"
              >
                <span className="inline-flex h-6 w-6 rounded-full bg-gradient-to-tr from-zinc-900 to-zinc-700 ring-1 ring-black/10 shadow-sm" />
                <span className="font-semibold tracking-tight">maskino</span>
              </a>
            </div>
          </div>
          <div id="faq">
            <h4 className="font-semibold">Česta pitanja</h4>
            <ul className="mt-3 text-sm text-gray-700 space-y-2">
              <li>
                <span className="font-medium">Zašto tako jeftino?</span> Kupujemo na veliko i
                držimo niske marže.
              </li>
              <li>
                <span className="font-medium">Povrat?</span> Povrat novca u roku 30 dana, ako je
                proizvod oštećen.
              </li>
              <li>
                <span className="font-medium">Dostava?</span>Unutar 24 sata narudžba će biti
                uručena u BoxNow. Unutar 0–48h u HR. Besplatno iznad 20€. Dostava se radi preko{" "}
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Kontakt</h4>
            <p className="mt-3 text-sm text-gray-700">Email: support@eurocase.example</p>
            <p className="text-sm text-gray-700">Instagram: @eurocase.shop</p>
            <p className="text-xs text-gray-500 mt-4">
              © {new Date().getFullYear()} Maske za mobitel — Sva prava pridržana.
            </p>
          </div>
        </div>
      </footer>

      {/* Brzi pregled — model je zaključan na odabrani */}
      <Drawer
        open={!!quick}
        onClose={() => setQuick(null)}
        title={quick ? quick.product.name : "Brzi pregled"}
      >
        {quick && (
          <div className="space-y-4">
            <img
              src={quick.product.imageByColor[quick.color] ?? quick.product.imageByColor[quick.product.defaultColor]}
              alt={`${quick.product.name} – ${quick.color}`}
              className="w-full h-48 object-cover rounded-lg border"
            />
            <div className="text-sm text-gray-600">
              Model: <span className="font-medium">{catalogModel}</span> (zaključano)
            </div>

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
              <Button
                onClick={() => {
                  addToCart(quick.product, quick.color);
                  setQuick(null);
                }}
              >
                Dodaj u košaricu • {EUR(BASE_PRICE)}
              </Button>
              <Button variant="outline" onClick={() => setQuick(null)}>
                Zatvori
              </Button>
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
          
            // Gracefully handle missing/removed product
            if (!p) {
              return (
                <div
                  key={itemKey}
                  className="flex items-center justify-between gap-3 rounded-lg p-3 border bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-md border bg-gray-100" />
                    <div>
                      <div className="text-sm font-medium text-gray-500">Nepoznat proizvod</div>
                      <div className="text-xs text-gray-500">
                        {it.model} · {it.color}
                      </div>
                    </div>
                  </div>
                  <button
                    className="text-sm text-red-600 cursor-pointer"
                    onClick={() => setCart((c) => c.filter((x) => keyOf(x) !== itemKey))}
                  >
                    Ukloni
                  </button>
                </div>
              );
            }
          
            const unit = p.price_cents / 100;
            const img = p.imageByColor[it.color] ?? p.imageByColor[p.defaultColor];
          
            return (
              <div
                key={itemKey}
                className="flex items-center justify-between gap-3 rounded-lg p-3 border bg-white"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={img}
                    alt={`${p.name} – ${it.color}`}
                    className="w-16 h-16 rounded-md object-cover border"
                  />
                  <div>
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-gray-600">
                      {it.model} · {it.color}
                    </div>
                  </div>
                </div>
          
                {/* Qty controls */}
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
        </div>
        <div className="mt-4 border-t pt-3">
          {(() => {
            // prefer server quote; fall back to client-side quick calc if quote missing
            if (!quote) {
              const subtotal = cart.reduce((s, it) => {
                const p = productById(it.productId);
                return p ? s + it.qty * (p.price_cents / 100) : s; // 👈 use real product price
              }, 0);
              const shipping = subtotal >= 25 || subtotal === 0 ? 0 : 2.0;
              const total = subtotal + shipping;

              return (
                <div className="space-y-1 text-sm">
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

            // 👇 your existing quote-based rendering continues here...
            const subtotal = quote.subtotal_cents / 100;
            const shipping = quote.shipping_cents / 100;
            const total = quote.total_cents / 100;

            return (
              <div className="space-y-1 text-sm">
                {quoting && <div className="text-xs text-gray-500">Računam cijene…</div>}
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
                {/* NEW – Customer details form */}
                {cartCount > 0 ? (
                  <div className="mt-6 space-y-3 border rounded-lg p-3 bg-white">
                    <div className="font-medium">Podaci za dostavu</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        className="border rounded-md px-3 py-2"
                        placeholder="Ime"
                        value={customer.first_name}
                        onChange={(e) =>
                          setCustomer({ ...customer, first_name: e.target.value })
                        }
                      />
                      <input
                        className="border rounded-md px-3 py-2"
                        placeholder="Prezime"
                        value={customer.last_name}
                        onChange={(e) =>
                          setCustomer({ ...customer, last_name: e.target.value })
                        }
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
                      onChange={(e) =>
                        setCustomer({ ...customer, address_line1: e.target.value })
                      }
                    />
                    <input
                      className="border rounded-md px-3 py-2 w-full"
                      placeholder="Adresa 2 (opcionalno)"
                      value={customer.address_line2 ?? ""}
                      onChange={(e) =>
                        setCustomer({ ...customer, address_line2: e.target.value })
                      }
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
                        onChange={(e) =>
                          setCustomer({ ...customer, postal_code: e.target.value })
                        }
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
                ) : null}
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
