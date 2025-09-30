// src/components/layout/Header.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, Menu, X, ChevronLeft } from "lucide-react";
import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { typeToSlug, phoneToSlug } from "@/lib/slug";
import {useCart} from "@/hooks/useCart";

type HeaderProps = {
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
  const [intermType, setIntermType] = React.useState<string>("")
  const { cartCount } = useCart()

  useEffect(() => setMounted(true), []);
  const router = useRouter();
  
  const flyoutRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showPhones) return;
    function handleClick(e: MouseEvent) {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target as Node)) {
        setShowPhones(false);
        setIntermType("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showPhones]);


  // lock page scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.documentElement.classList.add("overflow-hidden", "touch-pan-y");
      setMobileStep("root");
    } else {
      document.documentElement.classList.remove("overflow-hidden", "touch-pan-y");
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
    setIntermType(t);
    setShowPhones(showPhonePicker);
  };
  
  const mobilePickType = (t: "Case" | "Glass") => {
    setIntermType(t);
    setMobileStep("phones");
  };
  

  const choosePhone = (ph: string) => {
    intermType && router.push(`/shop/${typeToSlug(intermType)}/${phoneToSlug(ph)}`);
    setType(intermType)
    setPhone?.(ph);
    setShowPhones(false);
    setMobileOpen(false);
    setMobileStep("root");
  };

  // --- UI helper for active state on desktop glass pills ---
  const selectedType = (intermType || type) as "Case" | "Glass" | undefined;
  const glassBase =
    "inline-flex items-center px-4 py-2 rounded-full border transition " +
    "border-white/30 bg-white/10 backdrop-blur supports-[backdrop-filter]:bg-white/10 " +
    "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35)] " +
    "hover:bg-white/20 hover:shadow-lg hover:shadow-black/10 hover:ring-1 hover:ring-black/10 " +
    "active:scale-[0.98] cursor-pointer select-none";
  const glassActive =
    "bg-white/40 text-gray-900 border-white/50 ring-2 ring-black/10 font-semibold";

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
        
        {/* Center nav (desktop only) */}
        <nav
          className="hidden sm:flex justify-self-center items-center gap-3"
          aria-label="Kategorije"
        >
          <button
            type="button"
            onClick={() => desktopPickType("Case", true)}
            className={[
              glassBase,
              selectedType === "Case" ? glassActive : "text-gray-700"
            ].join(" ")}
          >
            Maske
          </button>
        
          <button
            type="button"
            onClick={() => desktopPickType("Glass", true)}
            className={[
              glassBase,
              selectedType === "Glass" ? glassActive : "text-gray-700"
            ].join(" ")}
          >
            Zaštitno staklo
          </button>
        </nav>


        {/* Right */}
        <div className="flex items-center gap-2 justify-self-end">
          <Link href="/liked" aria-label="Favorite products">
            <Button
              variant="outline"
              className="relative cursor-pointer rounded-full h-11 px-4 shadow-sm hover:shadow-md transition hover:bg-black/5 active:scale-[0.98] group"
            >
              <Heart className="h-6 w-6 transition-transform group-hover:scale-110" />
            </Button>
          </Link>

          {showBasket && setCartOpen && (
            <Button
              variant="outline"
              onClick={() => setCartOpen(true)}
              className="relative cursor-pointer rounded-full h-11 pl-6 pr-7 min-w-[15vh] shadow-sm hover:shadow-md transition hover:bg-black/5 active:scale-[0.98] group"
            >
              <ShoppingCart className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
              <span className="font-medium">Košarica</span>
              {cartCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center text-[11px] leading-none w-5 h-5 rounded-full bg-black text-white ring-2 ring-white tabular-nums">
                  {cartCount}
                </span>
              )}
            </Button>
          )}

          {/* Hamburger */}
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
          ref={flyoutRef}
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

      {/* Mobile full-screen menu */}
      {mounted && mobileOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] sm:hidden bg-white" role="dialog" aria-modal="true">
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
