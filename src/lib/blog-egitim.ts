/**
 * Blog yazısının "ilgili eğitim" kartı: kategoriden eğitime.
 *
 * ahmetekinci.com.tr'de bu kart ilgili HİZMETE gidiyordu; akademide ilgili
 * eğitimin sayfasına (kayıt oradan). Eşleme kategori adresinden eğitim
 * adreslerine, TERCİH SIRASIYLA: "çok yakında" olan eğitim atlanıp sıradaki
 * deneniyor. Böylece TikTok Ads eğitimi açıldığı gün TikTok yazıları ona
 * bağlanıyor; o güne kadar en yakın açık eğitime gidiyor. Hiçbiri açık
 * değilse kart tüm eğitimlere çağırıyor.
 *
 * Metinler eğitimin kendisinden (panelde yazılan başlık ve açıklama):
 * burada eğitim hakkında iddia üretilmiyor.
 */

export type EgitimOzeti = { slug: string; baslik: string; aciklama: string; cokYakinda: boolean };

export type IlgiliEgitim = {
  /** Kart üstündeki küçük etiket. */
  ust: string;
  baslik: string;
  metin: string;
  dugme: string;
  url: string;
  /** Ölçüm için (blog_cta_click → cta_id). */
  kimlik: string;
};

const KATEGORI_EGITIMLERI: Record<string, string[]> = {
  "sosyal-medya": ["sosyal-medya-ve-reklam-egitimi"],
  "meta-business-manager": ["meta-ads-egitimi"],
  tiktok: ["tiktok-ads-egitimi", "sosyal-medya-ve-reklam-egitimi"],
  "dijital-pazarlama": ["sosyal-medya-ve-reklam-egitimi"],
  // 27.10.2026: yapay zekâ yazıları şimdilik eğitime bağlanmıyor; eğitim
  // "çok yakında"dan çıkınca kendiliğinden bağlanır.
  "yapay-zeka": ["yapay-zeka-egitimi"],
};

export const TUM_EGITIMLER: IlgiliEgitim = {
  ust: "Birebir Eğitimler",
  baslik: "Birebir eğitimlerimizi inceleyin",
  metin: "Sosyal medya, reklam ve dijital pazarlama eğitimlerimizin içeriğine ve kayıt bilgilerine göz atın.",
  dugme: "Eğitimleri incele →",
  url: "/egitimler/",
  kimlik: "egitimler",
};

function kisalt(metin: string, sinir = 190): string {
  const temiz = metin.replace(/\s+/g, " ").trim();
  if (temiz.length <= sinir) return temiz;
  const kesik = temiz.slice(0, sinir);
  return `${kesik.slice(0, kesik.lastIndexOf(" ") > 0 ? kesik.lastIndexOf(" ") : sinir).replace(/[,;:.]$/, "")}…`;
}

export function ilgiliEgitim(kategoriSlug: string | null | undefined, egitimler: EgitimOzeti[]): IlgiliEgitim {
  const adaylar = kategoriSlug ? (KATEGORI_EGITIMLERI[kategoriSlug] ?? []) : [];
  for (const slug of adaylar) {
    const e = egitimler.find((x) => x.slug === slug && !x.cokYakinda);
    if (!e) continue;
    return {
      ust: "Birebir Eğitim",
      baslik: e.baslik,
      metin: kisalt(e.aciklama),
      dugme: "Eğitimi incele →",
      url: `/egitimler/${e.slug}/`,
      kimlik: e.slug,
    };
  }
  return TUM_EGITIMLER;
}
