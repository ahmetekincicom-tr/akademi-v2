export type DuyuruOnem = "normal" | "onemli" | "kritik";
export type DuyuruDurum = "taslak" | "yayinda";

export type Duyuru = {
  id: string;
  slug: string;
  baslik: string;
  ozet: string;
  icerik: string;
  kategori: string;
  onem: DuyuruOnem;
  durum: DuyuruDurum;
  yayinTarihi: string | null;
  bildirimTarihi: string | null;
  /** Son YENI_GUN içinde yayınlandı mı? Bileşende hesaplanmıyor: render
   *  sırasında Date.now() çağırmak sonucu öngörülemez kılıyor. */
  yeni: boolean;
};

/** Yeni duyuruya kadar "yeni" rozeti taşınacak süre. */
export const YENI_GUN = 7;

export const ONEM_ETIKET: Record<DuyuruOnem, string> = {
  normal: "Bilgi",
  onemli: "Önemli",
  kritik: "Kritik",
};

export const ONEM_STIL: Record<DuyuruOnem, { bg: string; renk: string }> = {
  normal: { bg: "#EEF2FC", renk: "#4A5060" },
  onemli: { bg: "rgba(201,138,27,0.16)", renk: "#A5711A" },
  kritik: { bg: "rgba(229,72,77,0.14)", renk: "#B4232A" },
};

/** Sık kullanılan kategoriler; alan serbest metin, bunlar yalnızca öneri. */
export const KATEGORILER = ["Instagram", "Meta Ads", "Facebook", "WhatsApp", "TikTok", "Genel"];

const HARF: Record<string, string> = {
  ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
  Ç: "c", Ğ: "g", İ: "i", I: "i", Ö: "o", Ş: "s", Ü: "u",
};

/**
 * Başlıktan adres parçası üretir.
 *
 * Türkçe harfler önce karşılıklarına çevriliyor: normalize("NFD") ile
 * ayrıştırma ı ve İ harflerinde doğru sonuç vermiyor.
 */
export function slugYap(metin: string): string {
  return metin
    .split("")
    .map((h) => HARF[h] ?? h)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

/** Panelde rozet için: son YENI_GUN içinde yayınlanan duyuru sayısı. */
export function yeniSayisi(duyurular: Duyuru[]): number {
  return duyurular.filter((d) => d.yeni).length;
}
