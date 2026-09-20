/**
 * Blog eğitim CTA'sı — tek kaynak.
 *
 * CTA hem JSX bileşeninden (masaüstü sidebar, yazı sonu) hem de içerik HTML'ine
 * enjekte edilerek (mobil ara CTA) basılıyor. Aynı markup iki yerde farklı
 * yazılmasın diye HTML burada üretiliyor; stiller globals.css'te (.aea-cta*),
 * böylece Tailwind purge'ünden etkilenmiyor.
 *
 * Metinler ve varyantlar sabit; kullanıcı girdisi yok, kaçış gerekmiyor.
 */

/** En uygun Meta Ads eğitim sayfası (trailingSlash açık → sondaki çizgi). */
export const EGITIM_CTA_URL = "/egitimler/meta-ads-egitimi/";

export type CtaVaryant = "yan" | "ara" | "son";

type CtaIcerik = { kicker?: string; baslik: string; metin: string; dugme: string };

const ICERIK: Record<CtaVaryant, CtaIcerik> = {
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

/**
 * CTA'yı HTML string olarak üretir (globals.css'teki .aea-cta* stilleriyle).
 * data-* öznitelikleri BlogAnalitik'in tek delegasyon dinleyicisi tarafından
 * okunuyor (blog_cta_click: placement, cta_id, cta_label).
 */
export function egitimCtaHtml(varyant: CtaVaryant): string {
  const c = ICERIK[varyant];
  const kicker = c.kicker ? `<span class="aea-cta__k">${c.kicker}</span>` : "";
  return (
    `<a class="aea-cta aea-cta--${varyant}" href="${EGITIM_CTA_URL}"` +
    ` data-cta-id="egitim-${varyant}" data-placement="${PLACEMENT[varyant]}" data-cta-label="${c.dugme}">` +
    kicker +
    `<span class="aea-cta__baslik">${c.baslik}</span>` +
    `<span class="aea-cta__metin">${c.metin}</span>` +
    `<span class="aea-cta__dugme">${c.dugme}</span>` +
    `</a>`
  );
}
