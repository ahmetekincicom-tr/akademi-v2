"use client";

import { useId, useState } from "react";
import { tocOfset } from "@/lib/blog-toc";
import type { IcindekiSatir } from "@/lib/blog-icerik";

/**
 * Mobil/tablet İçindekiler — kompakt accordion.
 *
 * Kapalı başlar ("İçindekiler ↓"); açılınca yalnızca H2 başlıklarını listeler
 * (mobilde H3 gösterilmiyor — kalabalık etmesin). Bir başlığa tıklanınca ilgili
 * bölüme yumuşak kaydırır ve accordion kapanır. Erişilebilir: aria-expanded,
 * aria-controls, klavye ile kullanılabilir native button/link.
 */
export function IcindekilerAccordion({ h2ler }: { h2ler: IcindekiSatir[] }) {
  const [acik, setAcik] = useState(false);
  const panelId = useId();

  if (h2ler.length < 2) return null;

  /*
    Accordion içerik akışının ÜSTÜNDE (kapak sonrası) duruyor; kapanınca açık
    panel yüksekliği kadar aşağıdaki tüm başlıklar yukarı kayıyor. Kaydırma
    hedefini açık düzende ölçüp panel yüksekliğini ÇIKARIYORUZ (kapandıktan
    sonraki konum) — böylece hedef, sticky başlığın tam altına oturuyor. Sonra
    accordion'ı kapatıp bir sonraki karede (layout yerleşince) kaydırıyoruz.
    Adres çubuğundaki hash de güncelleniyor.
  */
  const git = (id: string) => {
    const el = document.getElementById(id);
    const panel = document.getElementById(panelId);
    const panelH = panel && acik ? panel.getBoundingClientRect().height : 0;
    const y = el ? el.getBoundingClientRect().top + window.scrollY - tocOfset() - panelH : null;
    setAcik(false);
    if (y === null) return;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
        try {
          history.replaceState(null, "", `#${id}`);
        } catch {
          /* replaceState kısıtlıysa kaydırma yine de çalıştı */
        }
      }),
    );
  };

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-ink/10 bg-mist/60 lg:hidden">
      <button
        type="button"
        onClick={() => setAcik((a) => !a)}
        aria-expanded={acik}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-3 px-5 py-[14px] text-left"
      >
        <span className="font-mono text-[11px] tracking-[0.14em] text-[#3A3F4F] uppercase">İçindekiler</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={`flex-none text-[#656B7A] transition-transform duration-200 ${acik ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div id={panelId} hidden={!acik} className="border-t border-ink/10 px-2 pb-2 pt-1">
        <ul className="flex flex-col">
          {h2ler.map((h) => (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  git(h.id);
                }}
                className="block rounded-lg px-3 py-[9px] text-[14.5px] leading-[1.4] text-[#3A3F4F] hover:bg-white hover:text-brand"
              >
                {h.metin}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
