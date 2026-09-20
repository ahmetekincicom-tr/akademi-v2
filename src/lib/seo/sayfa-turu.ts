/**
 * Site geneli SEO dashboard'unda bir URL'nin (yol) sayfa tipini ve okunur
 * başlığını belirler. Saf/çerçeveden bağımsız (test edilebilir); slug/başlık
 * eşlemeleri veritabanından yüklenip parametre olarak geçilir.
 *
 * Rotalar: blog & kategori kökte /{slug}/, eğitim /egitimler/{slug}/, statik
 * sayfalar sabit yollar. Bilinmeyen kök tek segment → "diğer" (landing).
 */

export type SayfaTuru = "blog" | "egitim" | "statik" | "diger";
export type SayfaSiniflandirma = { tur: SayfaTuru; baslik: string };

export type SayfaReferanslari = {
  /** yayınlanan blog slug → başlık */
  blog: Map<string, string>;
  /** eğitim slug → başlık */
  egitim: Map<string, string>;
  /** blog kategori slug'ları */
  kategori: Set<string>;
};

export const STATIK_SAYFALAR: Record<string, string> = {
  "": "Ana sayfa",
  hakkimizda: "Hakkımızda",
  referanslar: "Referanslar",
  kurumsal: "Kurumsal",
  iletisim: "İletişim",
  yorumlar: "Yorumlar",
  blog: "Blog (dizin)",
  egitimler: "Eğitimler (dizin)",
  "gizlilik-politikasi": "Gizlilik Politikası",
  "iptal-iade-politikasi": "İptal ve İade",
  "uyelik-sozlesmesi": "Üyelik Sözleşmesi",
  "satis-sozlesmesi": "Satış Sözleşmesi",
  "kisisel-verilerin-islenmesi": "KVKK Aydınlatma",
};

export const TUR_ETIKET: Record<SayfaTuru, string> = {
  blog: "Blog",
  egitim: "Eğitim",
  statik: "Statik",
  diger: "Diğer",
};

/** Yol (ör. "/egitimler/meta-ads" veya "/") → { tur, baslik }. */
export function sayfaSinifla(yol: string, ref: SayfaReferanslari): SayfaSiniflandirma {
  const temiz = yol.split("?")[0].split("#")[0].replace(/^\/+/, "").replace(/\/+$/, "");
  if (temiz === "") return { tur: "statik", baslik: "Ana sayfa" };

  const seg = temiz.split("/");

  if (seg[0] === "egitimler") {
    if (seg.length === 1) return { tur: "statik", baslik: "Eğitimler (dizin)" };
    const s = seg[1];
    return { tur: "egitim", baslik: ref.egitim.get(s) ?? `/egitimler/${s}` };
  }

  if (seg.length === 1) {
    const s = seg[0];
    if (ref.blog.has(s)) return { tur: "blog", baslik: ref.blog.get(s)! };
    if (STATIK_SAYFALAR[s] !== undefined) return { tur: "statik", baslik: STATIK_SAYFALAR[s] };
    if (ref.kategori.has(s)) return { tur: "blog", baslik: `Kategori: ${s}` };
    return { tur: "diger", baslik: `/${s}` };
  }

  return { tur: "diger", baslik: `/${temiz}` };
}
