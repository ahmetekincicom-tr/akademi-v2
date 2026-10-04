"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { para } from "@/lib/admin/format";
import type { GorusmeAyarlari } from "@/lib/gorusme";

/**
 * Danışmanlık görüşmeleri · "Nasıl çalışır?" rehberi. Masaüstünde ortada
 * pencere, telefonda alttan açılan panel (Claude Design, Danışmanlık
 * görüşmeleri ekranı).
 *
 * Süre, ücretsiz hak ve ücret ayarlardan geliyor. Uygulamada ücret ve ödeme
 * bilgisi gösterilmiyor (Apple 3.1.3) — sayfanın geri kalanıyla aynı kural.
 */
export function NasilCalisir({
  ayarlar,
  hak,
  native,
  onKapat,
  onTalep,
}: {
  ayarlar: GorusmeAyarlari;
  hak: { kullanilan: number; kalan: number; sonrakiUcretli: boolean; egitimKaydiVar: boolean };
  native: boolean;
  onKapat: () => void;
  /** Talep açılamıyorsa (bekleyen talep, kapalı) null: düğme gösterilmiyor. */
  onTalep: (() => void) | null;
}) {
  const [sss, setSss] = useState(0);
  const kapatRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onceki = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const tus = (e: KeyboardEvent) => e.key === "Escape" && onKapat();
    window.addEventListener("keydown", tus);
    kapatRef.current?.focus();
    return () => {
      document.body.style.overflow = onceki;
      window.removeEventListener("keydown", tus);
    };
  }, [onKapat]);

  const ucretsiz = hak.egitimKaydiVar && ayarlar.ucretsizHak > 0;
  const ucret = ayarlar.ucret > 0 ? para(ayarlar.ucret) : null;
  const fiyatGoster = !native;

  const adimlar = [
    {
      baslik: "Talep oluştur",
      metin: "Konunu, tercih ettiğin günü ve saat aralığını yaz.",
      sure: "~2 dk",
      yol: "M12 5v14M5 12h14",
      ton: "oklch(0.6 0.2 265)",
      renk: "oklch(0.5 0.21 265)",
    },
    {
      baslik: "Eğitmen onaylar",
      metin: "Talebin incelenir, sana uygun saat netleştirilir.",
      sure: "24 sa içinde",
      yol: "M5 12.5l4.5 4.5L19 7.5",
      ton: "oklch(0.72 0.16 60)",
      renk: "oklch(0.55 0.15 50)",
    },
    {
      baslik: "Bağlantı panele düşer",
      metin: "Toplantı linki bu sayfaya ve e-postana gönderilir.",
      sure: "Onayla birlikte",
      yol: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
      ton: "oklch(0.6 0.2 300)",
      renk: "oklch(0.5 0.2 300)",
    },
    {
      baslik: "Görüş, notları al",
      metin: `${ayarlar.sureDk} dk birebir çalışma; görüşme notları burada kalır.`,
      sure: `${ayarlar.sureDk} dk`,
      yol: "M9 4.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7zM3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M17 6.5a2.5 2.5 0 1 1 0 5M16.5 14c2.7 0 4.5 2 4.5 5",
      ton: "oklch(0.62 0.15 170)",
      renk: "oklch(0.48 0.13 170)",
    },
  ];

  const hazirlik = [
    "Konuyu tek cümleyle netleştir: “Reklam hesabım kısıtlandı” gibi.",
    "Varsa hata mesajlarının ekran görüntülerini ekle.",
    "Reklam hesabına / Business Manager’a erişimin hazır olsun.",
    "Sormak istediklerini önceden liste halinde yaz.",
  ];

  const sorular: [string, string][] = [
    ...(ucretsiz
      ? ([
          [
            "Görüşmeyi iptal edersem hakkım yanar mı?",
            "Hayır. İptal ettiğin talepler ücretsiz hakkından düşmez; dilediğin zaman yeni talep oluşturabilirsin.",
          ],
        ] as [string, string][])
      : []),
    ...(ucretsiz && fiyatGoster
      ? ([
          [
            `${ayarlar.ucretsizHak} ücretsiz hakkım bitince ne olur?`,
            `Sonraki her görüşme ${ayarlar.sureDk} dakika için ${ucret ?? "ücretlidir"}${ucret ? "’dir" : ""}. Talep oluşturduğunda ödeme ekranına yönlendirilirsin; kart ya da havale ile ödeyebilirsin.`,
          ],
        ] as [string, string][])
      : []),
    [
      "Görüşmeye kimler katılabilir?",
      "Görüşmeler birebir yapılır; ekip arkadaşını davet etmek istersen talep notunda belirtmen yeterli.",
    ],
  ];

  const sonraki = hak.sonrakiUcretli ? (fiyatGoster && ucret ? ucret : "ücretli") : "ücretsiz";
  const ozet = [
    `${ayarlar.sureDk} dk`,
    "Google Meet",
    ucretsiz ? `ilk ${ayarlar.ucretsizHak} görüşme ücretsiz` : fiyatGoster && ucret ? `görüşme başı ${ucret}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const talepDugmesi = (sinif: string) =>
    onTalep && (
      <button
        type="button"
        onClick={onTalep}
        className={`items-center justify-center gap-1.5 rounded-[13px] bg-brand font-extrabold text-white transition hover:bg-[#1A44CC] ${sinif}`}
      >
        <Icon name="plus" size={15} strokeWidth={2.4} />
        Görüşme talep et
      </button>
    );

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col justify-end bg-[rgba(7,11,22,.55)] lg:items-center lg:justify-center lg:bg-[rgba(7,11,22,.6)] lg:p-10"
      onClick={onKapat}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="nasil-calisir-baslik"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-[26px] bg-white shadow-[0_40px_100px_-30px_rgba(0,0,0,.7)] lg:max-h-full lg:w-[820px] lg:rounded-[24px] lg:bg-[#F4F5F9]"
      >
        {/* ------------------------------------------------ başlık --- */}
        <div
          className="relative flex-none overflow-hidden px-[18px] pt-3 pb-[18px] text-white lg:px-[30px] lg:pt-7 lg:pb-6"
          style={{ background: "linear-gradient(120deg,#1A3FCC 0%,#0F1E5C 40%,#070B16 100%)" }}
        >
          <div
            aria-hidden
            className="absolute inset-0 [background-size:22px_22px] lg:[background-size:28px_28px]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px)",
              maskImage: "linear-gradient(110deg,#000 10%,transparent 85%)",
              WebkitMaskImage: "linear-gradient(110deg,#000 10%,transparent 85%)",
            }}
          />
          <div
            aria-hidden
            className="absolute -top-[140px] -left-[100px] hidden h-[360px] w-[360px] rounded-full lg:block"
            style={{ background: "radial-gradient(circle,rgba(91,134,255,.45),transparent 65%)" }}
          />
          <div aria-hidden className="relative mx-auto mb-3.5 h-1 w-10 rounded-full bg-white/35 lg:hidden" />
          <div className="relative flex items-start gap-2.5 lg:gap-4">
            <div className="flex flex-col gap-1.5 lg:gap-2">
              <div className="font-mono text-[9px] tracking-[0.16em] text-[#AFC2FF] uppercase lg:text-[10px]">
                <span className="hidden lg:inline">Birebir destek · </span>Rehber
              </div>
              <h2 id="nasil-calisir-baslik" className="text-[21px] leading-[1.15] font-extrabold tracking-[-0.02em] lg:text-[28px] lg:leading-[1.1] lg:tracking-[-0.03em]">
                <span className="lg:hidden">Nasıl çalışır?</span>
                <span className="hidden lg:inline">Danışmanlık görüşmeleri nasıl çalışır?</span>
              </h2>
              <p className="text-[12px] text-[#C9D0E0] lg:hidden">{ozet}</p>
              <p className="hidden max-w-[520px] text-[14px] leading-[1.5] text-[#C9D0E0] lg:block">
                Eğitimin bitse de yalnız değilsin. Takıldığın noktayı yaz, eğitmeninle birebir çözelim.
              </p>
            </div>
            <button
              ref={kapatRef}
              type="button"
              onClick={onKapat}
              aria-label="Kapat"
              className="ml-auto flex h-11 w-11 flex-none items-center justify-center rounded-[12px] bg-white/10 transition hover:bg-white/18 lg:h-10 lg:w-10 lg:rounded-[11px] lg:border lg:border-white/15"
            >
              <Icon name="x" size={15} strokeWidth={2.2} />
            </button>
          </div>
          <div className="relative mt-[18px] hidden gap-2 lg:flex">
            <Cip>
              <Icon name="clock" size={14} strokeWidth={2} className="text-[#8FAEFF]" />
              {ayarlar.sureDk} dakika
            </Cip>
            <Cip>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8FAEFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="6" width="13" height="12" rx="2.5" />
                <path d="M16 10.5l5-3v9l-5-3" />
              </svg>
              Online · Google Meet
            </Cip>
            {ucretsiz && (
              <span className="flex h-8 items-center rounded-full border border-[rgba(61,220,151,.3)] bg-[rgba(61,220,151,.14)] px-3 text-[12px] font-bold text-[#3DDC97]">
                İlk {ayarlar.ucretsizHak} görüşme ücretsiz
              </span>
            )}
          </div>
        </div>

        {/* ------------------------------------------------- gövde --- */}
        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain px-[18px] py-4 lg:gap-[22px] lg:px-[30px] lg:py-6">
          {/* Telefon: dikey adım listesi */}
          <ol className="flex flex-col lg:hidden">
            {adimlar.map((a) => (
              <li key={a.baslik} className="flex gap-3.5">
                <div className="flex flex-col items-center">
                  <span
                    className="flex h-10 w-10 flex-none items-center justify-center rounded-[12px] border border-[#E1E6F2] bg-[linear-gradient(150deg,#fff,#F4F6FC)]"
                    style={{ boxShadow: `4px 4px 0 -1px ${a.ton}`, color: a.renk }}
                  >
                    <Cizgi yol={a.yol} boyut={16} />
                  </span>
                  <span className="my-1 min-h-3.5 w-0.5 flex-1 bg-[repeating-linear-gradient(180deg,#C9D6FF_0_4px,transparent_4px_8px)]" />
                </div>
                <div className="flex flex-col gap-1 pb-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-bold text-ink">{a.baslik}</span>
                    <span className="rounded-full bg-[#EEF2FF] px-1.5 py-[3px] font-mono text-[9px] text-[#1A44CC] uppercase">{a.sure}</span>
                  </div>
                  <p className="text-[13px] leading-[1.45] text-[#5B6478]">{a.metin}</p>
                </div>
              </li>
            ))}
          </ol>

          {/* Masaüstü: dört kart */}
          <div className="hidden flex-col gap-3 lg:flex">
            <div className="font-mono text-[10px] tracking-[0.16em] text-[#8A92A6] uppercase">4 adımda süreç</div>
            <ol className="relative grid grid-cols-4 gap-3">
              <span aria-hidden className="absolute top-[46px] right-[12%] left-[12%] h-0.5 bg-[repeating-linear-gradient(90deg,#C9D6FF_0_6px,transparent_6px_12px)]" />
              {adimlar.map((a, i) => (
                <li key={a.baslik} className="relative flex flex-col gap-2.5 rounded-[16px] border border-[#E6E8EF] bg-white p-4">
                  <div className="flex items-center">
                    <span className="relative h-[52px] w-[52px]">
                      <span className="absolute top-2 left-2 h-11 w-11 rotate-[10deg] rounded-[14px] opacity-35" style={{ background: a.ton }} />
                      <span
                        className="absolute inset-[0_8px_8px_0] flex items-center justify-center rounded-[14px] border border-[#E1E6F2] bg-[linear-gradient(150deg,#fff,rgba(255,255,255,.75))]"
                        style={{ boxShadow: `0 8px 16px -8px ${a.ton}`, color: a.renk }}
                      >
                        <Cizgi yol={a.yol} boyut={19} />
                      </span>
                    </span>
                    <span className="ml-auto font-mono text-[22px] font-semibold text-[#E1E4EC]">0{i + 1}</span>
                  </div>
                  <div className="text-[15px] font-bold text-ink">{a.baslik}</div>
                  <p className="text-[12px] leading-[1.5] text-pretty text-[#5B6478]">{a.metin}</p>
                  <span className="mt-auto self-start rounded-full bg-[#EEF2FF] px-2 py-1 font-mono text-[10px] tracking-[0.06em] text-[#1A44CC] uppercase">
                    {a.sure}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-col gap-3.5 lg:grid lg:grid-cols-2">
            {/* Hazırlık */}
            <div className="flex flex-col gap-2 rounded-[14px] bg-[#F4F5F9] p-3.5 lg:gap-3 lg:rounded-[16px] lg:border lg:border-[#E6E8EF] lg:bg-white lg:p-[18px]">
              <h3 className="text-[14px] font-bold text-ink lg:text-[15px]">
                <span className="lg:hidden">Hazırlık</span>
                <span className="hidden lg:inline">Görüşmeye hazırlık</span>
              </h3>
              <ul className="flex flex-col gap-2 lg:gap-3">
                {hazirlik.map((h) => (
                  <li key={h} className="flex items-start gap-2 text-[12px] leading-[1.45] text-[#2B3245] lg:gap-2.5 lg:text-[13px]">
                    <span className="flex flex-none items-center justify-center text-[#12825A] lg:h-5 lg:w-5 lg:rounded-[6px] lg:bg-[#E3F6EE]">
                      <Icon name="check" size={12} strokeWidth={3} />
                    </span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>

            {/* Ücretlendirme */}
            {fiyatGoster && (
              <div className="relative hidden flex-col gap-3 overflow-hidden rounded-[16px] border border-[#E6E8EF] bg-white p-[18px] lg:flex">
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    backgroundImage: "linear-gradient(#ECEEF3 1px,transparent 1px),linear-gradient(90deg,#ECEEF3 1px,transparent 1px)",
                    backgroundSize: "14px 14px",
                    maskImage: "radial-gradient(circle at 90% 10%,#000,transparent 50%)",
                    WebkitMaskImage: "radial-gradient(circle at 90% 10%,#000,transparent 50%)",
                  }}
                />
                <h3 className="relative text-[15px] font-bold text-ink">Ücretlendirme</h3>
                {ucretsiz ? (
                  <>
                    <div
                      className="relative grid gap-1.5"
                      style={{ gridTemplateColumns: `repeat(${Math.min(ayarlar.ucretsizHak, 5) + 1}, minmax(0,1fr))` }}
                    >
                      {Array.from({ length: Math.min(ayarlar.ucretsizHak, 5) }, (_, i) => {
                        const kullanildi = i < hak.kullanilan;
                        return (
                          <div
                            key={i}
                            className={`flex h-[54px] flex-col items-center justify-center gap-0.5 rounded-[11px] ${
                              kullanildi ? "bg-[#F1F3F8]" : "bg-[#E3F6EE] shadow-[inset_0_0_0_1px_#BFE8D6]"
                            }`}
                          >
                            <span className={`font-mono text-[9px] ${kullanildi ? "text-[#8A92A6]" : "text-[#12825A]"}`}>
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span className={`text-[11px] ${kullanildi ? "font-bold text-[#8A92A6]" : "font-extrabold text-[#0F6B49]"}`}>
                              {kullanildi ? "Kullanıldı" : "Ücretsiz"}
                            </span>
                          </div>
                        );
                      })}
                      <div className="flex h-[54px] flex-col items-center justify-center gap-0.5 rounded-[11px] border-[1.5px] border-dashed border-[#D5DAE5]">
                        <span className="font-mono text-[9px] text-[#8A92A6]">{String(ayarlar.ucretsizHak + 1).padStart(2, "0")}+</span>
                        <span className="text-[11px] font-extrabold text-ink">{ucret ?? "Ücretli"}</span>
                      </div>
                    </div>
                    <p className="relative text-[12px] leading-[1.5] text-[#5B6478]">
                      Kalan ücretsiz hakkın:{" "}
                      <b className="text-ink">
                        {hak.kalan} / {ayarlar.ucretsizHak}
                      </b>
                      . İptal ettiğin talepler hakkından düşmez.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="relative text-[28px] leading-none font-extrabold tracking-[-0.03em] text-ink">{ucret ?? "Ücretli"}</div>
                    <p className="relative text-[12px] leading-[1.5] text-[#5B6478]">
                      Görüşme başına, {ayarlar.sureDk} dakika. Talebin ödeme tamamlandıktan sonra planlamaya alınır.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Sık sorulanlar (masaüstü) */}
          <div className="hidden flex-col overflow-hidden rounded-[16px] border border-[#E6E8EF] bg-white lg:flex">
            <h3 className="px-[18px] pt-4 pb-1.5 text-[15px] font-bold text-ink">Sık sorulanlar</h3>
            {sorular.map(([s, c], i) => {
              const acik = sss === i;
              return (
                <div key={s} className="border-t border-[#F1F3F7]">
                  <button
                    type="button"
                    onClick={() => setSss(acik ? -1 : i)}
                    aria-expanded={acik}
                    className="flex w-full items-center gap-3 px-[18px] py-3.5 text-left transition hover:bg-[#F8F9FC]"
                  >
                    <span className="text-[14px] font-semibold text-ink">{s}</span>
                    <span
                      className={`ml-auto flex h-6 w-6 flex-none items-center justify-center rounded-[7px] text-[15px] font-bold ${
                        acik ? "bg-brand text-white" : "bg-[#F1F3F8] text-[#5B6478]"
                      }`}
                    >
                      {acik ? "−" : "+"}
                    </span>
                  </button>
                  {acik && <p className="-mt-1.5 max-w-[640px] px-[18px] pb-3.5 text-[13px] leading-[1.55] text-[#5B6478]">{c}</p>}
                </div>
              );
            })}
          </div>
        </div>

        {/* ------------------------------------------------ alt şerit --- */}
        <div className="flex-none border-t border-[#EEF0F5] px-[18px] pt-3 pb-[calc(16px+env(safe-area-inset-bottom))] lg:hidden">
          {onTalep ? (
            talepDugmesi("flex h-[50px] w-full text-[15px]")
          ) : (
            <button type="button" onClick={onKapat} className="h-[50px] w-full rounded-[13px] border border-[#E1E4EC] text-[15px] font-semibold text-ink">
              Kapat
            </button>
          )}
        </div>
        <div className="hidden flex-none items-center gap-3 border-t border-[#E6E8EF] bg-white px-[30px] py-4 lg:flex">
          {hak.egitimKaydiVar && (
            <div className="flex items-center gap-2 text-[13px] text-[#5B6478]">
              <span className="h-2 w-2 rounded-full bg-[#3DDC97]" />
              Sonraki görüşmen <b className="text-ink">{sonraki}</b>
            </div>
          )}
          <button
            type="button"
            onClick={onKapat}
            className="ml-auto h-[46px] rounded-[12px] border border-[#E1E4EC] px-[18px] text-[14px] font-semibold text-ink transition hover:border-ink/30"
          >
            Kapat
          </button>
          {talepDugmesi("flex h-[46px] px-5 text-[14px] shadow-[0_12px_24px_-12px_rgba(36,89,255,.8)]")}
        </div>
      </div>
    </div>
  );
}

function Cip({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-8 items-center gap-2 rounded-full border border-white/14 bg-[#070B16]/50 px-3 text-[12px] font-semibold">
      {children}
    </span>
  );
}

function Cizgi({ yol, boyut }: { yol: string; boyut: number }) {
  return (
    <svg width={boyut} height={boyut} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={yol} />
    </svg>
  );
}
