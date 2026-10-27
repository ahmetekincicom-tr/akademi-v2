import type { IlgiliEgitim } from "@/lib/blog-egitim";

/**
 * Blog eğitim CTA'sı — tek kaynak.
 *
 * CTA hem JSX bileşeninden (masaüstü sidebar, yazı sonu) hem de içerik HTML'ine
 * enjekte edilerek (mobil ara CTA) basılıyor. Aynı markup iki yerde farklı
 * yazılmasın diye HTML burada üretiliyor; stiller globals.css'te (.aea-cta*),
 * böylece Tailwind purge'ünden etkilenmiyor.
 *
 * Hangi eğitime çağırdığı yazının kategorisinden geliyor (lib/blog-egitim).
 * Meta Ads eğitiminin metinleri elle yazıldı ve korunuyor; diğer eğitimlerde
 * kart eğitimin panelde yazılan başlık ve açıklamasını kullanıyor. Bu metinler
 * veritabanından geldiği için HTML'e kaçışla giriyor.
 */

/** Meta Ads eğitiminin sayfası (trailingSlash açık → sondaki çizgi). */
export const EGITIM_CTA_URL = "/egitimler/meta-ads-egitimi/";

export type CtaVaryant = "yan" | "ara" | "son";

type CtaIcerik = { kicker?: string; baslik: string; metin: string; dugme: string };

const META_ICERIK: Record<CtaVaryant, CtaIcerik> = {
  // Masaüstü sidebar: İçindekiler altında, editoryal kutu.
  yan: {
    kicker: "Birebir Eğitim",
    baslik: "Meta Ads Eğitiminde kampanyaları birlikte analiz edin",
    metin:
      "Birebir eğitimde kendi reklam hesabınız üzerinden kampanyaları, hedef kitleleri ve performans verilerini birlikte değerlendiriyoruz.",
    dugme: "Birebir Meta Ads Eğitimini İncele →",
  },
  // Mobil/tablet içerik içi (~%40): kompakt, hafif.
  ara: {
    baslik: "Birebir Meta Ads Eğitimi",
    metin: "Kendi reklam hesabınız üzerinden kampanyaları birlikte analiz ediyoruz.",
    dugme: "Eğitimi İncele →",
  },
  // Mobil/tablet yazı sonu: daha güçlü, dolgulu.
  son: {
    kicker: "Birebir Eğitim",
    baslik: "Meta reklamlarını veriyle yönetmeyi öğrenin",
    metin:
      "Kendi reklam hesabınız üzerinden, birebir. Kampanyaları birlikte kurar, birlikte analiz ederiz.",
    dugme: "Meta Ads Eğitimini İncele →",
  },
};

/** Analytics yerleşimi (blog_cta_click placement) — varyanta göre. */
const PLACEMENT: Record<CtaVaryant, string> = {
  yan: "sidebar",
  ara: "mobile_inline",
  son: "article_end",
};

function kac(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function icerik(varyant: CtaVaryant, egitim: IlgiliEgitim): CtaIcerik {
  if (egitim.url === EGITIM_CTA_URL) return META_ICERIK[varyant];
  // Ara CTA kompakt: açıklama yok, yalnız başlık ve düğme.
  if (varyant === "ara") return { baslik: egitim.baslik, metin: "", dugme: egitim.dugme };
  return { kicker: egitim.ust, baslik: egitim.baslik, metin: egitim.metin, dugme: egitim.dugme };
}

/**
 * CTA'yı HTML string olarak üretir (globals.css'teki .aea-cta* stilleriyle).
 * data-* öznitelikleri BlogAnalitik'in tek delegasyon dinleyicisi tarafından
 * okunuyor (blog_cta_click: placement, cta_id, cta_label).
 */
export function egitimCtaHtml(varyant: CtaVaryant, egitim: IlgiliEgitim): string {
  const c = icerik(varyant, egitim);
  const kicker = c.kicker ? `<span class="aea-cta__k">${kac(c.kicker)}</span>` : "";
  const metin = c.metin ? `<span class="aea-cta__metin">${kac(c.metin)}</span>` : "";
  return (
    `<a class="aea-cta aea-cta--${varyant}" href="${kac(egitim.url)}"` +
    ` data-cta-id="${kac(`${egitim.kimlik}-${varyant}`)}" data-placement="${PLACEMENT[varyant]}" data-cta-label="${kac(c.dugme)}">` +
    kicker +
    `<span class="aea-cta__baslik">${kac(c.baslik)}</span>` +
    metin +
    `<span class="aea-cta__dugme">${kac(c.dugme)}</span>` +
    `</a>`
  );
}
