"use client";

import { useEffect, useRef } from "react";
import { okumaOrani } from "@/lib/okuma-ilerleme";

/**
 * Okuma ilerleme çubuğu (blog yazı detayı).
 *
 * Yapışkan başlığın hemen altında, ince (3px) marka rengi çizgi. Oran makale
 * içeriğine göre (bkz. okuma-ilerleme.ts). Performans: scroll'da React state
 * güncellenmiyor; rAF ile tek karede tek ölçüm, genişlik yerine transform
 * (scaleX) — yerleşim hesabı tetiklenmiyor. Görseller yüklenip içerik uzarsa
 * ResizeObserver yeniden ölçüyor. Dekoratif: ekran okuyuculardan gizli.
 */
export function OkumaIlerleme() {
  const cubuk = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const icerik = document.querySelector<HTMLElement>("[data-blog-icerik]");
    const el = cubuk.current;
    if (!icerik || !el) return;

    let ofset = 0;
    const ofsetOku = () => {
      ofset = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--baslik-h")) || 0;
    };

    let bekleyen = false;
    const olc = () => {
      bekleyen = false;
      const kutu = icerik.getBoundingClientRect();
      const oran = okumaOrani({ ust: kutu.top, yukseklik: kutu.height, ekran: window.innerHeight, ofset });
      if (oran == null) {
        el.style.opacity = "0";
        return;
      }
      el.style.opacity = "1";
      el.style.transform = `scaleX(${oran})`;
    };
    const tetik = () => {
      if (bekleyen) return;
      bekleyen = true;
      requestAnimationFrame(olc);
    };
    const yeniden = () => {
      ofsetOku();
      tetik();
    };

    ofsetOku();
    olc();
    window.addEventListener("scroll", tetik, { passive: true });
    window.addEventListener("resize", yeniden);
    const gozlemci = new ResizeObserver(yeniden);
    gozlemci.observe(icerik);
    return () => {
      window.removeEventListener("scroll", tetik);
      window.removeEventListener("resize", yeniden);
      gozlemci.disconnect();
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 z-[55] h-[3px] print:hidden"
      style={{ top: "var(--baslik-h, 0px)" }}
    >
      <div
        ref={cubuk}
        className="h-full w-full origin-left bg-brand transition-opacity duration-200"
        style={{ transform: "scaleX(0)", opacity: 0 }}
      />
    </div>
  );
}
