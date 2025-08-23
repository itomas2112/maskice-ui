"use client";

import PhoneCaseStoreApp from "@/components/PhoneCaseStoreApp";
import { useShop } from "@/contexts/shop";

export default function Home() {
  const { cart, setCart, addToCart, quick, setQuick, cartOpen, setCartOpen } = useShop();
  return (
    <PhoneCaseStoreApp
      cart = {cart}
      setCart = {setCart}
      addToCart = {addToCart}
      quick = {quick}
      setQuick = {setQuick}
      cartOpen = {cartOpen}
      setCartOpen = {setCartOpen}
    />
  );
}
