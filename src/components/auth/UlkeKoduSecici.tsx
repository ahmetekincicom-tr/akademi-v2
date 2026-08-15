"use client";

import { useEffect, useRef, useState } from "react";
import { ULKELER } from "@/lib/telefon";
import { Icon } from "@/components/Icon";

/**
 * Ülke kodu seçici.
 *
 * Yerleşik <select> kullanılmıyordu ve kullanılmıyor: kapalı haldeki metin
 * seçeneğin kendisi olmak zorunda, dolayısıyla ya "🇹🇷 +90" gibi bayrak emojisi
 * basmak ya da ülke adını dar alana sığdırmak gerekiyor. Bayrak emojisi de
 * platforma göre değişiyor — Windows'ta bayrak değil "TR" harfleri çıkıyor.
 *
 * Bunun yerine kapalı halde yalnızca kod (+90) görünüyor, liste açıldığında
 * ülke adı ve kod iki sütun halinde hizalanıyor.
 */
export function UlkeKoduSecici({
  deger,
  onDegisim,
}: {
  deger: string;
  onDegisim: (kod: string) => void;
}) {
  const [acik, setAcik] = useState(false);
  const kapsayici = useRef<HTMLDivElement>(null);

  // Dışarı tıklama ve Esc. İkisi de olmadan menü açık kalıp altındaki alanları
  // örtüyor; kullanıcı kapatmak için seçim yapmak zorunda kalıyor.
  useEffect(() => {
    if (!acik) return;

    const disariTiklama = (e: MouseEvent) => {
      if (!kapsayici.current?.contains(e.target as Node)) setAcik(false);
    };
    const kacis = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAcik(false);
    };

    document.addEventListener("mousedown", disariTiklama);
    document.addEventListener("keydown", kacis);
    return () => {
      document.removeEventListener("mousedown", disariTiklama);
      document.removeEventListener("keydown", kacis);
    };
  }, [acik]);

  const secili = ULKELER.find((u) => u.kod === deger);

  return (
    <div ref={kapsayici} className="relative flex-none">
      <button
        type="button"
        onClick={() => setAcik((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={acik}
        aria-label={`Ülke kodu: ${secili?.ad ?? deger}`}
        /*
          Sağ kenarı düz ve sağ çerçevesi yok: numara kutusuyla tek bir alan
          gibi görünüyor. İki ayrı kutu yan yana durduğunda ülke kodu numaraya
          değil, kendi başına bir alana benziyordu.
        */
        className="flex h-[50px] items-center gap-[6px] rounded-l-[11px] border border-r-0 border-ink/14 bg-white pr-[10px] pl-[13px] text-[15.5px] font-medium text-ink transition-colors hover:bg-mist"
      >
        {deger}
        <span className={`text-[#8A90A0] transition-transform ${acik ? "rotate-180" : ""}`}>
          <Icon name="chevronDown" size={15} />
        </span>
      </button>

      {acik && (
        <div
          role="listbox"
          aria-label="Ülke kodu"
          className="absolute top-[calc(100%+6px)] left-0 z-30 max-h-[280px] w-[268px] overflow-y-auto overscroll-contain rounded-[13px] border border-ink/12 bg-white py-[6px] shadow-[0_18px_44px_rgba(10,13,24,0.16)]"
        >
          {ULKELER.map((u) => {
            const seciliMi = u.kod === deger;
            return (
              <button
                key={u.kod + u.ad}
                type="button"
                role="option"
                aria-selected={seciliMi}
                onClick={() => {
                  onDegisim(u.kod);
                  setAcik(false);
                }}
                className="flex w-full items-center justify-between gap-3 px-[14px] py-[9px] text-left transition-colors hover:bg-mist"
                style={{ background: seciliMi ? "rgba(28,86,243,0.08)" : undefined }}
              >
                <span className="truncate text-[14.5px]" style={{ color: seciliMi ? "#1C56F3" : "#3A3F4F" }}>
                  {u.ad}
                </span>
                {/* Kodlar mono ve sağa hizalı: göz aşağı inerken hep aynı
                    sütunda kalıyor, listeyi taramak kolaylaşıyor. */}
                <span
                  className="flex-none font-mono text-[12.5px]"
                  style={{ color: seciliMi ? "#1C56F3" : "#8A90A0" }}
                >
                  {u.kod}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
