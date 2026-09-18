"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Public blog görselleri için lightbox.
 *
 * İçerik statik HTML (dangerouslySetInnerHTML) olarak render ediliyor; bu küçük
 * ada `img[data-lightbox="1"]` görsellerine tıklama/klavye ile büyütme davranışı
 * bağlıyor (olay delegasyonu → görsel sonradan eklense de çalışır).
 *
 * Görsel EDGE-TO-EDGE açılmıyor: koyu backdrop tüm ekranı kaplasa da görsel,
 * ortalanmış bir modal container İÇİNDE kontrollü bir maksimum genişlik/yükseklik
 * ile gösteriliyor (dokümantasyon tarzı). Stiller globals.css'te (.aea-lightbox*)
 * — min()/calc, medya sorguları ve prefers-reduced-motion orada net yönetiliyor.
 *
 * İlk açılış her zaman fit-to-screen; görsele tıklamak lightbox'ı KAPATMAZ,
 * gerçek boyut (zoom) ile fit arasında geçiş yapar. Kapatma yolları: X,
 * backdrop tıklaması, Escape. Yalnızca içerikteki lightboxEnabled görseller;
 * hero/kapak görseline uygulanmıyor (kapak zaten data-lightbox taşımıyor).
 */
const SECICI = '.blog-icerik img[data-lightbox="1"]';

type Acik = { src: string; alt: string; caption: string };

export function GorselLightbox() {
  const [acik, setAcik] = useState<Acik | null>(null);
  const [yakin, setYakin] = useState(false);
  const kutu = useRef<HTMLDivElement>(null);
  const kapatDugmesi = useRef<HTMLButtonElement>(null);
  const gorselRef = useRef<HTMLImageElement>(null);
  const oncekiOdak = useRef<HTMLElement | null>(null);

  const kapat = useCallback(() => {
    setAcik(null);
    setYakin(false);
    // Odağı tetikleyen görsele geri ver. Kapanış DOM'dan kaldırma odağı
    // gövdeye kaydırdığı için bir kare bekleyip sonra taşıyoruz.
    const hedef = oncekiOdak.current;
    requestAnimationFrame(() => hedef?.focus?.());
  }, []);

  useEffect(() => {
    const ac = (img: HTMLImageElement) => {
      // Kapanışta odak buraya dönecek; tetikleyen görselin odaklanabilir
      // olduğunu garantiye al (SSR dışı/geç eklenen görsellerde de çalışsın).
      if (!img.hasAttribute("tabindex")) img.setAttribute("tabindex", "0");
      oncekiOdak.current = img;
      const fig = img.closest("figure");
      const caption = fig?.querySelector("figcaption")?.textContent?.trim() ?? "";
      setYakin(false);
      setAcik({ src: img.currentSrc || img.src, alt: img.alt || "", caption });
    };

    // Mevcut görselleri erişilebilir yap (public sayfada hepsi SSR'de mevcut).
    document.querySelectorAll<HTMLImageElement>(SECICI).forEach((img) => {
      img.style.cursor = "zoom-in";
      img.setAttribute("role", "button");
      if (!img.hasAttribute("tabindex")) img.setAttribute("tabindex", "0");
      if (!img.getAttribute("aria-label")) {
        img.setAttribute("aria-label", `${img.alt || "Görsel"} — büyütmek için tıklayın`);
      }
    });

    const tikla = (e: MouseEvent) => {
      const t = (e.target as HTMLElement)?.closest?.(SECICI) as HTMLImageElement | null;
      if (t) ac(t);
    };
    const tus = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const aktif = document.activeElement as HTMLElement | null;
      if (aktif?.matches?.(SECICI)) {
        e.preventDefault();
        ac(aktif as HTMLImageElement);
      }
    };
    document.addEventListener("click", tikla);
    document.addEventListener("keydown", tus);
    return () => {
      document.removeEventListener("click", tikla);
      document.removeEventListener("keydown", tus);
    };
  }, []);

  // Açıkken: Esc ile kapat, gövde kaydırmasını kilitle, kapat düğmesine odaklan.
  useEffect(() => {
    if (!acik) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        kapat();
      }
    };
    document.addEventListener("keydown", esc);
    const oncekiOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Açılınca odak lightbox'a (kapat düğmesine) taşınıyor.
    kapatDugmesi.current?.focus();
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = oncekiOverflow;
    };
  }, [acik, kapat]);

  // Basit focus trap: Tab, container içindeki odaklanabilir öğeler arasında döner.
  const tabTuzagi = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !kutu.current) return;
    const odaklanabilir = kutu.current.querySelectorAll<HTMLElement>(
      'button, [href], [tabindex]:not([tabindex="-1"])',
    );
    if (odaklanabilir.length === 0) return;
    const ilk = odaklanabilir[0];
    const son = odaklanabilir[odaklanabilir.length - 1];
    const aktif = document.activeElement;
    if (e.shiftKey && aktif === ilk) {
      e.preventDefault();
      son.focus();
    } else if (!e.shiftKey && aktif === son) {
      e.preventDefault();
      ilk.focus();
    }
  };

  if (!acik) return null;

  return (
    <div
      className="aea-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={acik.alt || "Görsel"}
      onClick={kapat}
      onKeyDown={tabTuzagi}
    >
      {/* Container: tıklaması backdrop kapatmasını tetiklemesin. */}
      <div className="aea-lightbox__kap" ref={kutu} onClick={(e) => e.stopPropagation()}>
        <div className="aea-lightbox__bar">
          <button
            ref={kapatDugmesi}
            type="button"
            onClick={kapat}
            aria-label="Kapat"
            className="aea-lightbox__kapat"
          >
            ×
          </button>
        </div>

        <div className={`aea-lightbox__govde${yakin ? " aea-lightbox__govde--yakin" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={gorselRef}
            src={acik.src}
            alt={acik.alt}
            className={`aea-lightbox__img${yakin ? " aea-lightbox__img--yakin" : ""}`}
            role="button"
            tabIndex={0}
            aria-label={yakin ? "Görseli küçült" : "Görseli gerçek boyutta gör"}
            onClick={() => setYakin((y) => !y)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setYakin((y) => !y);
              }
            }}
          />
        </div>

        {acik.caption && <figcaption className="aea-lightbox__caption">{acik.caption}</figcaption>}
      </div>
    </div>
  );
}
