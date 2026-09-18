"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Public blog görselleri için lightbox.
 *
 * İçerik statik HTML (dangerouslySetInnerHTML) olarak render ediliyor; bu küçük
 * ada `img[data-lightbox="1"]` görsellerine tıklama/klavye ile büyütme davranışı
 * bağlıyor. Etkileşim olay delegasyonuyla belgeye bağlanıyor (görseller sonradan
 * eklense bile çalışır); erişilebilirlik nitelikleri (role/tabindex/aria) de
 * bağlanıyor. Optimize edilmiş ana dosya (uzun kenar ≤ 2000 px) lightbox için de
 * yeterli — ikinci bir upload gerekmiyor.
 */
const SECICI = '.blog-icerik img[data-lightbox="1"]';

export function GorselLightbox() {
  const [acik, setAcik] = useState<{ src: string; alt: string } | null>(null);
  const kapatDugmesi = useRef<HTMLButtonElement>(null);
  const oncekiOdak = useRef<HTMLElement | null>(null);

  const kapat = useCallback(() => {
    setAcik(null);
    oncekiOdak.current?.focus?.();
  }, []);

  useEffect(() => {
    const ac = (img: HTMLImageElement) => {
      oncekiOdak.current = img;
      setAcik({ src: img.currentSrc || img.src, alt: img.alt || "" });
    };

    // Mevcut görselleri erişilebilir yap (public sayfada hepsi SSR'de mevcut).
    const decoreEt = () => {
      document.querySelectorAll<HTMLImageElement>(SECICI).forEach((img) => {
        img.style.cursor = "zoom-in";
        img.setAttribute("role", "button");
        if (!img.hasAttribute("tabindex")) img.setAttribute("tabindex", "0");
        if (!img.getAttribute("aria-label")) {
          img.setAttribute("aria-label", `${img.alt || "Görsel"} — büyütmek için tıklayın`);
        }
      });
    };
    decoreEt();

    // Etkileşim delegasyonla: görsel sonradan eklense de çalışır.
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

  // Açıkken: Esc ile kapat (odaktan bağımsız), gövde kaydırmasını kilitle,
  // kapat düğmesine odaklan.
  useEffect(() => {
    if (!acik) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") kapat();
    };
    document.addEventListener("keydown", esc);
    const oncekiOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    kapatDugmesi.current?.focus();
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = oncekiOverflow;
    };
  }, [acik, kapat]);

  if (!acik) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={acik.alt || "Görsel"}
      onClick={kapat}
      onKeyDown={(e) => {
        if (e.key === "Escape") kapat();
      }}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4"
    >
      <button
        ref={kapatDugmesi}
        type="button"
        onClick={kapat}
        aria-label="Kapat"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-[22px] text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
      >
        ×
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={acik.src}
        alt={acik.alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] max-w-[92vw] rounded-[6px] object-contain shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
      />
    </div>
  );
}
