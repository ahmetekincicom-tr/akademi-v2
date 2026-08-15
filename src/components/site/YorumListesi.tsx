"use client";

import { useEffect, useRef } from "react";
import { TestimonialCard } from "@/components/site/TestimonialCard";
import type { Yorum } from "@/lib/icerik";

/**
 * Yorumlar: tek sürekli tuğla düzeni, kartlar kaydırdıkça beliriyor.
 *
 * Önce kartlar gruplar halinde DOM'a ekleniyordu ve her grup kendi sütun
 * kabındaydı. Sonuç, grup sınırlarında sütun boyu boşluklardı — düzeltmeye
 * çalıştığımız sorunun aynısı, sadece daha seyrek. Tek kap kullanmak da
 * çözüm değildi: yeni kart eklendiğinde tarayıcı bütün sütunları baştan
 * dengeleyip okunmakta olan kartları yerinden oynatıyordu.
 *
 * Çözüm ikisini de bırakmak: bütün kartlar en baştan tek bir sütun kabında
 * duruyor (dolayısıyla hiç boşluk ve hiç yeniden dengeleme yok), belirme
 * animasyonu ise DOM'a ekleme yerine görünürlükle tetikleniyor.
 *
 * Yorumlar zaten tek sorguyla geliyor; parça parça DOM'a eklemenin ağ tarafında
 * bir kazancı yoktu.
 */
export function YorumListesi({ yorumlar }: { yorumlar: Yorum[] }) {
  const kok = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const kap = kok.current;
    if (!kap) return;

    const kartlar = Array.from(kap.querySelectorAll<HTMLElement>("[data-yorum]"));

    /*
      Sıra önemli.

      1) Ekranda olanları açık işaretle, 2) sonra gizleme kuralını devreye al.
      Ters sırada olsaydı ilk boyamadan sonra üstteki kartlar bir kare
      kaybolup geri gelirdi. Gözlemci geri çağrısı eşzamansız olduğu için ona
      bırakılamıyor.
    */
    for (const kart of kartlar) {
      if (kart.getBoundingClientRect().top < window.innerHeight) kart.dataset.gorunur = "1";
    }
    kap.classList.add("yorum-akis-hazir");

    const gozlemci = new IntersectionObserver(
      (girisler) => {
        for (const g of girisler) {
          if (!g.isIntersecting) continue;
          (g.target as HTMLElement).dataset.gorunur = "1";
          // Bir kez belirdi, bir daha izlemeye gerek yok.
          gozlemci.unobserve(g.target);
        }
      },
      // Kart ekrana girmeden 120px önce başlasın: animasyon biterken kart
      // tam görüş alanında oluyor, kullanıcı bulanık hali yakalamıyor.
      { rootMargin: "0px 0px 120px 0px" },
    );

    for (const kart of kartlar) {
      if (!kart.dataset.gorunur) gozlemci.observe(kart);
    }

    return () => gozlemci.disconnect();
  }, [yorumlar]);

  return (
    <section className="mx-auto max-w-[1240px] px-5 pb-24 sm:px-8">
      {/*
        Gizleme kuralı "yorum-akis-hazir" sınıfına bağlı ve o sınıf yalnızca
        JavaScript çalıştığında ekleniyor. Betik yüklenmezse kartlar olduğu gibi
        görünüyor — yorumlar sayfanın asıl içeriği, animasyon uğruna
        kaybolmamalı.
      */}
      <div ref={kok} className="yorum-akis columns-1 gap-[22px] md:columns-2 lg:columns-3">
        {yorumlar.map((y) => (
          // break-inside-avoid: kart iki sütuna bölünmesin.
          <div key={y.id} data-yorum className="mb-[22px] break-inside-avoid">
            <TestimonialCard metin={y.metin} isim={y.isim} rol={y.rol} />
          </div>
        ))}
      </div>
    </section>
  );
}
