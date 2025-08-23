// src/components/layout/Header.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, Menu, X, ChevronLeft } from "lucide-react";
import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { typeToSlug, phoneToSlug } from "@/lib/slug";

type HeaderProps = {
  cartCount: number;
  showBasket?: boolean;
  setCartOpen?: (value: boolean) => void;
  type: string | undefined
  setType: (value: string) => void;            // expects "Case" | "Glass"
  availablePhones: string[];
  setPhone?: (phone: string) => void;
};

type MobileStep = "root" | "phones";

export function Header({
  setCartOpen,
  cartCount,
  showBasket = true,
  setType,
  type,
  availablePhones,
  setPhone
}: HeaderProps) {
  const pathname = usePathname();
  const [showPhones, setShowPhones] = React.useState(false);   // desktop flyout
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [mobileStep, setMobileStep] = React.useState<MobileStep>("root");
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => setMounted(true), []);
  const router = useRouter();

  // lock page scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.documentElement.classList.add("overflow-hidden", "touch-pan-y");
      // always start at root when opening
      setMobileStep("root");
    } else {
      document.documentElement.classList.remove("overflow-hidden", "touch-pan-y");
      // optional: reset back to root on close
      setMobileStep("root");
    }
    return () => document.documentElement.classList.remove("overflow-hidden", "touch-pan-y");
  }, [mobileOpen]);

  const goTopIfHome = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const desktopPickType = (t: "Case" | "Glass", showPhonePicker: boolean) => {
    setType(t);
    setShowPhones(showPhonePicker);
  };
  
  const mobilePickType = (t: "Case" | "Glass") => {
    setType(t);
    setMobileStep("phones");
  };

  // Shared: choose phone and close menus/flyouts
  const choosePhone = (ph: string) => {
  
    type&&router.push(`/shop/${typeToSlug(type)}/${phoneToSlug(ph)}`);
  
    // Close UI
    setPhone?.(ph);
    setShowPhones(false);
    setMobileOpen(false);
    setMobileStep("root");
  };

  return (
    <header className="relative sticky top-0 z-40 border-b border-black/5 bg-white/60 backdrop-blur">
      {/* Top bar */}
      <div
        className="w-full max-w-none sm:max-w-7xl mx-auto px-2 sm:px-4 py-3
                   flex items-center justify-between
                   sm:grid sm:grid-cols-3"
      >
        {/* Left: brand */}
        <Link
          href="/"
          prefetch={false}
          onClick={goTopIfHome}
          className="flex items-center gap-2 select-none cursor-pointer justify-self-start"
          aria-label="Na vrh stranice"
        >
          <span className="inline-flex h-6 w-6 rounded-full bg-gradient-to-tr from-zinc-900 to-zinc-700 ring-1 ring-black/10 shadow-sm" />
          <span className="font-semibold tracking-tight">maskino</span>
        </Link>

        {/* Center: main nav (hidden on mobile; visible ≥ sm) */}
        <nav className="hidden sm:flex justify-self-center items-center gap-6 sm:gap-8 text-sm sm:text-[0.95rem]">
          <span
            className="cursor-pointer font-medium hover:underline underline-offset-4 text-gray-700"
            onClick={() => desktopPickType("Case", true)}
          >
            Maske
          </span>
          <span
            className="cursor-pointer font-medium hover:underline underline-offset-4 text-gray-700"
            onClick={() => desktopPickType("Glass", false)}
          >
            Zaštitno staklo
          </span>
        </nav>

        {/* Right: actions + hamburger (hamburger only on mobile) */}
        <div className="flex items-center gap-2 justify-self-end">
          <Link href="/liked" aria-label="Favorite products">
            <Button
              variant="outline"
              className="relative cursor-pointer rounded-full h-9 px-3 shadow-sm hover:shadow-md transition hover:bg-black/5 active:scale-[0.98] group"
            >
              <Heart className="h-5 w-5 transition-transform group-hover:scale-110" />
            </Button>
          </Link>

          {showBasket && setCartOpen && (
            <Button
              variant="outline"
              onClick={() => setCartOpen(true)}
              className="relative cursor-pointer rounded-full h-9 pl-6 pr-7 min-w-[15vh] shadow-sm hover:shadow-md transition hover:bg-black/5 active:scale-[0.98] group"
            >
              <ShoppingCart className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
              <span className="font-medium">Cart</span>
              {cartCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center text-[11px] leading-none w-5 h-5 rounded-full bg-black text-white ring-2 ring-white tabular-nums">
                  {cartCount}
                </span>
              )}
            </Button>
          )}

          {/* Hamburger: only show on mobile */}
          <Button
            type="button"
            variant="outline"
            aria-label="Otvori izbornik"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="sm:hidden h-9 w-9 p-0 rounded-full shadow-sm hover:shadow-md hover:bg-black/5 active:scale-[0.98] cursor-pointer"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Phones flyout (desktop/tablet only) */}
      {showPhones && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[min(92vw,28rem)] bg-white border rounded-xl shadow-xl p-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 z-50"
        >
          {availablePhones?.length ? (
            availablePhones.map((ph) => (
              <button
                key={ph}
                className="text-left text-sm px-3 py-2 rounded-lg hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-black/20 cursor-pointer select-none"
                onClick={() => choosePhone(ph)}
              >
                {ph}
              </button>
            ))
          ) : (
            <div className="text-sm text-gray-500 px-3 py-2">Nema dostupnih modela</div>
          )}
        </div>
      )}

      {/* Mobile full-screen menu with 2 steps via portal */}
      {mounted && mobileOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] sm:hidden bg-white" role="dialog" aria-modal="true">
            {/* Top bar inside the menu */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-black/10">
              <div className="flex items-center gap-2">
                {mobileStep === "phones" && (
                  <button
                    onClick={() => setMobileStep("root")}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-black/10 active:scale-95 cursor-pointer"
                    aria-label="Natrag"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                <span className="font-semibold tracking-tight">
                  {mobileStep === "root" ? "Izbornik" : "Odaberite model"}
                </span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-black/10 active:scale-95 cursor-pointer"
                aria-label="Zatvori izbornik"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Step content */}
            {mobileStep === "root" ? (
              <nav className="px-4 py-4">
                <div className="flex flex-col rounded-xl overflow-hidden border border-black/10 divide-y divide-black/10">
                  <button
                    className="w-full text-left px-4 py-5 font-medium active:scale-[0.99] cursor-pointer"
                    onClick={() => mobilePickType("Case")}
                  >
                    Maske
                  </button>
                  <button
                    className="w-full text-left px-4 py-5 font-medium active:scale-[0.99] cursor-pointer"
                    onClick={() => mobilePickType("Glass")}
                  >
                    Zaštitno staklo
                  </button>
                </div>
              </nav>
            ) : (
              <div className="px-4 py-4">
                <div className="rounded-xl border border-black/10">
                  {availablePhones?.length ? (
                    <ul className="max-h-[70vh] overflow-auto divide-y divide-black/10">
                      {availablePhones.map((ph) => (
                        <li key={ph}>
                          <button
                            className="w-full text-left px-4 py-4 active:scale-[0.99] cursor-pointer"
                            onClick={() => choosePhone(ph)}
                          >
                            {ph}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-gray-500 px-4 py-6">Nema dostupnih modela</div>
                  )}
                </div>
              </div>
            )}
          </div>,
          document.body
        )
      }
    </header>
  );
}
