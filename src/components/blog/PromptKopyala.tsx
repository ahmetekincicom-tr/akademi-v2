"use client";

import { useEffect, useRef } from "react";

/**
 * Public blog sayfasında Prompt bloklarının "Kopyala" düğmelerini bağlar.
 *
 * Blok içerikleri statik HTML olarak (dangerouslySetInnerHTML) render ediliyor;
 * public tarafa Tiptap bundle'ı YÜKLENMİYOR. Kopyalama için gereken tek şey bu
 * küçük ada: mevcut düğmelere olay bağlıyor, prompt metnini panoya kopyalıyor
 * ve ekran okuyucuya bildiriyor. Bloklar bu bileşen olmadan da doğru görünür;
 * yalnızca kopyalama etkileşimi buradan geliyor.
 */
export function PromptKopyala() {
  const durumRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const dugmeler = Array.from(
      document.querySelectorAll<HTMLButtonElement>(".blog-icerik .aea-prompt__kopyala"),
    );
    if (dugmeler.length === 0) return;

    const zamanlayicilar = new Map<HTMLButtonElement, number>();

    async function panoyaYaz(metin: string): Promise<boolean> {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(metin);
          return true;
        }
      } catch {
        // execCommand yedeğine düş.
      }
      try {
        const alan = document.createElement("textarea");
        alan.value = metin;
        alan.setAttribute("readonly", "");
        alan.style.position = "fixed";
        alan.style.opacity = "0";
        document.body.appendChild(alan);
        alan.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(alan);
        return ok;
      } catch {
        return false;
      }
    }

    const isle = async (dugme: HTMLButtonElement) => {
      // Metin yalnızca prompt gövdesinden ("Örnek Prompt" başlığı değil).
      const kutu = dugme.closest("aside");
      const metin = kutu?.querySelector(".aea-prompt__metin")?.textContent ?? "";
      if (!metin) return;

      const basarili = await panoyaYaz(metin);
      const onceki = zamanlayicilar.get(dugme);
      if (onceki) window.clearTimeout(onceki);

      dugme.textContent = basarili ? "Kopyalandı ✓" : "Kopyalanamadı";
      dugme.classList.toggle("aea-prompt__kopyala--ok", basarili);
      dugme.setAttribute("aria-label", basarili ? "Prompt kopyalandı" : "Kopyalanamadı");
      if (durumRef.current) durumRef.current.textContent = basarili ? "Prompt panoya kopyalandı." : "Kopyalama başarısız oldu.";

      const zaman = window.setTimeout(() => {
        dugme.textContent = "Kopyala";
        dugme.classList.remove("aea-prompt__kopyala--ok");
        dugme.setAttribute("aria-label", "Prompt metnini kopyala");
        if (durumRef.current) durumRef.current.textContent = "";
      }, 2000);
      zamanlayicilar.set(dugme, zaman);
    };

    const dinleyiciler = dugmeler.map((dugme) => {
      const fn = () => void isle(dugme);
      dugme.addEventListener("click", fn);
      return { dugme, fn };
    });

    return () => {
      dinleyiciler.forEach(({ dugme, fn }) => dugme.removeEventListener("click", fn));
      zamanlayicilar.forEach((z) => window.clearTimeout(z));
    };
  }, []);

  // Kopyalama sonucunu ekran okuyucuya bildiren görünmez canlı bölge.
  return <span ref={durumRef} aria-live="polite" role="status" className="sr-only" />;
}
