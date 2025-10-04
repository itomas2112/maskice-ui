"use client";

import React from "react";
import {Header} from "@/components/layout/Header";
import {PageFooter} from "@/components/layout/Footer";
import {useShop} from "@/contexts/shop";
import {useCatalogFilters} from "@/hooks/useCatalogFilters";

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-gray-800 leading-relaxed">
      <h1 className="text-3xl font-bold mb-8">Politika privatnosti</h1>

      <p className="mb-4">
        Poštovani kupci i posjetitelji web-trgovine <strong>maskino.com.hr</strong>, 
        s primjenom Opće uredbe o zaštiti osobnih podataka (EU) 2016/679 dobivate 
        više prava na zaštitu i privatnost svojih osobnih podataka.
      </p>

      <p className="mb-4">
        Svaka osobna informacija dostavljena ili prikupljena na stranici{" "}
        <strong>maskino.com.hr</strong> je kontrolirana od strane obrta{" "}
        <strong>Freelen</strong>, registriranog u Republici Hrvatskoj, sa sjedištem u{" "}
        <em>Sokolgradska ulica 84, Zagreb</em>.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        Koje osobne podatke prikupljamo?
      </h2>
      <ul className="list-disc ml-6 mb-4">
        <li>Osnovne osobne podatke (ime, prezime)</li>
        <li>Kontakt podatke (adresa, e-mail, broj mobitela)</li>
        <li>Informacije o načinu komunikacije s nama (npr. newsletter)</li>
        <li>Podatke o vašim narudžbama i komunikaciji s nama</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        Pravne osnove za obradu podataka
      </h2>
      <p className="mb-4">Vaše podatke obrađujemo:</p>
      <ul className="list-disc ml-6 mb-4">
        <li>uz vašu suglasnost (koju možete opozvati u bilo kojem trenutku)</li>
        <li>radi sklapanja i izvršenja ugovora (npr. kupoprodaje)</li>
        <li>radi poštivanja zakonskih obveza (npr. izdavanje računa)</li>
        <li>zbog legitimnog interesa (npr. unapređenje usluga, sigurnost sustava)</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">Svrhe obrade podataka</h2>
      <ul className="list-disc ml-6 mb-4">
        <li>izvršenje i dostavu narudžbi</li>
        <li>komunikaciju s vama (upiti, obavijesti)</li>
        <li>poboljšanje proizvoda i usluga</li>
        <li>marketinške aktivnosti (uz privolu)</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">Koliko dugo čuvamo podatke?</h2>
      <p className="mb-4">
        Podatke čuvamo onoliko dugo koliko je potrebno za izvršenje svrhe obrade ili koliko to nalaže zakon. 
        Financijsku dokumentaciju čuvamo minimalno 10 godina, a podatke na temelju privole do njenog opoziva.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Kako štitimo podatke?</h2>
      <p className="mb-4">
        Primjenjujemo tehničke i organizacijske mjere zaštite (sigurnosne kopije, enkripcija, 
        kontrola pristupa) kako bismo spriječili neovlašteni pristup, gubitak ili zloupotrebu podataka.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">S kime dijelimo podatke?</h2>
      <ul className="list-disc ml-6 mb-4">
        <li>dostavne službe radi isporuke narudžbi</li>
        <li>pružatelji usluga (hosting, e-mail, marketing)</li>
        <li>državna tijela kada je to zakonski obvezno</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">Vaša prava</h2>
      <ul className="list-disc ml-6 mb-4">
        <li>pristup svojim podacima</li>
        <li>ispravak ili dopunu podataka</li>
        <li>brisanje podataka (pravo na zaborav)</li>
        <li>ograničenje obrade podataka</li>
        <li>prenosivost podataka</li>
        <li>pravo na prigovor u marketinške svrhe</li>
        <li>pravo na pritužbu AZOP-u</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">Povlačenje suglasnosti</h2>
      <p className="mb-4">
        Suglasnost možete opozvati u bilo kojem trenutku slanjem zahtjeva na{" "}
        <a href="mailto:maskino.cshr@gmail.com" className="text-blue-600 underline">
          maskino.cshr@gmail.com
        </a>.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Kontakt</h2>
      <p className="mb-4">
        <strong>Freelen – obrt za trgovinu</strong> <br />
        E-mail:{" "}
        <a href="mailto:maskino.cshr@gmail.com" className="text-blue-600 underline">
          maskino.cshr@gmail.com
        </a>{" "}
        <br />
        Adresa: <em>Sokolgradska ulica 84, 10000 Zagreb</em>
      </p>

      <p className="mt-8 text-sm text-gray-600">
        Ova Politika privatnosti stupa na snagu dana <em>29.09.2025</em>.
      </p>
    </div>
  );
};

export default function Pp() {
  
  const { setCartOpen } = useShop();
  const { type, setType, setPhone, availablePhones } = useCatalogFilters();
  
  return(
    <>
      <Header
        setCartOpen={setCartOpen}
        setType={setType}
        availablePhones={availablePhones}
        setPhone={setPhone}
        type={type}
      />
      <PrivacyPolicy />
      <PageFooter/>
    </>
    )
}


