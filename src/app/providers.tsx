"use client";
import React from "react";
import { ShopProvider } from "@/contexts/shop";
import CartDrawer from "@/components/CartDrawer";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ShopProvider>
      {children}
      {/* Global overlays mounted once, available on every page */}
      <CartDrawer />
    </ShopProvider>
  );
}
