"use client";

import { useEffect, useRef, useState } from "react";
import { TestimonialCard } from "@/components/site/TestimonialCard";
import type { Yorum } from "@/lib/icerik";

const SAYFA = 9;

/**
 * Yorumlar sayfa sayfa açılıyor ve tuğla (masonry) düzeninde diziliyor.
 *
 * Izgara düzeninde her SATIRIN yüksekliği o satırdaki en uzun karta göre
 * belirleniyordu; iki satırlık bir yorum, on satırlık bir yorumun yanında
 * altında kocaman bir boşlukla duruyordu. CSS sütunları kartları yüksekliğe
 * göre akıtıyor, boşluk kalmıyor.
 *
 * Yükleme IntersectionObserver ile: kaydırma olayı dinlenseydi her karede
 * JavaScript çalışır ve düzeltmeye çalıştığımız akıcılığı bozardı.
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

  /*
    Her grup KENDİ sütun kabında.

    Tek bir kapsayıcı olsaydı yeni grup eklendiğinde tarayıcı bütün sütunları
    baştan dengeler ve okunmakta olan kartlar gözün önünde yer değiştirirdi.
    Grup başına ayrı kap, eklemenin önceki kartlara dokunmamasını sağlıyor.
    Karşılığında grup sınırlarında küçük bir hizasızlık kalıyor — sütunlar
    kendi içinde dengelendiği için o da neredeyse düz çıkıyor.
  */
  const gruplar: Yorum[][] = [];
  for (let i = 0; i < gorunen && i < yorumlar.length; i += SAYFA) {
    gruplar.push(yorumlar.slice(i, i + SAYFA));
  }

  return (
    <section className="mx-auto max-w-[1240px] px-5 pb-24 sm:px-8">
      {gruplar.map((grup, g) => (
        <div key={g} className="columns-1 gap-[22px] md:columns-2 lg:columns-3">
          {grup.map((y, i) => (
            <div
              key={y.id}
              // break-inside-avoid: kart iki sütuna bölünmesin.
              className="yorum-giris mb-[22px] break-inside-avoid"
              // Gecikme grup içi sıraya göre: yüzüncü kartta 100 kat gecikme
              // olsaydı kart görünene kadar saniyeler geçerdi.
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <TestimonialCard metin={y.metin} isim={y.isim} rol={y.rol} />
            </div>
          ))}
        </div>
      ))}

      {!hepsiGeldi && <div ref={nobetci} aria-hidden className="h-px" />}
    </section>
  );
}
