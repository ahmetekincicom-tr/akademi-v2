"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";

export type TakvimOturumu = {
  id: string;
  /** Türkiye saatine göre takvim günü (sunucuda hesaplandı). */
  yil: number;
  ay: number;
  gun: number;
  saat: string;
  tur: "siradaki" | "planlandi" | "tamamlandi";
};

export type Bugun = { yil: number; ay: number; gun: number };

const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const GUNLER = ["PZT", "SAL", "ÇAR", "PER", "CUM", "CMT", "PAZ"];

/** Pazartesi=0 … Pazar=6 (takvim günü; saat dilimi yok). */
function haftaGunu(yil: number, ay: number, gun: number) {
  return (new Date(Date.UTC(yil, ay, gun)).getUTCDay() + 6) % 7;
}

/**
 * Birebir eğitim takvimi. Masaüstünde ay görünümü (‹ › ile ay değişir);
 * telefonda sıradaki oturumun haftası, "Ay görünümü" ile tam ay.
 *
 * Günler sunucuda Türkiye saatine göre hesaplanıp geliyor; burada saat dilimi
 * işi yapılmıyor — hidrasyon ve gece yarısı kayması olmasın.
 */
export function BirebirTakvim({
  oturumlar,
  bugun,
  baslangic,
  children,
}: {
  oturumlar: TakvimOturumu[];
  bugun: Bugun;
  /** Açılışta gösterilecek ay: sıradaki oturumun ayı, yoksa bu ay. */
  baslangic: { yil: number; ay: number };
  /** Telefonda hafta şeridinin altında görünen yaklaşan oturum listesi. */
  children?: React.ReactNode;
}) {
  const [goster, setGoster] = useState(baslangic);
  const [mobilAy, setMobilAy] = useState(false);

  const gunHaritasi = useMemo(() => {
    const m = new Map<string, TakvimOturumu>();
    // Aynı güne iki oturum düşerse sıradaki/planlanan öne geçsin.
    const oncelik = { siradaki: 0, planlandi: 1, tamamlandi: 2 } as const;
    for (const o of oturumlar) {
      const k = `${o.yil}-${o.ay}-${o.gun}`;
      const var_ = m.get(k);
      if (!var_ || oncelik[o.tur] < oncelik[var_.tur]) m.set(k, o);
    }
    return m;
  }, [oturumlar]);

  const ayDegistir = (fark: number) =>
    setGoster((g) => {
      const t = g.yil * 12 + g.ay + fark;
      return { yil: Math.floor(t / 12), ay: t % 12 };
    });

  const hucreler: ({ gun: number } | null)[] = [];
  const bos = haftaGunu(goster.yil, goster.ay, 1);
  const gunSayisi = new Date(Date.UTC(goster.yil, goster.ay + 1, 0)).getUTCDate();
  for (let i = 0; i < bos; i++) hucreler.push(null);
  for (let g = 1; g <= gunSayisi; g++) hucreler.push({ gun: g });
  while (hucreler.length % 7) hucreler.push(null);

  // Telefon hafta şeridi: sıradaki oturumun (yoksa bugünün) haftası.
  const siradaki = oturumlar.find((o) => o.tur === "siradaki");
  const odak = siradaki ?? { yil: bugun.yil, ay: bugun.ay, gun: bugun.gun };
  const pzt = new Date(Date.UTC(odak.yil, odak.ay, odak.gun - haftaGunu(odak.yil, odak.ay, odak.gun)));
  const hafta = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(pzt.getTime() + i * 86_400_000);
    return { yil: d.getUTCFullYear(), ay: d.getUTCMonth(), gun: d.getUTCDate() };
  });

  const bugunMu = (y: number, a: number, g: number) => y === bugun.yil && a === bugun.ay && g === bugun.gun;

  const ayIzgarasi = (
    <>
      <div className="grid grid-cols-7 gap-1.5 text-center font-mono text-[10px] tracking-[0.1em] text-[#8A92A6]">
        {GUNLER.map((g) => (
          <div key={g}>{g}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {hucreler.map((h, i) => {
          if (!h) return <div key={i} className="h-[46px] sm:h-[52px]" />;
          const o = gunHaritasi.get(`${goster.yil}-${goster.ay}-${h.gun}`);
          const bugunku = bugunMu(goster.yil, goster.ay, h.gun);
          const temel = "flex h-[46px] flex-col justify-between rounded-[10px] px-2 py-[7px] text-[13px] sm:h-[52px]";
          if (o?.tur === "siradaki")
            return (
              <div key={i} className={`${temel} bg-[#2459FF] font-bold text-white shadow-[0_10px_20px_-10px_rgba(36,89,255,.8)]`}>
                {h.gun}
                <span className="font-mono text-[9px]">{o.saat}</span>
              </div>
            );
          if (o?.tur === "planlandi")
            return (
              <div key={i} className={`${temel} bg-[#EEF2FF] font-bold text-[#1A44CC] ${bugunku ? "ring-[1.5px] ring-[#2459FF] ring-inset" : ""}`}>
                {h.gun}
                <span className="font-mono text-[9px]">{o.saat}</span>
              </div>
            );
          if (o?.tur === "tamamlandi")
            return (
              <div key={i} className={`${temel} bg-[#F1F3F8] font-semibold text-[#5B6478]`}>
                {h.gun}
                <span className="h-1 rounded-full bg-[#C2C9D8]" />
              </div>
            );
          if (bugunku)
            return (
              <div key={i} className={`${temel} font-bold text-[#2459FF] shadow-[inset_0_0_0_1.5px_#2459FF]`}>
                {h.gun}
                <span className="font-mono text-[8px] tracking-[0.1em]">BUGÜN</span>
              </div>
            );
          return (
            <div key={i} className={`${temel} font-medium text-ink`}>
              {h.gun}
            </div>
          );
        })}
      </div>
    </>
  );

  return (
    <div className="flex h-full flex-col gap-4 rounded-[18px] border border-[#E6E8EF] bg-white p-[18px] sm:p-[22px]">
      <div className="flex items-center gap-2.5">
        <h2 className="text-[16px] font-bold text-ink">
          {/* Masaüstünde gezilen ay; telefonda hafta görünümündeyken haftanın ayı. */}
          <span className="lg:hidden">
            {AYLAR[(mobilAy ? goster : odak).ay]} {(mobilAy ? goster : odak).yil}
          </span>
          <span className="hidden lg:inline">
            {AYLAR[goster.ay]} {goster.yil}
          </span>
        </h2>
        {/* Telefon: hafta ↔ ay. */}
        <button
          type="button"
          onClick={() => {
            setMobilAy((v) => !v);
            setGoster({ yil: odak.yil, ay: odak.ay });
          }}
          className="ml-auto text-[13px] font-semibold text-brand hover:text-ink lg:hidden"
        >
          {mobilAy ? "Hafta görünümü" : "Ay görünümü"}
        </button>
        <div className={`ml-auto gap-1.5 ${mobilAy ? "flex" : "hidden lg:flex"}`}>
          <button
            type="button"
            onClick={() => ayDegistir(-1)}
            aria-label="Önceki ay"
            className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border border-[#E1E4EC] text-[#5B6478] transition hover:border-brand hover:text-brand"
          >
            <Icon name="arrowLeft" size={14} />
          </button>
          <button
            type="button"
            onClick={() => ayDegistir(1)}
            aria-label="Sonraki ay"
            className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border border-[#E1E4EC] text-[#5B6478] transition hover:border-brand hover:text-brand"
          >
            <Icon name="arrowRight" size={14} />
          </button>
        </div>
      </div>

      {/* Masaüstü (ve telefonda ay görünümü): ay ızgarası. */}
      <div className={mobilAy ? "flex flex-col gap-2" : "hidden flex-col gap-2 lg:flex"}>
        {ayIzgarasi}
        <div className="mt-2 flex flex-wrap gap-x-[18px] gap-y-1 border-t border-[#EEF0F5] pt-3.5 text-[12px] text-[#5B6478]">
          <Lejant renk="bg-[#2459FF]" ad="Sıradaki" />
          <Lejant renk="border border-[#C9D6FF] bg-[#EEF2FF]" ad="Planlandı" />
          <Lejant renk="border border-[#D5DAE5] bg-[#F1F3F8]" ad="Tamamlandı" />
        </div>
      </div>

      {/* Telefon: hafta şeridi + yaklaşan liste. */}
      {!mobilAy && (
        <div className="flex flex-col gap-3 lg:hidden">
          <div className="grid grid-cols-7 gap-1">
            {hafta.map((g, i) => {
              const o = gunHaritasi.get(`${g.yil}-${g.ay}-${g.gun}`);
              const vurgu = o?.tur === "siradaki";
              return (
                <div
                  key={i}
                  className={`flex flex-col items-center gap-1 rounded-[12px] py-2.5 ${
                    vurgu
                      ? "bg-[#2459FF] text-white"
                      : o?.tur === "planlandi"
                        ? "bg-[#EEF2FF] text-[#1A44CC]"
                        : bugunMu(g.yil, g.ay, g.gun)
                          ? "text-[#2459FF] shadow-[inset_0_0_0_1.5px_#2459FF]"
                          : "text-ink"
                  }`}
                >
                  <span className={`font-mono text-[9px] ${vurgu ? "text-white/80" : "text-[#8A92A6]"}`}>{GUNLER[i]}</span>
                  <span className="text-[17px] font-bold">{g.gun}</span>
                </div>
              );
            })}
          </div>
          {children && <div className="border-t border-[#EEF0F5] pt-3">{children}</div>}
        </div>
      )}
    </div>
  );
}

function Lejant({ renk, ad }: { renk: string; ad: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-[3px] ${renk}`} />
      {ad}
    </span>
  );
}
