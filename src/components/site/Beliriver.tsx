"use client";

import { useEffect, useRef } from "react";

/**
 * Bölümlerin kaydırdıkça yumuşakça belirmesi (fade-up).
 *
 * Sayfa içeriğindeki her <section> gözleniyor; görünüme girdiğinde aşağıdan
 * hafifçe yükselerek beliriyor. Böylece aşağı indikçe bölümler kademeli geliyor.
 *
 * Neden bu desen (YorumListesi ile aynı):
 *  1) Önce EKRANDA OLAN bölümler "görünür" işaretleniyor — üst kısım anında,
 *     animasyonsuz ve FLAŞSIZ geliyor (eski beyaz geçiş sorunu buydu).
 *  2) Sonra gizleme kuralı (opacity/translate) devreye alınıyor; yalnızca
 *     ekran dışındaki bölümler gizli kalıp kaydırınca beliriyor.
 * Sıra bu yüzden önemli: ters olsaydı üstteki bölümler bir kare kaybolup
 * geri gelirdi.
 *
 * Başlık (<header>) ve alt bilgi (<footer>) birer <section> olmadığı için hiç
 * etkilenmiyor — sabit dururlar. Gizleme kuralı yalnızca JS varken (bu bileşen
 * çalışınca) eklenen sınıfa bağlı; script yüklenmezse tüm içerik olduğu gibi
 * görünüyor.
 */
export function Beliriver({ children }: { children: React.ReactNode }) {
  const kok = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const kap = kok.current;
    if (!kap) return;

    // Hareket azaltma tercihinde hiç gizleme yapma; içerik olduğu gibi kalsın.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const hedefler = Array.from(kap.querySelectorAll<HTMLElement>("section"));
    if (!hedefler.length) return;

    // 1) Ekranda olanları hemen görünür işaretle (flaşsız, animasyonsuz).
    for (const el of hedefler) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.9) el.dataset.gorunur = "1";
    }
    // 2) Gizleme kuralını şimdi devreye al.
    kap.classList.add("beliriver-hazir");

    const gozlemci = new IntersectionObserver(
      (girisler) => {
        for (const g of girisler) {
          if (!g.isIntersecting) continue;
          (g.target as HTMLElement).dataset.gorunur = "1";
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

    return () => gozlemci.disconnect();
  }, []);

  return (
    <div ref={kok} className="beliriver-kap">
      {children}
    </div>
  );
}
