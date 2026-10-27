"use client";

import { BlogSimge } from "@/components/blog/BlogSimge";
import {
  KAPAK_SIMGE_ADLARI,
  KAPAK_SIMGELERI,
  KAPAK_TON_ADLARI,
  KAPAK_TON_RENKLERI,
  KAPAK_TONLARI,
  kapakGorunumu,
  kapakSimgesiMi,
  kapakTonuMu,
  kategoriGorunumu,
} from "@/lib/blog-kapak";

/**
 * Görselsiz kapağın rengi ve simgesi (lib/blog-kapak).
 *
 * Seçim yapılmazsa kapak kategorinin görünümünü alıyor; "Kategorininki"
 * seçimi siliyor (null). Önizleme editördeki kapak kutusunda (BlogKapak).
 * Kaynak: ahmetekinci.com.tr paneli (GeneratedCoverField.tsx).
 */

const ETIKET = "font-mono text-[10px] tracking-[0.13em] text-[#656B7A] uppercase";

export function KapakSecici({
  kategoriSlug,
  ton,
  simge,
  onTon,
  onSimge,
}: {
  kategoriSlug: string | null;
  ton: string | null;
  simge: string | null;
  onTon: (t: string | null) => void;
  onSimge: (s: string | null) => void;
}) {
  const varsayilan = kategoriGorunumu(kategoriSlug);
  const g = kapakGorunumu(kategoriSlug, { ton, simge });
  const ozelTon = kapakTonuMu(ton);
  const ozelSimge = kapakSimgesiMi(simge);

  return (
    <div className="mt-4 flex flex-col gap-4">
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className={ETIKET}>Renk</span>
          {ozelTon && (
            <button type="button" onClick={() => onTon(null)} className="min-h-11 text-[12.5px] font-semibold text-brand hover:text-ink">
              Kategorininki
            </button>
          )}
        </div>
        <div role="radiogroup" aria-label="Kapak rengi" className="mt-2 flex flex-wrap gap-1.5">
          {KAPAK_TONLARI.map((t) => {
            const secili = g.ton === t;
            return (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={secili}
                aria-label={`${KAPAK_TON_ADLARI[t]}${varsayilan.ton === t ? " (kategorinin rengi)" : ""}`}
                title={KAPAK_TON_ADLARI[t]}
                onClick={() => onTon(t === varsayilan.ton ? null : t)}
                className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition ${
                  secili ? "border-ink" : "border-transparent hover:border-ink/25"
                }`}
              >
                <span className="h-8 w-8 rounded-full" style={{ background: KAPAK_TON_RENKLERI[t] }} aria-hidden />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2">
          <span className={ETIKET}>Simge · {KAPAK_SIMGE_ADLARI[g.simge].split(" (")[0]}</span>
          {ozelSimge && (
            <button type="button" onClick={() => onSimge(null)} className="min-h-11 text-[12.5px] font-semibold text-brand hover:text-ink">
              Kategorininki
            </button>
          )}
        </div>
        <div role="radiogroup" aria-label="Kapak simgesi" className="mt-2 grid grid-cols-6 gap-1">
          {KAPAK_SIMGELERI.map((s) => {
            const secili = g.simge === s;
            return (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={secili}
                aria-label={KAPAK_SIMGE_ADLARI[s]}
                title={KAPAK_SIMGE_ADLARI[s]}
                onClick={() => onSimge(s === varsayilan.simge ? null : s)}
                className={`flex h-11 min-w-0 items-center justify-center rounded-[10px] border transition ${
                  secili ? "border-brand bg-brand/10 text-brand" : "border-ink/10 text-[#5C6273] hover:border-brand hover:text-brand"
                }`}
              >
                <BlogSimge ad={s} boyut={20} cizgi={1.8} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
