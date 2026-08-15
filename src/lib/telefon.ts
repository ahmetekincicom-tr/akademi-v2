/**
 * Telefon numarası: ülke kodu + numara.
 *
 * Kütüphane (libphonenumber) kurulmadı: tam doğrulama 300 KB'lik bir veri
 * tablosu demek ve bize gereken tek şey numarayı tek biçimde saklamak. Ülkeye
 * özel uzunluk kuralları yerine geniş bir aralık kontrol ediliyor — yanlış
 * numarayı zaten ancak SMS göndererek anlarız.
 */

// Bayrak yok: emoji bayraklar platforma göre değişiyor (Windows bayrak yerine
// "TR" harflerini basıyor) ve seçici zaten ülke adını yazıyor.
export type Ulke = { kod: string; ad: string };

/**
 * Türkiye başta, sonra katılımcıların geldiği yerler ve yaygın ülkeler.
 * Liste bilerek kısa: 200 ülkelik açılır menüde kimse kendi ülkesini bulamıyor.
 */
export const ULKELER: Ulke[] = [
  { kod: "+90", ad: "Türkiye" },
  { kod: "+49", ad: "Almanya" },
  { kod: "+31", ad: "Hollanda" },
  { kod: "+32", ad: "Belçika" },
  { kod: "+43", ad: "Avusturya" },
  { kod: "+41", ad: "İsviçre" },
  { kod: "+44", ad: "Birleşik Krallık" },
  { kod: "+33", ad: "Fransa" },
  { kod: "+39", ad: "İtalya" },
  { kod: "+34", ad: "İspanya" },
  { kod: "+46", ad: "İsveç" },
  { kod: "+47", ad: "Norveç" },
  { kod: "+45", ad: "Danimarka" },
  { kod: "+1", ad: "ABD / Kanada" },
  { kod: "+7", ad: "Rusya" },
  { kod: "+380", ad: "Ukrayna" },
  { kod: "+994", ad: "Azerbaycan" },
  { kod: "+996", ad: "Kırgızistan" },
  { kod: "+998", ad: "Özbekistan" },
  { kod: "+357", ad: "Kıbrıs" },
  { kod: "+971", ad: "BAE" },
  { kod: "+966", ad: "Suudi Arabistan" },
  { kod: "+974", ad: "Katar" },
  { kod: "+20", ad: "Mısır" },
  { kod: "+961", ad: "Lübnan" },
  { kod: "+962", ad: "Ürdün" },
  { kod: "+964", ad: "Irak" },
  { kod: "+98", ad: "İran" },
  { kod: "+91", ad: "Hindistan" },
  { kod: "+86", ad: "Çin" },
  { kod: "+81", ad: "Japonya" },
  { kod: "+61", ad: "Avustralya" },
  { kod: "+55", ad: "Brezilya" },
  { kod: "+27", ad: "Güney Afrika" },
];

export const VARSAYILAN_ULKE = "+90";

/** Girilen metinden rakam dışındaki her şeyi atar. */
export function sadeceRakam(deger: string): string {
  return deger.replace(/\D/g, "");
}

/**
 * Yerel gösterimdeki baştaki sıfırı düşürür.
 *
 * Türkiye'de numara alışkanlıktan "0532…" diye yazılıyor ama E.164'te ülke
 * kodundan sonra sıfır olmuyor: "+900532…" geçersiz bir numara.
 */
export function bastakiSifiriAt(rakamlar: string): string {
  return rakamlar.replace(/^0+/, "");
}

/** Saklanan biçim: +905321234567 */
export function e164(ulkeKodu: string, numara: string): string {
  return `${ulkeKodu}${bastakiSifiriAt(sadeceRakam(numara))}`;
}

/**
 * Kabul edilebilir mi? Alt sınır 6, üst sınır 15 — E.164'ün ülke kodu dahil
 * toplam sınırı 15 hane.
 */
export function telefonGecerliMi(ulkeKodu: string, numara: string): boolean {
  const hane = bastakiSifiriAt(sadeceRakam(numara));
  const toplam = sadeceRakam(ulkeKodu).length + hane.length;
  return hane.length >= 6 && toplam <= 15;
}

/** Türkiye numarasını "532 123 45 67" gibi okunur hale getirir. */
export function okunurYaz(ulkeKodu: string, numara: string): string {
  const hane = bastakiSifiriAt(sadeceRakam(numara));
  if (ulkeKodu !== "+90") return hane;
  // 3-3-2-2: Türkiye'de numaralar bu ritimle okunuyor.
  return [hane.slice(0, 3), hane.slice(3, 6), hane.slice(6, 8), hane.slice(8, 10)]
    .filter(Boolean)
    .join(" ");
}
