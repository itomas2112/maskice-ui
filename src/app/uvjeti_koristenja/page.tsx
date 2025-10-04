"use client";

import React from "react";
import {Header} from "@/components/layout/Header";
import {useShop} from "@/contexts/shop";
import {useCatalogFilters} from "@/hooks/useCatalogFilters";
import {PageFooter} from "@/components/layout/Footer";

// ▶︎ Postavite podatke o poslovnom subjektu na jednom mjestu
const BUSINESS = {
  name: "Freelen – obrt za trgovinu",
  brand: "maskino.com.hr",
  oib: "54570065282",
  address: "Sokolgradska ulica 84, Zagreb",
  email: "maskino.cshr@gmail.com",
  deliveryCarrier: "GLS / HP Express / DPD / BoxNow i slično",
};

const LastUpdated: React.FC = () => {
  const date = new Date();
  const formatted = date.toLocaleDateString("hr-HR", { day: "2-digit", month: "2-digit", year: "numeric" });
  return (
    <p className="text-sm text-gray-600 mt-2">Ažurirano: {formatted}</p>
  );
};

const SectionTitle: React.FC<React.PropsWithChildren> = ({ children }) => (
  <h2 className="text-xl font-semibold mt-8 mb-3">{children}</h2>
);

const List: React.FC<React.PropsWithChildren> = ({ children }) => (
  <ul className="list-disc ml-6 space-y-1">{children}</ul>
);

const A: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a href={href} className="underline">{children}</a>
);

const TermsOfService: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-gray-800 leading-relaxed">
      <h1 className="text-3xl font-bold mb-2">Uvjeti korištenja i prodaje</h1>
      <LastUpdated />

      <p className="mt-6">
        Ovim općim uvjetima uređuju se odnosi između kupca (Kupac) i trgovca (Trgovac)
        vezano uz korištenje internetske trgovine {BUSINESS.brand}, uvjete i način naručivanja
        proizvoda, cijene, plaćanje, isporuku, odgovornost za materijalne nedostatke,
        reklamacije, raskid ugovora, zaštitu osobnih podataka te druga pitanja bitna za sklapanje
        ugovora o kupoprodaji na daljinu.
      </p>

      <p className="mt-4">
        Na ove uvjete primjenjuju se Zakon o zaštiti potrošača, Zakon o elektroničkoj trgovini,
        Zakon o obveznim odnosima te ostali važeći propisi Republike Hrvatske.
      </p>

      <SectionTitle>Trgovac</SectionTitle>
      <p>
        Naziv: <strong>{BUSINESS.name}</strong><br />
        Sjedište: {BUSINESS.address}<br />
        OIB: {BUSINESS.oib}<br />
        E-mail: <A href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</A><br />
        {BUSINESS.brand} nastupa u svoje ime putem internetske trgovine.
      </p>

      <SectionTitle>Izmjene Uvjeta</SectionTitle>
      <p>
        Trgovac zadržava pravo izmjene ovih Uvjeta u bilo kojem trenutku. Sve izmjene bit će
        objavljene na {BUSINESS.brand} i primjenjuju se na kupnje zaključene nakon objave.
        Kupac je dužan provjeriti važeće Uvjete prije svake kupnje.
      </p>

      <SectionTitle>Kupac</SectionTitle>
      <p>
        Kupac može biti svaka punoljetna i poslovno sposobna fizička osoba ili pravna osoba.
        Ugovor u ime maloljetnika i/ili osoba bez poslovne sposobnosti mogu zaključiti njihovi
        zakonski zastupnici/skrbnici.
      </p>

      <SectionTitle>Registracija i narudžba</SectionTitle>
      <List>
        <li>Proizvodi se naručuju elektroničkim putem putem košarice.</li>
        <li>Ugovor je sklopljen kada Trgovac elektroničkom poštom dostavi potvrdu narudžbe.</li>
        <li>Korisnik je odgovoran za čuvanje pristupnih podataka i točnost dostavljenih informacija.</li>
      </List>

      <SectionTitle>Cijene</SectionTitle>
      <List>
        <li>Sve cijene su maloprodajne i izražene u eurima (EUR) s PDV-om, osim ako je drugačije navedeno.</li>
        <li>Važeća je cijena u trenutku zaprimanja narudžbe.</li>
        <li>Akcijske ponude vrijede do isteka zaliha ili do povlačenja/izmjene.</li>
      </List>

      <SectionTitle>Načini plaćanja</SectionTitle>
      <List>
        <li>Opća uplatnica / virman / uplata u banci, pošti ili FINI.</li>
        <li>Internet bankarstvo.</li>
        <li>Kartično plaćanje (npr. Mastercard, Visa, Maestro) preko certificiranog pružatelja usluge naplate.</li>
        <li>Pouzećem (ako je omogućeno).</li>
      </List>
      <p className="text-sm text-gray-700 mt-2">
        Kartična plaćanja obavljaju se preko sigurnog sustava treće strane (SSL, PCI-DSS). {BUSINESS.name} ne pohranjuje podatke o karticama.
      </p>

      <SectionTitle>Dostava i preuzimanje</SectionTitle>
      <List>
        <li>Dostava se vrši na području Republike Hrvatske putem {BUSINESS.deliveryCarrier} ili drugog dostavnog partnera.</li>
        <li>Trošak dostave i procijenjeni rok isporuke prikazuju se u košarici prije završetka kupnje.</li>
        <li>Rok isporuke za dostupne artikle je najčešće 2–5 radnih dana od vidljive uplate, osim ako je drukčije naznačeno.</li>
        <li>Subote, nedjelje i blagdani ne ubrajaju se u rok isporuke.</li>
      </List>

      <SectionTitle>Odbijanje/preuzimanje pošiljke</SectionTitle>
      <p>
        U slučaju neopravdanog odbijanja preuzimanja ispravne i neoštećene robe, Trgovac može umanjiti
        povrat za izravne troškove isporuke i povrata.
      </p>

      <SectionTitle>Materijalni nedostaci i jamstva</SectionTitle>
      <p>
        Odgovornost za materijalne nedostatke uređena je Zakonom o obveznim odnosima i Zakonom o zaštiti potrošača.
        Kupac je dužan bez odgađanja obavijestiti Trgovca o vidljivim nedostacima, a najkasnije u roku propisanom zakonom.
      </p>

      <SectionTitle>Reklamacije</SectionTitle>
      <p>
        Reklamacije i pritužbe podnose se na adresu e-pošte <A href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</A>.
        Preporučujemo da priložite broj narudžbe, opis problema i fotografije (ako su relevantne).
      </p>

      <SectionTitle>Jednostrani raskid ugovora (rok 14 dana)</SectionTitle>
      <List>
        <li>Kupac ima pravo, bez navođenja razloga, jednostrano raskinuti ugovor u roku od 14 dana od preuzimanja robe.</li>
        <li>Za ostvarenje prava može se koristiti EU Obrazac za jednostrani raskid ugovora ili drugom nedvosmislenom izjavom poslanom e-poštom na {BUSINESS.email}.</li>
        <li>Kupac je dužan robu vratiti bez odgađanja, najkasnije u roku od 14 dana od obavijesti o raskidu, te snosi izravne troškove povrata, osim ako je drugačije ugovoreno.</li>
        <li>Trgovac će izvršiti povrat uplata bez odgađanja, a najkasnije u roku od 14 dana od zaprimanja obavijesti o raskidu, pri čemu može zadržati povrat do povrata robe ili dostave dokaza da je roba poslana natrag.</li>
      </List>

      <SectionTitle>Isključenja prava na raskid</SectionTitle>
      <p>
        Pravo na raskid ne postoji u slučajevima predviđenim čl. 79. Zakona o zaštiti potrošača (npr. roba izrađena po specifikaciji kupca, zapečaćena roba koja nije pogodna za vraćanje iz zdravstvenih/higijenskih razloga ako je otpečaćena i sl.).
      </p>

      <SectionTitle>Slike i informacije o proizvodima</SectionTitle>
      <p>
        Fotografije i opisi proizvoda informativne su prirode i ne moraju u potpunosti odgovarati stvarnom proizvodu (npr. nijanse boja). Trgovac zadržava pravo očitih pogrešaka u opisu ili cijeni te će u takvom slučaju bez odgađanja obavijestiti Kupca i omogućiti otkaz ili izmjenu narudžbe.
      </p>

      <SectionTitle>Online rješavanje sporova (ODR)</SectionTitle>
      <p>
        Platformi Europske komisije za online rješavanje potrošačkih sporova možete pristupiti ovdje: {" "}
        <A href="https://webgate.ec.europa.eu/odr/main/index.cfm?event=main.home.show&lng=HR">ODR platforma</A>.
      </p>

      <SectionTitle>Prigovori potrošača</SectionTitle>
      <p>
        Pisani prigovor možete podnijeti putem e-pošte na <A href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</A> ili poštom na {BUSINESS.address}.
        Trgovac je dužan potvrditi primitak i odgovoriti u roku od 15 dana.
      </p>

      <SectionTitle>Nadležnost i mjerodavno pravo</SectionTitle>
      <p>
        Za sporove je mjerodavno pravo Republike Hrvatske, a nadležan je stvarno nadležni sud prema sjedištu Trgovca, uz primjenu pravila o zaštiti potrošača.
      </p>

      <SectionTitle>Zaštita osobnih podataka</SectionTitle>
      <p>
        Obrada osobnih podataka uređena je Politikom privatnosti objavljenom na {BUSINESS.brand}. Upite o osobnim podacima možete uputiti na {BUSINESS.email}.
      </p>

      <SectionTitle>Kolačići</SectionTitle>
      <p>
        {BUSINESS.brand} koristi kolačiće (cookies) radi funkcionalnosti i statistike. Više informacija nalazi se u Politici kolačića.
      </p>

      <p className="mt-10 text-sm text-gray-600">
        Korištenjem ovih internetskih stranica potvrđujete da ste upoznati i suglasni s ovim Uvjetima.
      </p>
    </div>
  );
};

export default function Tos() {
  
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
      <TermsOfService />
      <PageFooter />
    </>
  
  )
  
}
