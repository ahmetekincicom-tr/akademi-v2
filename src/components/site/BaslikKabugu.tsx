"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Başlık kabuğu — yalnızca ANA SAYFANIN EN ÜSTÜNDE saydam, aşağı kaydırınca
 * (ve diğer tüm sayfalarda) her zamanki beyaz cam başlık.
 *
 * Sunucu bileşeni olan PublicHeader'ı istemci tarafına almadan renk/duruma göre
 * uyarlamak için: bu kabuk <header>'ı çiziyor ve `saydam` durumunu bir React
 * bağlamıyla menü bağlantılarına (AktifNav) ve mobil menü düğmesine (MobilMenu)
 * veriyor. Logo iki sürümüyle basılıp CSS ile değiştiriliyor (data-saydam).
 *
 * Başlık yüksekliği ölçülüp `--baslik-h` değişkenine yazılıyor; ana sayfa
 * hero'su kendini bunun kadar yukarı çekip koyu zeminini saydam başlığın
 * arkasına yayıyor (bkz. app/page.tsx).
 */
const SaydamBaglam = createContext(false);
export const useBaslikSaydam = () => useContext(SaydamBaglam);

export function BaslikKabugu({ children }: { children: React.ReactNode }) {
  const anaSayfa = usePathname() === "/";
  const ref = useRef<HTMLElement>(null);
  const [tepede, setTepede] = useState(true);

  // Başlık yüksekliğini ölç → hero'nun altına kayması için (--baslik-h).
  useEffect(() => {
    const yaz = () => {
      const h = ref.current?.offsetHeight;
      if (h) document.documentElement.style.setProperty("--baslik-h", `${h}px`);
    };
    yaz();
    window.addEventListener("resize", yaz);
    return () => window.removeEventListener("resize", yaz);
  }, []);

  // Saydamlık yalnızca ana sayfada ve sayfanın en üstündeyken. Ana sayfa
  // dışında dinleyici yok; saydam zaten anaSayfa=false ile kapalı.
  useEffect(() => {
    if (!anaSayfa) return;
    const kontrol = () => setTepede(window.scrollY < 8);
    // İlk ölçüm bir kare sonra: efekt içinde eşzamanlı setState'ten kaçınıyoruz.
    const raf = requestAnimationFrame(kontrol);
    window.addEventListener("scroll", kontrol, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", kontrol);
    };
  }, [anaSayfa]);

  const saydam = anaSayfa && tepede;

  return (
    <SaydamBaglam.Provider value={saydam}>
      <header
        ref={ref}
        data-saydam={saydam ? "1" : undefined}
        className={`sticky top-0 z-60 border-b transition-[background-color,border-color] duration-300 ${
          saydam ? "border-transparent bg-transparent" : "border-ink/9 bg-white/90 yapiskan-baslik"
        }`}
      >
        {children}
      </header>
    </SaydamBaglam.Provider>
  );
}
