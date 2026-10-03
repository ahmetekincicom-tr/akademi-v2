"use client";

import { useState } from "react";

export type GelirAyi = {
  /** "EKİ" gibi; Türkçe büyük harf. */
  ay: string;
  tutar: number;
  /** İçinde bulunulan ay — henüz kapanmadı, ayrı çiziliyor. */
  simdi: boolean;
};

/** ₺140B — grafikte yer dar; binlik kısaltma. */
function kisa(t: number): string {
  if (t >= 1000) return `₺${Math.round(t / 1000)}B`;
  return `₺${Math.round(t)}`;
}

/**
 * Yönetim genel bakışındaki aylık gelir grafiği.
 *
 * Veri sunucuda hazırlanıyor (son 12 ay, Türkiye saatine göre aylara
 * bölünmüş ödenmiş tahsilat); burada yalnızca 6/12 ay seçimi var. Dar
 * ekranda seçim yok, hep son 6 ay — 12 sütun telefona sığmıyor.
 *
 * Çizim kuralları (tasarım):
 *  - en yüksek ay koyu etiketli, dolu mavi;
 *  - diğer gelirli aylar açık mavi, tutarı üstünde;
 *  - gelirsiz ay ince gri çizgi;
 *  - içinde bulunulan ay mavi; gelir yoksa kesikli çizgi ("şu an").
 */
export function GelirGrafigi({ aylar }: { aylar: GelirAyi[] }) {
  const [kapsam, setKapsam] = useState<6 | 12>(6);

  return (
    <div className="flex h-full flex-col gap-[18px] rounded-[18px] border border-[#E6E8EF] bg-white p-[18px] sm:p-[22px]">
      <div className="flex items-center gap-2.5">
        <h2 className="text-[16px] font-bold text-ink">Aylık gelir</h2>
        <span className="ml-auto font-mono text-[10px] tracking-[0.12em] text-[#8A92A6] uppercase sm:hidden">Son 6 ay</span>
        <div
          role="group"
          aria-label="Grafik aralığı"
          className="ml-auto hidden gap-1 rounded-[9px] bg-[#F1F3F8] p-[3px] sm:flex"
        >
          {([6, 12] as const).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={kapsam === k}
              onClick={() => setKapsam(k)}
              className={`rounded-[7px] px-2.5 py-1.5 font-mono text-[11px] transition ${
                kapsam === k ? "bg-white text-ink shadow-[0_1px_2px_rgba(14,21,38,.08)]" : "text-[#8A92A6] hover:text-ink"
              }`}
            >
              {k} AY
            </button>
          ))}
        </div>
      </div>

      {/* Telefonda 6, geniş ekranda seçilen aralık. İki ızgara: biri gizli. */}
      <div className="sm:hidden">
        <Cubuklar aylar={aylar.slice(-6)} />
      </div>
      <div className="hidden sm:block">
        <Cubuklar aylar={aylar.slice(-kapsam)} />
      </div>
    </div>
  );
}

function Cubuklar({ aylar }: { aylar: GelirAyi[] }) {
  const enYuksek = Math.max(...aylar.map((a) => a.tutar), 0);
  const sutun = { gridTemplateColumns: `repeat(${aylar.length}, minmax(0, 1fr))` };
  const bosluk = aylar.length > 6 ? "gap-2" : "gap-3 sm:gap-[18px]";

  return (
    <div>
      <div className={`relative grid h-[160px] pt-5 sm:h-[220px] ${bosluk}`} style={sutun}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-5 bottom-0"
          style={{ backgroundImage: "linear-gradient(#EEF0F5 1px,transparent 1px)", backgroundSize: "100% 50px" }}
        />
        {aylar.map((a, i) => {
          const zirve = a.tutar > 0 && a.tutar === enYuksek;
          // En yüksek ay sütunun tamamı (etiket payı düşülerek); en az 6px.
          const oran = enYuksek ? a.tutar / enYuksek : 0;
          return (
            <div key={i} className="relative flex h-full flex-col items-center justify-end gap-2" title={`${a.ay}: ₺${a.tutar.toLocaleString("tr-TR")}`}>
              {a.tutar > 0 ? (
                <>
                  <span
                    className={`font-mono text-[10px] whitespace-nowrap sm:text-[11px] ${
                      zirve ? "rounded-[6px] bg-ink px-[7px] py-[3px] font-semibold text-white" : "text-[#5B6478]"
                    }`}
                  >
                    {kisa(a.tutar)}
                  </span>
                  <span
                    className="w-full max-w-[64px] rounded-[10px_10px_4px_4px]"
                    style={{
                      height: `max(6px, calc((100% - 30px) * ${oran.toFixed(4)}))`,
                      background: zirve || a.simdi ? "linear-gradient(180deg,#2459FF,#5B86FF)" : "linear-gradient(180deg,#9DB4FF,#C9D6FF)",
                      boxShadow: zirve ? "0 14px 26px -12px rgba(36,89,255,.7)" : undefined,
                    }}
                  />
                </>
              ) : (
                <span
                  className="h-1 w-full max-w-[64px] rounded-full"
                  style={{
                    background: a.simdi ? "repeating-linear-gradient(90deg,#2459FF 0 6px,transparent 6px 10px)" : "#E6E9F0",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className={`mt-2.5 grid text-center font-mono text-[10px] sm:text-[11px] ${bosluk}`} style={sutun}>
        {aylar.map((a, i) => {
          const zirve = a.tutar > 0 && a.tutar === enYuksek;
          return (
            <div key={i} className={`truncate ${a.simdi ? "text-brand" : zirve ? "text-ink" : "text-[#8A92A6]"}`}>
              {a.ay}
              {a.simdi && aylar.length <= 6 && <span className="hidden sm:inline"> · ŞU AN</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
