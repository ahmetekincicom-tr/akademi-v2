"use client";

import { useEffect, useRef, useState } from "react";
import { TestimonialCard } from "@/components/site/TestimonialCard";
import type { Yorum } from "@/lib/icerik";

const SAYFA = 9;

/**
 * Yorumlar sayfa sayfa açılıyor.
 *
 * Yüzlerce yorum tek seferde basıldığında ilk boyama gecikiyor ve sayfa uzun
 * bir kaydırma çubuğuyla açılıyordu. Burada ilk {SAYFA} kart basılıyor,
 * listenin sonundaki nöbetçi öğe görünür olunca bir sonraki grup ekleniyor.
 *
 * Kaydırma olayı DİNLENMİYOR: IntersectionObserver işi tarayıcının kendi
 * derleme hattında yapıyor, scroll dinleyicisi ise her karede JavaScript
 * çalıştırıp kaydırmayı takılmalı hale getiriyor.
 */
export function YorumListesi({ yorumlar }: { yorumlar: Yorum[] }) {
  const [gorunen, setGorunen] = useState(SAYFA);
  const nobetci = useRef<HTMLDivElement>(null);

  const hepsiGeldi = gorunen >= yorumlar.length;

  useEffect(() => {
    if (hepsiGeldi) return;
    const hedef = nobetci.current;
    if (!hedef) return;

    const gozlemci = new IntersectionObserver(
      ([giris]) => {
        if (giris.isIntersecting) setGorunen((n) => n + SAYFA);
      },
      // Nöbetçi ekrana girmeden 400px önce tetikleniyor: kullanıcı listenin
      // sonuna vardığında kartlar çoktan yerinde oluyor, boşluk görmüyor.
      { rootMargin: "400px" },
    );

    gozlemci.observe(hedef);
    return () => gozlemci.disconnect();
  }, [hepsiGeldi, gorunen]);

  return (
    <section className="mx-auto max-w-[1240px] px-5 pb-24 sm:px-8">
      <div className="grid grid-cols-1 gap-[22px] md:grid-cols-2 lg:grid-cols-3">
        {yorumlar.slice(0, gorunen).map((y, i) => (
          <div
            key={y.id}
            className="yorum-giris"
            /*
              Gecikme kart SIRASINA göre değil, GRUP İÇİNDEKİ sırasına göre:
              yüzüncü kartta 100 kat gecikme olsaydı kart görünene kadar
              saniyeler geçerdi. Modülo ile her grup baştan sayıyor.
            */
            style={{ animationDelay: `${(i % SAYFA) * 60}ms` }}
          >
            <TestimonialCard metin={y.metin} isim={y.isim} rol={y.rol} />
          </div>
        ))}
      </div>

      {!hepsiGeldi && <div ref={nobetci} aria-hidden className="h-px" />}
    </section>
  );
}
