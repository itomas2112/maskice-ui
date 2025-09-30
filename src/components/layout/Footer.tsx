export function PageFooter() {
  return(
      <footer className="border-t mt-16" id="contact">
        <div className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2">
              <a href="#top" className="flex items-center gap-2 select-none" aria-label="Na vrh stranice">
                <span className="inline-flex h-6 w-6 rounded-full bg-gradient-to-tr from-zinc-900 to-zinc-700 ring-1 ring-black/10 shadow-sm" />
                <span className="font-semibold tracking-tight">maskino</span>
              </a>
            </div>
            <div className= "text-sm text-gray-700 space-y-2 mt-3">
              <a href="/politika_privatnosti">
                <span>Politika privatnosti</span>
              </a>
            </div>
            <div className= "text-sm text-gray-700 space-y-2 mt-3">
              <a href="/uvjeti_koristenja">
                <span>Uvjeti korištenja</span>
              </a>
            </div>
            <div className= "text-sm text-gray-700 space-y-2 mt-3">
              <a href="/pravne_napomene">
                <span>Pravne napomene</span>
              </a>
            </div>
          </div>
          <div id="faq">
            <h4 className="font-semibold">Česta pitanja</h4>
            <ul className="mt-3 text-sm text-gray-700 space-y-2">
              <li>
                <span className="font-bold">Zašto tako jeftino?  </span> Kupujemo na veliko i držimo niske marže.
              </li>
              <li>
                <span className="font-bold">Povrat?  </span> Povrat novca u roku 30 dana, ako je proizvod oštećen.
              </li>
              <li>
                <span className="font-bold">Dostava?   </span> Unutar 24 sata narudžba će biti uručena distribucijskom centru. Nakon toga dostava je najčešće unutar
                0–48h. Dostava je besplatna za narudžbe iznad 20€.
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Kontakt</h4>
            <p className="mt-3 text-sm text-gray-700">Email: maskino.support@gmail.com</p>
            <p className="text-xs text-gray-500 mt-4">© {new Date().getFullYear()} Maskino</p>
          </div>
        </div>
      </footer>
  )
}