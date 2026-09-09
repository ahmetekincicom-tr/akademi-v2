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
 * birer uygulama ekranı; oralarda içerik animasyonla gizlenip beliremez.
 *
 * ————————————————————————————————————————————————————————————
 * GİZLEME ARTIK BÖLÜM BAZINDA VE İSTEĞE BAĞLI.
 *
 * Eskiden sarmalayıcıya bir sınıf ekleniyor ve o sınıf ALTINDAKİ BÜTÜN
 * bölümleri baştan gizliyordu; görünür olmak için JavaScript'in her bölümü tek
 * tek işaretlemesi gerekiyordu. Bu, hata durumunda en kötü sonucu veren
 * kurulum: JavaScript bir sayfada çalışmazsa içeriğin TAMAMI görünmez kalıyor,
 * ziyaretçi başlık ve alt bilgisi olan bomboş bir sayfa görüyordu.
 *
 * Şimdi tersi: hiçbir şey varsayılan olarak gizli değil. JavaScript yalnızca
 * EKRAN DIŞINDAKİ bölümleri tek tek "gizli" diye işaretliyor, sonra kaydırdıkça
 * açıyor. Böylece işaretlenmemiş bir bölüm — ölçüm şaşsa da, gözlemci kurulmasa
 * da, script hiç yüklenmese de — olduğu gibi görünüyor. Efektin bozulması
 * artık en fazla "animasyon olmadı" demek; "sayfa açılmadı" değil.
 *
 * Üstüne üç güvenlik ağı:
 *  1) Ekranda (kısmen bile) olan bölüme hiç dokunulmuyor — anında görünür.
 *  2) Kısa süre sonra ekranda olup hâlâ gizli kalmış bölüm varsa zorla açılıyor.
 *  3) Geri/ileri (bfcache) dönüşünde ekrandakiler tekrar garanti ediliyor.
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

  /*
    BAĞIMLILIK "yol" — her gezinmede yeniden kurulmak zorunda.

    Eskiden burada yalnızca `efektAcik` yazıyordu. O değer tanıtım sayfaları
    arasında hep aynı (true) kaldığı için etki YENİDEN ÇALIŞMIYORDU: eğitim
    listesinden bir eğitime geçildiğinde gözlemci hâlâ önceki sayfanın artık
    var olmayan bölümlerini izliyor, yeni sayfanın bölümlerine ise kimse
    dokunmuyordu. Gizleme kuralı sarmalayıcıda durduğu için yeni bölümlerin
    hepsi gizli kalıyor, ziyaretçi başlık ve alt bilgisi olan boş bir sayfa
    görüyordu; yenileyince düzelmesinin sebebi buydu.

    template.tsx'in her gezinmede yeniden bağlanacağı varsayımına
    güvenilmiyor: ölçüldü, bağlanmıyor.
  */
  useEffect(() => {
    if (!efektAcik) return;
    const kap = kok.current;
    if (!kap) return;

    // Hareket azaltma tercihinde hiç gizleme yapma; içerik olduğu gibi kalsın.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const hedefler = Array.from(kap.querySelectorAll<HTMLElement>("section"));
    if (!hedefler.length) return;

    // Ekranda (kısmen bile) olan bir bölüm mü? Böyle bir bölüm ASLA gizlenmiyor.
    const ekranda = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    };

    const ac = (el: HTMLElement) => {
      el.dataset.beliriver = "gorunur";
    };

    const gozlemci = new IntersectionObserver(
      (girisler) => {
        for (const g of girisler) {
          if (!g.isIntersecting) continue;
          ac(g.target as HTMLElement);
          // Bir kez belirdi; tekrar izlemeye gerek yok.
          gozlemci.unobserve(g.target);
        }
      },
      // Bölüm ekrana biraz girince başlasın; animasyon biterken tam görünür oluyor.
      { rootMargin: "0px 0px -10% 0px" },
    );

    // Yalnızca ekran DIŞINDAKİLER gizleniyor. Ekrandakiler olduğu gibi kalıyor:
    // ne gizlenip yeniden beliriyor ne de bir flaş oluşuyor.
    const gizlenenler: HTMLElement[] = [];
    for (const el of hedefler) {
      if (ekranda(el)) continue;
      el.dataset.beliriver = "gizli";
      gizlenenler.push(el);
      gozlemci.observe(el);
    }

    /*
      GÜVENLİK AĞI. Ölçüm ya da gözlemci herhangi bir sebeple şaşarsa (geç
      yüklenen görsel yüzünden kayan düzen, kaydırma konumunun geri
      yüklenmesi…) ekranda olan bir bölüm gizli takılabilir. Kısa süre sonra
      böyle kalanları zorla aç. Ekran dışındakilere dokunma — onlar kaydırınca
      gelmeye devam etsin.
    */
    const guvenlikAgi = window.setTimeout(() => {
      for (const el of gizlenenler) {
        if (el.dataset.beliriver === "gizli" && ekranda(el)) ac(el);
      }
    }, 1200);

    // Geri/ileri (bfcache) ile dönüldüğünde de ekrandakiler kesin görünsün.
    const geriDonus = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      for (const el of gizlenenler) {
        if (ekranda(el)) ac(el);
      }
    };
    window.addEventListener("pageshow", geriDonus);

    return () => {
      gozlemci.disconnect();
      window.clearTimeout(guvenlikAgi);
      window.removeEventListener("pageshow", geriDonus);
      /*
        Sayfadan çıkarken gizli kalan olursa aç. Bu bölümler birazdan DOM'dan
        kalkacak, ama gezinme iptal edilir ya da aynı bölümler yeniden
        kullanılırsa gizli takılmasınlar.
      */
      for (const el of gizlenenler) ac(el);
    };
  }, [efektAcik, yol]);

  return <div ref={kok}>{children}</div>;
}
