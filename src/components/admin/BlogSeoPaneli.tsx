"use client";

import { useState } from "react";
import {
  ACIKLAMA_KARAKTER,
  BASLIK_EN_FAZLA_PIKSEL,
  BASLIK_KARAKTER,
  kontrolleriSirala,
  piksleSigdir,
  type Durum,
  type SeoSonuc,
} from "@/lib/blog-seo-analiz";
import type { YayinKontrol } from "@/lib/blog-yayin-kontrol";

/**
 * Yazı editörünün SEO kartı ve yayın kontrolleri.
 *
 * Kaynak: ahmetekinci.com.tr paneli (apps/panel/src/screens/blog/seo/
 * BlogSeoPanel.tsx, SeoPreviews.tsx, PublishChecklist.tsx); akademinin panel
 * görünümüne uyarlandı. Analiz lib/blog-seo-analiz'de (Türkçe ek toleranslı),
 * kontroller lib/blog-yayin-kontrol'de; bu dosya yalnız sunum.
 *
 * Renkler beyaz zeminde WCAG AA (metin 4,5:1 üstü): yeşil #12703f, sarı
 * #8a5a00, kırmızı #b4232a.
 */

const ETIKET = "font-mono text-[10px] tracking-[0.13em] text-[#656B7A] uppercase";
const GIRDI =
  "h-[46px] w-full rounded-[10px] border border-ink/14 bg-white px-[14px] text-[15px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]";

const RENK: Record<Durum, { yazi: string; zemin: string; nokta: string; ad: string }> = {
  iyi: { yazi: "#12703f", zemin: "rgba(18,112,63,0.1)", nokta: "#1f9d5b", ad: "İyi" },
  orta: { yazi: "#8a5a00", zemin: "rgba(201,138,27,0.14)", nokta: "#d99a1e", ad: "Geliştirilebilir" },
  kotu: { yazi: "#b4232a", zemin: "rgba(229,72,77,0.12)", nokta: "#e5484d", ad: "Zayıf" },
};

function PuanRozeti({ ad, puan, durum }: { ad: string; puan: number; durum: Durum }) {
  const r = RENK[durum];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold"
      style={{ color: r.yazi, background: r.zemin }}
    >
      {ad} {puan}
      <span className="font-normal">· {r.ad}</span>
    </span>
  );
}

/** Uzunluk çubuğu: aralıkta yeşil, kısa/uzun sarı, boş gri. */
function Uzunluk({ uzunluk, min, max, ek }: { uzunluk: number; min: number; max: number; ek?: string }) {
  const durum: Durum | null = !uzunluk ? null : uzunluk > max + 10 ? "kotu" : uzunluk < min || uzunluk > max ? "orta" : "iyi";
  const ad = !uzunluk ? "Boş" : uzunluk > max ? "Uzun" : uzunluk < min ? "Kısa" : "İyi";
  const renk = durum ? RENK[durum].nokta : "rgba(10,13,24,0.15)";
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/[0.07]" aria-hidden>
        <div className="h-full rounded-full" style={{ width: `${Math.min((uzunluk / max) * 100, 100)}%`, background: renk }} />
      </div>
      <span className="flex-none font-mono text-[11px] text-[#5C6273]">
        {uzunluk}/{max}
        {ek ? ` · ${ek}` : ""}
        <span className="sr-only">
          {" "}
          karakter, önerilen {min}–{max}: {ad}
        </span>
      </span>
    </div>
  );
}

const tarihBicim = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Istanbul" });

function kes(metin: string, enFazla: number): string {
  const t = metin.replace(/\s+/g, " ").trim();
  return t.length <= enFazla ? t : `${t.slice(0, enFazla - 1).replace(/\s+\S*$/, "")} …`;
}

/** Google sonuç önizlemesi; başlık piksel genişliğine göre kesiliyor. */
export function GoogleOnizleme({
  baslik,
  aciklama,
  slug,
  tarih,
}: {
  baslik: string;
  aciklama: string;
  slug: string;
  tarih: string | null;
}) {
  const [cihaz, setCihaz] = useState<"masaustu" | "mobil">("masaustu");
  const mobil = cihaz === "mobil";
  const gorunen = piksleSigdir(baslik || "Yazı başlığı", mobil ? 520 : BASLIK_EN_FAZLA_PIKSEL);
  const metin = kes(aciklama || "Arama açıklaması burada görünür.", mobil ? 120 : 160);
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className={ETIKET}>Google önizlemesi</span>
        <div role="group" aria-label="Önizleme cihazı" className="flex rounded-[10px] border border-ink/12 p-0.5">
          {(["masaustu", "mobil"] as const).map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={cihaz === c}
              onClick={() => setCihaz(c)}
              className={`h-10 rounded-[8px] px-3 text-[12.5px] font-semibold transition ${
                cihaz === c ? "bg-brand/10 text-brand" : "text-[#5C6273] hover:text-ink"
              }`}
            >
              {c === "masaustu" ? "Masaüstü" : "Mobil"}
            </button>
          ))}
        </div>
      </div>
      <div
        className={`mt-2.5 rounded-[12px] border border-ink/10 bg-white p-3.5 ${mobil ? "max-w-[360px]" : ""}`}
        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
      >
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#eef2fc] text-[10px] font-bold text-brand"
          >
            AE
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[13px] text-[#202124]">Ahmet Ekinci Akademi</span>
            <span className="block truncate text-[12px] text-[#4d5156]">
              ahmetekinciakademi.com › {slug || "…"}
            </span>
          </span>
        </div>
        <p className={`mt-1.5 leading-[1.3] text-[#1a0dab] ${mobil ? "text-[18px]" : "text-[20px]"} [overflow-wrap:anywhere]`}>
          {gorunen}
        </p>
        <p className="mt-1 text-[13.5px] leading-[1.55] text-[#4d5156] [overflow-wrap:anywhere]">
          {tarih && <span className="text-[#70757a]">{tarihBicim.format(new Date(tarih))} — </span>}
          {metin}
        </p>
      </div>
    </div>
  );
}

export function SeoKarti({
  odakKelime,
  onOdakKelime,
  seoBaslik,
  onSeoBaslik,
  seoAciklama,
  onSeoAciklama,
  baslik,
  ozet,
  slug,
  tarih,
  gorunenBaslik,
  analiz,
}: {
  odakKelime: string;
  onOdakKelime: (v: string) => void;
  seoBaslik: string;
  onSeoBaslik: (v: string) => void;
  seoAciklama: string;
  onSeoAciklama: (v: string) => void;
  baslik: string;
  ozet: string;
  slug: string;
  tarih: string | null;
  /** Google'da görünecek başlık (marka eki dahil). */
  gorunenBaslik: string;
  analiz: SeoSonuc;
}) {
  const aciklama = seoAciklama.trim() || ozet.trim();
  const sirali = kontrolleriSirala(analiz.kontroller);
  const oneriSayisi = sirali.filter((k) => k.durum !== "iyi").length;
  const odak = odakKelime.trim();

  return (
    <div className="rounded-[14px] border border-ink/11 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[15px] font-semibold text-ink">SEO</span>
        <div className="flex flex-wrap gap-1.5">
          <PuanRozeti ad="SEO" puan={analiz.puan.seo} durum={analiz.durum.seo} />
          <PuanRozeti ad="Okunabilirlik" puan={analiz.puan.okunabilirlik} durum={analiz.durum.okunabilirlik} />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="flex items-center justify-between gap-2">
            <span className={ETIKET}>Odak kelime</span>
            {odak && (
              <span className="font-mono text-[11px]" style={{ color: analiz.istatistik.odakSayisi ? "#12703f" : "#b4232a" }}>
                yazıda {analiz.istatistik.odakSayisi} kez
              </span>
            )}
          </span>
          <input
            value={odakKelime}
            onChange={(e) => onOdakKelime(e.target.value)}
            maxLength={120}
            placeholder="ör. meta reklam bütçesi"
            className={GIRDI}
          />
          {!odak && (
            <span className="text-[12px] leading-[1.5] text-[#5C6273]">
              Bu yazının Google&apos;da bulunmasını istediğin ana ifade. Analiz buna göre yapılır.
            </span>
          )}
        </label>

        <label className="flex flex-col gap-2">
          <span className={ETIKET}>SEO başlığı (boşsa yazı başlığı)</span>
          <input value={seoBaslik} onChange={(e) => onSeoBaslik(e.target.value)} placeholder={baslik} className={GIRDI} />
          <Uzunluk
            uzunluk={gorunenBaslik.length}
            min={BASLIK_KARAKTER.min}
            max={BASLIK_KARAKTER.max}
            ek={`${analiz.istatistik.baslikPiksel}/${BASLIK_EN_FAZLA_PIKSEL} px`}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className={ETIKET}>SEO açıklaması (boşsa özet)</span>
          <textarea
            value={seoAciklama}
            onChange={(e) => onSeoAciklama(e.target.value)}
            rows={3}
            placeholder={ozet}
            className={`${GIRDI} h-auto py-3 leading-[1.5]`}
          />
          <Uzunluk uzunluk={aciklama.length} min={ACIKLAMA_KARAKTER.min} max={ACIKLAMA_KARAKTER.max} />
        </label>

        <GoogleOnizleme baslik={gorunenBaslik} aciklama={aciklama} slug={slug} tarih={tarih} />

        <details className="group rounded-[10px] border border-ink/10 bg-mist/60">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-3 text-[13.5px] font-semibold text-ink">
            <span>
              Analiz ayrıntıları
              <span className="ml-1.5 font-normal text-[#5C6273]">
                {oneriSayisi ? `${oneriSayisi} öneri` : "her şey yolunda"}
              </span>
            </span>
            <span aria-hidden className="text-[11px] text-[#8A90A0] transition group-open:rotate-180">
              ▾
            </span>
          </summary>
          {(["seo", "okunabilirlik"] as const).map((grup) => (
            <div key={grup} className="border-t border-ink/8 px-3 py-2.5">
              <div className={ETIKET}>{grup === "seo" ? "SEO" : "Okunabilirlik"}</div>
              <ul className="mt-1.5 flex flex-col gap-1.5">
                {sirali
                  .filter((k) => k.grup === grup)
                  .map((k) => (
                    <li key={k.id} className="flex items-start gap-2 text-[12.5px] leading-[1.5] text-[#3d4352]">
                      <span
                        aria-hidden
                        className="mt-[6px] h-2 w-2 flex-none rounded-full"
                        style={{ background: RENK[k.durum].nokta }}
                      />
                      <span>
                        <span className="sr-only">{RENK[k.durum].ad}: </span>
                        {k.mesaj}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </details>
      </div>
    </div>
  );
}

/** Yan sütundaki yayın kontrolleri (taslakta bilgi olarak). */
export function YayinKontrolListesi({ kontroller }: { kontroller: YayinKontrol[] }) {
  const eksik = kontroller.filter((k) => !k.tamam).length;
  return (
    <div className="rounded-[14px] border border-ink/11 bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[15px] font-semibold text-ink">Yayın öncesi kontrol</span>
        <span className="font-mono text-[11px]" style={{ color: eksik ? "#8a5a00" : "#12703f" }}>
          {eksik ? `${eksik} eksik` : "hazır"}
        </span>
      </div>
      <KontrolSatirlari kontroller={kontroller} />
    </div>
  );
}

function KontrolSatirlari({ kontroller, yalnizEksik = false }: { kontroller: YayinKontrol[]; yalnizEksik?: boolean }) {
  return (
    <ul className="mt-3 flex flex-col gap-2.5">
      {kontroller
        .filter((k) => !yalnizEksik || !k.tamam)
        .map((k) => (
          <li key={k.id} className="flex items-start gap-2.5">
            <span
              aria-hidden
              className="mt-[1px] flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full text-[11px] font-bold text-white"
              style={{ background: k.tamam ? "#1f9d5b" : "#d99a1e" }}
            >
              {k.tamam ? "✓" : "!"}
            </span>
            <span className="min-w-0 text-[13px] leading-[1.45]">
              <span className="sr-only">{k.tamam ? "Tamam: " : "Eksik: "}</span>
              <span className={k.tamam ? "text-[#3d4352]" : "font-semibold text-ink"}>{k.baslik}</span>
              {!k.tamam && <span className="mt-0.5 block text-[12.5px] text-[#5C6273]">{k.oneri}</span>}
            </span>
          </li>
        ))}
    </ul>
  );
}

/** Yayına alırken eksik varsa: listeyi göster, yazar karar versin. */
export function YayinKontrolPenceresi({
  kontroller,
  zamanli,
  onIptal,
  onDevam,
}: {
  kontroller: YayinKontrol[];
  zamanli: boolean;
  onIptal: () => void;
  onDevam: () => void;
}) {
  const eksik = kontroller.filter((k) => !k.tamam).length;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4" onClick={onIptal}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="yayin-kontrol-baslik"
        className="max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-t-[18px] bg-white p-5 shadow-[0_30px_70px_rgba(10,13,24,0.25)] sm:rounded-[18px] sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="yayin-kontrol-baslik" className="font-heading text-[19px] font-semibold tracking-[-0.02em] text-ink">
          {zamanli ? "Zamanlamadan önce" : "Yayınlamadan önce"}: {eksik} eksik
        </h2>
        <p className="mt-1.5 text-[13.5px] leading-[1.55] text-[#5C6273]">
          Bunlar yayını engellemiyor; düzeltip sonra kaydedebilir ya da şimdilik böyle bırakabilirsin.
        </p>
        <KontrolSatirlari kontroller={kontroller} yalnizEksik />
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onIptal}
            autoFocus
            className="h-11 rounded-[11px] border border-ink/13 bg-white px-4 text-[14px] font-semibold text-ink hover:border-brand"
          >
            Geri dön, düzelteyim
          </button>
          <button
            type="button"
            onClick={onDevam}
            className="h-11 rounded-[11px] bg-brand px-4 text-[14px] font-semibold text-white hover:bg-ink"
          >
            {zamanli ? "Yine de zamanla" : "Yine de yayınla"}
          </button>
        </div>
      </div>
    </div>
  );
}
