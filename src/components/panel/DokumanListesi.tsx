"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { baytBoyut } from "@/lib/admin/format";
import { Icon } from "@/components/Icon";
import { TR_ZAMAN } from "@/lib/zaman";

export type OgrenciDokuman = {
  id: string;
  baslik: string;
  program: string;
  /** Telefondaki süzgeç düğmesinde kısa ad. */
  programKisa: string;
  dosyaYolu: string;
  dosyaTipi: string;
  boyut: number | null;
  tarih: string;
};

/**
 * Doküman kütüphanesi — "Doküman Kütüphanesi" tasarımı (masaüstü + mobil).
 *
 * İndirme adresi kendi alan adımızda: /indir/<doküman kimliği>. Yetki
 * kontrolü ve imzalı Supabase adresi o uçta, sunucuda (app/indir/[id]).
 *   - "İndir"  → /indir/<id>?indir=1  (her zaman kaydedilir)
 *   - "Önizle" → /indir/<id>          (tarayıcıda açılır)
 * Önizle yalnız tarayıcının gösterebildiği türlerde (PDF, görsel, metin)
 * çiziliyor: Excel'de "Önizle" dosyayı yine indirirdi — çalışmayan düğme.
 */

const TARIH = new Intl.DateTimeFormat("tr-TR", { timeZone: TR_ZAMAN, day: "numeric", month: "long", year: "numeric" });
const YENI_GUN = 14;

type Tur = { etiket: string; ton: number; hucre: boolean };

/** Uzantıdan tür: rozet metni, renk tonu ve ikon (tablo mu, satır mı). */
function tur(d: OgrenciDokuman): Tur {
  const uzanti = d.dosyaYolu.includes(".") ? d.dosyaYolu.slice(d.dosyaYolu.lastIndexOf(".") + 1).toLowerCase() : "";
  if (["xlsx", "xls", "csv", "numbers"].includes(uzanti)) return { etiket: uzanti.toUpperCase(), ton: 155, hucre: true };
  if (uzanti === "pdf") return { etiket: "PDF", ton: 25, hucre: false };
  if (["doc", "docx", "pages", "rtf"].includes(uzanti)) return { etiket: uzanti.toUpperCase(), ton: 255, hucre: false };
  if (["ppt", "pptx", "key"].includes(uzanti)) return { etiket: uzanti.toUpperCase(), ton: 50, hucre: false };
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(uzanti)) return { etiket: uzanti.toUpperCase(), ton: 300, hucre: false };
  if (["zip", "rar"].includes(uzanti)) return { etiket: uzanti.toUpperCase(), ton: 270, hucre: false };
  return { etiket: (uzanti || d.dosyaTipi.split("/").pop() || "DOSYA").slice(0, 4).toUpperCase(), ton: 260, hucre: false };
}

function onizlenebilir(d: OgrenciDokuman): boolean {
  const t = d.dosyaTipi;
  if (t.startsWith("image/svg")) return false; // uç SVG'yi hep indiriyor
  return t === "application/pdf" || t.startsWith("image/") || t.startsWith("text/") || /\.pdf$/i.test(d.dosyaYolu);
}

function yeniMi(d: OgrenciDokuman): boolean {
  return Date.now() - new Date(d.tarih).getTime() < YENI_GUN * 86_400_000;
}

export function DokumanListesi({ dokumanlar }: { dokumanlar: OgrenciDokuman[] }) {
  const [arama, setArama] = useState("");
  const [program, setProgram] = useState<string | null>(null);
  const [yeniOnce, setYeniOnce] = useState(true);

  const programlar = useMemo(() => {
    const m = new Map<string, { kisa: string; adet: number }>();
    for (const d of dokumanlar) {
      const p = m.get(d.program);
      m.set(d.program, { kisa: d.programKisa, adet: (p?.adet ?? 0) + 1 });
    }
    return [...m.entries()].sort((a, b) => b[1].adet - a[1].adet);
  }, [dokumanlar]);

  const gorunen = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase("tr");
    const liste = dokumanlar.filter(
      (d) =>
        (!program || d.program === program) &&
        (!q || d.baslik.toLocaleLowerCase("tr").includes(q) || d.program.toLocaleLowerCase("tr").includes(q)),
    );
    // Sunucu yeniden eskiye veriyor; ters sıra için çevir.
    return yeniOnce ? liste : [...liste].reverse();
  }, [dokumanlar, arama, program, yeniOnce]);

  const suzgecler: { ad: string | null; etiket: string; kisa: string; adet: number }[] = [
    { ad: null, etiket: "Tümü", kisa: "Tümü", adet: dokumanlar.length },
    ...programlar.map(([ad, p]) => ({ ad, etiket: ad.replace(/^Birebir\s+/i, "").replace(/\s+Eğitimi$/i, ""), kisa: p.kisa, adet: p.adet })),
  ];

  return (
    <main className="flex flex-col gap-4 p-4 pb-14 sm:gap-5 sm:px-[34px] sm:pt-7 sm:pb-9">
      <section
        className="relative flex flex-col gap-5 overflow-hidden rounded-[20px] p-[18px] text-white sm:gap-[22px] sm:p-7"
        style={{ background: "linear-gradient(135deg,#1A3FCC 0%,#0F1E5C 39%,#070B16 100%)" }}
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage: "linear-gradient(120deg,#000 10%,transparent 85%)",
            WebkitMaskImage: "linear-gradient(120deg,#000 10%,transparent 85%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -left-30 h-[420px] w-[420px] rounded-full"
          style={{ background: "radial-gradient(circle,rgba(91,134,255,.45),transparent 65%)" }}
        />

        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-6">
          {/* Telefonda sayılar başlığın üstünde tek satır. */}
          <div className="font-mono text-[11px] tracking-[0.14em] text-[#AFC2FF] uppercase sm:hidden">
            {dokumanlar.length} doküman · {programlar.length} program
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-[28px] leading-[1.05] font-extrabold tracking-[-0.03em] sm:text-[34px]">Doküman kütüphanesi</h1>
            <p className="hidden text-[15px] text-[#C9D0E0] sm:block">
              Eğitimlerinde paylaşılan şablonlar, kontrol listeleri ve kaynaklar.
            </p>
          </div>
          <div className="ml-auto hidden gap-7 sm:flex">
            <Sayi deger={dokumanlar.length} etiket="Doküman" />
            <div className="border-l border-white/14 pl-7">
              <Sayi deger={programlar.length} etiket="Program" />
            </div>
          </div>
        </div>

        {dokumanlar.length > 0 && (
          <div className="relative flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="flex h-[46px] flex-none items-center lg:flex-1 gap-2.5 rounded-[12px] border border-white/14 bg-[#070B16]/50 px-3.5 text-[#8E98B3] focus-within:border-white/40 lg:max-w-[460px]">
              <Icon name="search" size={16} />
              <span className="sr-only">Doküman ara</span>
              <input
                type="search"
                value={arama}
                onChange={(e) => setArama(e.target.value)}
                placeholder="Doküman ara…"
                className="min-w-0 flex-1 bg-transparent text-[14px] font-medium text-white outline-none placeholder:text-[#8E98B3]"
              />
            </label>
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5" role="group" aria-label="Programa göre süz">
              {suzgecler.map((s) => {
                const aktif = program === s.ad;
                return (
                  <button
                    key={s.ad ?? "tumu"}
                    type="button"
                    aria-pressed={aktif}
                    onClick={() => setProgram(s.ad)}
                    className={`flex h-[46px] flex-none items-center gap-2 rounded-[12px] px-4 text-[13px] whitespace-nowrap transition ${
                      aktif ? "bg-white font-bold text-[#1A44CC]" : "border border-white/18 font-semibold text-[#E4E8F2] hover:bg-white/8"
                    }`}
                  >
                    <span className="sm:hidden">{s.kisa}</span>
                    <span className="hidden sm:inline">{s.etiket}</span>
                    <span className={`hidden font-mono text-[10px] sm:inline ${aktif ? "text-[#5B86FF]" : "text-[#8E98B3]"}`}>
                      {s.adet}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {dokumanlar.length === 0 ? (
        <div className="flex flex-col items-center rounded-[18px] border border-[#E6E8EF] bg-white px-8 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-[13px] bg-mist text-[#656B7A]">
            <Icon name="folder" size={22} />
          </div>
          <p className="mt-4 max-w-[440px] text-[14.5px] leading-[1.6] text-[#5B6478]">
            Henüz seninle paylaşılmış bir doküman yok. Eğitmenin ders materyali yüklediğinde burada listelenir.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden items-center gap-2.5 sm:flex">
            <h2 className="text-[16px] font-bold text-ink">{program ? suzgecler.find((s) => s.ad === program)?.etiket : "Tüm dokümanlar"}</h2>
            <span className="rounded-full border border-[#E6E8EF] bg-white px-2 py-[3px] font-mono text-[10px] text-[#8A92A6] uppercase">
              {gorunen.length} sonuç
            </span>
            <button
              type="button"
              onClick={() => setYeniOnce((v) => !v)}
              className="ml-auto font-mono text-[11px] tracking-[0.1em] text-[#8A92A6] uppercase transition hover:text-ink"
            >
              {yeniOnce ? "En yeni önce" : "En eski önce"} ↕
            </button>
          </div>

          {gorunen.length === 0 ? (
            <div className="rounded-[18px] border border-[#E6E8EF] bg-white px-6 py-10 text-center text-[14px] text-[#5B6478]">
              Aramana uyan doküman yok.{" "}
              <button type="button" onClick={() => (setArama(""), setProgram(null))} className="font-semibold text-brand hover:text-ink">
                Süzgeçleri temizle
              </button>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
              {gorunen.map((d) => (
                <li key={d.id}>
                  <DokumanKarti d={d} />
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-col gap-1 rounded-[16px] border border-dashed border-[#D5DAE5] p-[18px] sm:flex-row sm:items-center sm:gap-3.5 sm:px-5">
            <span className="text-[14px] font-semibold text-ink">
              <span className="sm:hidden">Aradığın kaynak yok mu?</span>
              <span className="hidden sm:inline">Aradığın kaynak burada yok mu?</span>
            </span>
            <span className="text-[13px] text-[#5B6478]">Eğitmenine yaz, bir sonraki derste paylaşsın.</span>
            <Link
              href="/panel/soru-cevap"
              className="mt-2 self-start rounded-[10px] border border-[#E1E4EC] bg-white px-3.5 py-2.5 text-[13px] font-semibold text-ink transition hover:border-brand hover:text-brand sm:mt-0 sm:ml-auto sm:self-auto"
            >
              Soru-cevap’a git →
            </Link>
          </div>
        </>
      )}
    </main>
  );
}

function Sayi({ deger, etiket }: { deger: number; etiket: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-[30px] leading-none font-extrabold">{deger}</div>
      <div className="font-mono text-[10px] tracking-[0.14em] text-[#AFC2FF] uppercase">{etiket}</div>
    </div>
  );
}

/** Kıvrık köşeli dosya simgesi; büyük (kart) ve küçük (telefon satırı). */
function DosyaSimgesi({ t, kucuk = false }: { t: Tur; kucuk?: boolean }) {
  const [g, y, kayma, kose] = kucuk ? [52, 64, 8, 13] : [78, 96, 12, 18];
  return (
    <span className="relative block flex-none" style={{ width: g, height: y }} aria-hidden>
      <span
        className="absolute rounded-[12px] opacity-30"
        style={{ left: kayma, top: kayma * 0.8, width: g - kayma, height: y - kayma, transform: "rotate(8deg)", background: `oklch(0.62 0.17 ${t.ton})` }}
      />
      <span
        className="absolute flex flex-col justify-end rounded-[12px] border p-[7px]"
        style={{
          inset: `0 ${kayma}px ${kayma * 0.8}px 0`,
          background: "linear-gradient(160deg,#fff,#F4F5F8)",
          borderColor: `oklch(0.9 0.04 ${t.ton})`,
          boxShadow: `0 14px 24px -12px oklch(0.55 0.17 ${t.ton})`,
        }}
      >
        <span
          className="absolute top-0 right-0"
          style={{
            width: kose,
            height: kose,
            borderRadius: "0 12px 0 6px",
            background: `linear-gradient(225deg,#F4F5F8 50%,oklch(0.88 0.06 ${t.ton}) 50%)`,
          }}
        />
        {!kucuk &&
          (t.hucre ? (
            <span className="mb-2 grid grid-cols-3 gap-[2px]">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <span key={i} className="h-[5px] rounded-[1px]" style={{ background: i === 4 ? `oklch(0.85 0.08 ${t.ton})` : "#E3E6EE" }} />
              ))}
            </span>
          ) : (
            <>
              <span className="mb-1 h-[3px] w-[70%] rounded-full bg-[#E3E6EE]" />
              <span className="mb-2 h-[3px] w-1/2 rounded-full bg-[#E3E6EE]" />
            </>
          ))}
        <span
          className={`self-start rounded-[5px] font-mono font-semibold text-white ${kucuk ? "px-1 py-[2px] text-[8px]" : "px-1.5 py-[3px] text-[9px]"}`}
          style={{ background: `oklch(0.55 0.17 ${t.ton})` }}
        >
          {t.etiket}
        </span>
      </span>
    </span>
  );
}

function DokumanKarti({ d }: { d: OgrenciDokuman }) {
  const t = tur(d);
  const tarih = TARIH.format(new Date(d.tarih));
  const indir = `/indir/${d.id}?indir=1`;

  return (
    <>
      {/* Telefon: kompakt satır, tek indirme düğmesi. */}
      <div className="flex items-center gap-3.5 rounded-[16px] border border-[#E6E8EF] bg-white p-3 sm:hidden">
        <DosyaSimgesi t={t} kucuk />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[15px] leading-[1.25] font-bold text-ink">{d.baslik}</span>
          <span className="truncate text-[12.5px] text-[#5B6478]">{d.program}</span>
          <span className="font-mono text-[10.5px] text-[#8A92A6]">
            {baytBoyut(d.boyut)} · {tarih}
          </span>
        </div>
        <a
          href={indir}
          aria-label={`${d.baslik} indir`}
          className="flex h-11 w-11 flex-none items-center justify-center rounded-[12px] bg-ink text-white transition active:bg-brand"
        >
          <Icon name="download" size={17} />
        </a>
      </div>

      {/* Geniş ekran: kart. */}
      <div className="hidden h-full flex-col overflow-hidden rounded-[18px] border border-[#E6E8EF] bg-white transition hover:border-[#C9D6FF] hover:shadow-[0_18px_40px_-24px_rgba(14,21,38,.35)] sm:flex">
        <div className="relative flex h-[150px] items-center justify-center overflow-hidden border-b border-[#EEF0F5] bg-[#F7F8FB]">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage: "linear-gradient(#E8EBF1 1px,transparent 1px),linear-gradient(90deg,#E8EBF1 1px,transparent 1px)",
              backgroundSize: "16px 16px",
              maskImage: "radial-gradient(circle at 50% 50%,#000,transparent 70%)",
              WebkitMaskImage: "radial-gradient(circle at 50% 50%,#000,transparent 70%)",
            }}
          />
          <DosyaSimgesi t={t} />
          {yeniMi(d) && (
            <span className="absolute top-3.5 left-3.5 rounded-full bg-[#2459FF] px-2 py-1 font-mono text-[10px] font-semibold tracking-[0.1em] text-white">
              YENİ
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-[18px]">
          <div className="truncate font-mono text-[10px] tracking-[0.12em] text-[#8A92A6] uppercase">{d.program}</div>
          <div className="text-[17px] leading-[1.3] font-bold tracking-[-0.01em] text-ink">{d.baslik}</div>
          <div className="font-mono text-[12px] text-[#8A92A6]">
            {baytBoyut(d.boyut)} · {tarih}
          </div>
          <div className="mt-auto flex gap-2 pt-2.5">
            <a
              href={indir}
              className="flex h-[42px] flex-1 items-center justify-center gap-2 rounded-[11px] bg-ink text-[13px] font-semibold text-white transition hover:bg-[#2459FF]"
            >
              <Icon name="download" size={14} />
              İndir
            </a>
            {onizlenebilir(d) && (
              <a
                href={`/indir/${d.id}`}
                target="_blank"
                rel="noreferrer"
                className="flex h-[42px] items-center rounded-[11px] border border-[#E1E4EC] px-3.5 text-[13px] font-semibold text-ink transition hover:border-[#2459FF] hover:text-[#2459FF]"
              >
                Önizle
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
