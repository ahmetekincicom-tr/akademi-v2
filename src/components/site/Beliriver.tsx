"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Bölümlerin kaydırdıkça yumuşakça belirmesi (fade-up).
 *
 * Sayfa içeriğindeki her <section> gözleniyor; görünüme girdiğinde aşağıdan
 * hafifçe yükselerek beliriyor. Böylece aşağı indikçe bölümler kademeli geliyor.
 *
 * ————————————————————————————————————————————————————————————
 * SADECE TANITIM YÜZÜNDE çalışıyor. Panel (/panel) ve yönetim (/kontrol-)
 * birer uygulama ekranı; oralarda içerik animasyonla gizlenip beliremez —
 * bir katılımcı "eğitim kayıtları sayfaya bakarken kayboldu" diye bildirdi ve
 * sebebi tam olarak buydu: efekt kök template.tsx'te olduğu için paneli de
 * sarıyor, <section>'lar bir an opacity:0 kalıp takılabiliyordu. Uygulama
 * ekranlarında içerik HER ZAMAN olduğu gibi, kararlı basılmalı.
 *
 * ————————————————————————————————————————————————————————————
 * Kurşun geçirmez olmalı. İçerik JavaScript'e bağlı biçimde gizlenip onunla
 * geri geliyor; herhangi bir zamanlama aksaklığında ekrandaki bir bölüm gizli
 * takılırsa kullanıcı "sayfa açılmadı, header var içerik yok, yenileyince
 * geliyor" görür. Bu yüzden:
 *  1) Ekranda (kısmen bile) olan HER bölüm anında görünür işaretleniyor.
 *  2) Gözlemci ekran dışındakileri kaydırınca belirtiyor.
 *  3) Güvenlik ağı: kısa süre sonra ekranda olup hâlâ gizli kalmış bir bölüm
 *     varsa zorla görünür yapılıyor — hiçbir içerik kalıcı olarak görünmez
 *     kalamaz.
 *  4) Geri/ileri (bfcache) dönüşünde de görünürlük garanti ediliyor.
 * Gizleme kuralı yalnızca JS varken eklenen "beliriver-hazir" sınıfına bağlı;
 * script hiç yüklenmezse tüm içerik olduğu gibi görünüyor.
 *
 * Başlık (<header>) ve alt bilgi (<footer>) birer <section> olmadığı için hiç
 * etkilenmiyor — sabit dururlar.
 */

/** Belirme efektinin çalışmayacağı, uygulama gibi davranan alanlar. */
function uygulamaEkrani(yol: string): boolean {
  return yol.startsWith("/panel") || yol.startsWith("/kontrol-");
}

export function Beliriver({ children }: { children: React.ReactNode }) {
  const kok = useRef<HTMLDivElement>(null);
  const yol = usePathname();
  const efektAcik = !uygulamaEkrani(yol);

  useEffect(() => {
    if (!efektAcik) return;
    const kap = kok.current;
    if (!kap) return;

    // Hareket azaltma tercihinde hiç gizleme yapma; içerik olduğu gibi kalsın.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const hedefler = Array.from(kap.querySelectorAll<HTMLElement>("section"));
    if (!hedefler.length) return;

    // Ekranda (kısmen bile) olan bir bölüm mü? top < innerHeight ise üstü
    // görünür alanın içinde demektir. Böyle bir bölüm ASLA gizlenmemeli.
    const ekranda = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    };

    // 1) Ekranda olanları hemen görünür işaretle (flaşsız, animasyonsuz).
    for (const el of hedefler) {
      if (ekranda(el)) el.dataset.gorunur = "1";
    }
    // 2) Gizleme kuralını şimdi devreye al.
    kap.classList.add("beliriver-hazir");

    const belirt = (el: HTMLElement) => {
      el.dataset.gorunur = "1";
    };

    const gozlemci = new IntersectionObserver(
      (girisler) => {
        for (const g of girisler) {
          if (!g.isIntersecting) continue;
          belirt(g.target as HTMLElement);
          // Bir kez belirdi; tekrar izlemeye gerek yok.
          gozlemci.unobserve(g.target);
        }
      },
      // Bölüm ekrana biraz girince başlasın; animasyon biterken tam görünür oluyor.
      { rootMargin: "0px 0px -10% 0px" },
    );

    for (const el of hedefler) {
      if (!el.dataset.gorunur) gozlemci.observe(el);
    }

    /*
      GÜVENLİK AĞI. Gözlemci ya da ölçüm herhangi bir sebeple şaşarsa, ekranda
      olan bir bölüm gizli takılabilir. Kısa bir süre sonra: ekranda olup hâlâ
      gizli kalmış her bölümü zorla görünür yap. Ekran dışındakilere dokunma —
      onlar kaydırınca gelmeye devam etsin.
    */
    const guvenlikAgi = window.setTimeout(() => {
      for (const el of hedefler) {
        if (!el.dataset.gorunur && ekranda(el)) belirt(el);
      }
    }, 1200);

    // Geri/ileri (bfcache) ile dönüldüğünde de ekrandakiler kesin görünsün.
    const geriDonus = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      for (const el of hedefler) {
        if (ekranda(el)) belirt(el);
      }
    };
    window.addEventListener("pageshow", geriDonus);

    return () => {
      gozlemci.disconnect();
      window.clearTimeout(guvenlikAgi);
      window.removeEventListener("pageshow", geriDonus);
    };
  }, [efektAcik]);

  // Uygulama ekranlarında sarmalayıcı sınıfı hiç eklenmiyor: CSS gizleme kuralı
  // devreye girmez, içerik kararlı basılır.
  return (
    <div ref={kok} className={efektAcik ? "beliriver-kap" : undefined}>
      {children}
    </div>
  );
}
