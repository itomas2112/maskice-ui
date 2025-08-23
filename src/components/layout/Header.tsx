// src/components/layout/Header.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart } from "lucide-react";
import React from "react";
import { usePathname, useRouter } from "next/navigation";

type HeaderProps = {
  cartCount: number;
  showBasket?: boolean;
  setCartOpen?: (value: boolean) => void;
};

export function Header({ setCartOpen, cartCount, showBasket = true }: HeaderProps) {
  const goTop = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const pathname = usePathname();
  const router = useRouter();
  
  
  const goHomeOrTop = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push("/");
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/60 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Wordmark */}
        <Link
          href="/"
          prefetch={false}
          onClick={(e) => {
            // If we're already on the homepage, just scroll to top smoothly
            if (pathname === "/") {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className="flex items-center gap-2 select-none cursor-pointer"
          aria-label="Na vrh stranice"
        >
          <span className="inline-flex h-6 w-6 rounded-full bg-gradient-to-tr from-zinc-900 to-zinc-700 ring-1 ring-black/10 shadow-sm" />
          <span className="font-semibold tracking-tight">maskino</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* ❤️ Favorites link */}
          <Link href="/liked" aria-label="Favorite products">
            <Button
              variant="outline"
              className="relative cursor-pointer rounded-full h-9 px-3 min-w-[10vh]
                         shadow-sm hover:shadow-md transition hover:bg-black/5 active:scale-[0.98] group"
            >
              <Heart className="h-5 w-5 transition-transform group-hover:scale-110" />
            </Button>
          </Link>

          {/* 🛒 Cart */}
          {showBasket && setCartOpen && (
            <Button
              variant="outline"
              onClick={() => setCartOpen(true)}
              className="relative cursor-pointer rounded-full h-9 pl-6 pr-7 min-w-[15vh]
                         shadow-sm hover:shadow-md transition hover:bg-black/5 active:scale-[0.98] group"
            >
              <ShoppingCart className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
              <span className="font-medium">Cart</span>

              {cartCount > 0 && (
                <span
                  className="ml-2 inline-flex items-center justify-center text-[11px] leading-none
                             w-5 h-5 rounded-full bg-black text-white ring-2 ring-white tabular-nums"
                >
                  {cartCount}
                </span>
              )}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
