"use client";

import React from "react";
import { Header } from "@/components/layout/Header";
import { PageFooter } from "@/components/layout/Footer";
import { useShop } from "@/contexts/shop";
import { useCatalogFilters } from "@/hooks/useCatalogFilters";

const BUSINESS = {
  name: "Freelen – obrt za trgovinu",
  brand: "maskino.com.hr",
  email: "maskino.cshr@gmail.com",
};

const LastUpdated: React.FC = () => {
  const formatted = new Date().toLocaleDateString("hr-HR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return <p className="text-sm text-gray-600 mt-2">Ažurirano: {formatted}</p>;
};

const LegalNoticeContent: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 text-gray-800 leading-relaxed">
      <h1 className="text-3xl font-bold mb-2">Pravne napomene</h1>
      <LastUpdated />

      <p className="mt-6">
        Svako korištenje web-mjesta <strong>{BUSINESS.brand}</strong> podložno
        je ovim uvjetima. Sadržaj objavljen na ovoj web stranici smije se
        kopirati samo u nekomercijalne svrhe i za individualnu upotrebu, uz
        poštivanje svih autorskih i drugih vlasničkih prava te navedenih
        ograničenja prava. Sadržaj se ne smije dalje kopirati, reproducirati ili
        distribuirati bez izričitog pisanog pristanka{" "}
        <strong>{BUSINESS.name}</strong>.
      </p>

      <p className="mt-4">
        <strong>{BUSINESS.name}</strong> ulaže razuman napor kako bi informacije
        na web-mjestu bile točne i ažurne, no ne jamči njihovu potpunost niti
        točnost. Korisnici sadržaj stranice koriste na vlastitu odgovornost.{" "}
        <strong>{BUSINESS.name}</strong> ne odgovara za direktne, posredne ili
        posljedične štete nastale korištenjem ili nemogućnošću korištenja
        stranice.
      </p>

      <p className="mt-4">
        Ova stranica može sadržavati poveznice na vanjske stranice nad kojima{" "}
        <strong>{BUSINESS.name}</strong> nema kontrolu.{" "}
        <strong>{BUSINESS.name}</strong> ne preuzima odgovornost za sadržaj
        takvih stranica niti za moguće posljedice njihove uporabe. Zadržavamo
        pravo izmjene sadržaja stranice u bilo kojem trenutku i iz bilo kojeg
        razloga.
      </p>

      <p className="mt-10 text-sm text-gray-600">
        © {year} {BUSINESS.name}. Sva prava pridržana.
      </p>
    </main>
  );
};

export default function LegalNoticePage() {
  const { setCartOpen } = useShop();
  const { type, setType, setPhone, availablePhones } = useCatalogFilters();

  return (
    <>
      <Header
        setCartOpen={setCartOpen}
        setType={setType}
        availablePhones={availablePhones}
        setPhone={setPhone}
        type={type}
      />

      <LegalNoticeContent />

      <PageFooter />
    </>
  );
}
