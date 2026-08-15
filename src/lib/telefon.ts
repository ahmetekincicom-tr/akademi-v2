/**
 * Telefon numarası: ülke kodu + numara.
 *
 * Kütüphane (libphonenumber) kurulmadı: tam doğrulama 300 KB'lik bir veri
 * tablosu demek ve bize gereken tek şey numarayı tek biçimde saklamak. Ülkeye
 * özel uzunluk kuralları yerine geniş bir aralık kontrol ediliyor — yanlış
 * numarayı zaten ancak SMS göndererek anlarız.
 */

export type Ulke = { kod: string; ad: string; bayrak: string };

/**
 * Türkiye başta, sonra katılımcıların geldiği yerler ve yaygın ülkeler.
 * Liste bilerek kısa: 200 ülkelik açılır menüde kimse kendi ülkesini bulamıyor.
 */
export const ULKELER: Ulke[] = [
  { kod: "+90", ad: "Türkiye", bayrak: "🇹🇷" },
  { kod: "+49", ad: "Almanya", bayrak: "🇩🇪" },
  { kod: "+31", ad: "Hollanda", bayrak: "🇳🇱" },
  { kod: "+32", ad: "Belçika", bayrak: "🇧🇪" },
  { kod: "+43", ad: "Avusturya", bayrak: "🇦🇹" },
  { kod: "+41", ad: "İsviçre", bayrak: "🇨🇭" },
  { kod: "+44", ad: "Birleşik Krallık", bayrak: "🇬🇧" },
  { kod: "+33", ad: "Fransa", bayrak: "🇫🇷" },
  { kod: "+39", ad: "İtalya", bayrak: "🇮🇹" },
  { kod: "+34", ad: "İspanya", bayrak: "🇪🇸" },
  { kod: "+46", ad: "İsveç", bayrak: "🇸🇪" },
  { kod: "+47", ad: "Norveç", bayrak: "🇳🇴" },
  { kod: "+45", ad: "Danimarka", bayrak: "🇩🇰" },
  { kod: "+1", ad: "ABD / Kanada", bayrak: "🇺🇸" },
  { kod: "+7", ad: "Rusya", bayrak: "🇷🇺" },
  { kod: "+380", ad: "Ukrayna", bayrak: "🇺🇦" },
  { kod: "+994", ad: "Azerbaycan", bayrak: "🇦🇿" },
  { kod: "+996", ad: "Kırgızistan", bayrak: "🇰🇬" },
  { kod: "+998", ad: "Özbekistan", bayrak: "🇺🇿" },
  { kod: "+357", ad: "Kıbrıs", bayrak: "🇨🇾" },
  { kod: "+971", ad: "BAE", bayrak: "🇦🇪" },
  { kod: "+966", ad: "Suudi Arabistan", bayrak: "🇸🇦" },
  { kod: "+974", ad: "Katar", bayrak: "🇶🇦" },
  { kod: "+20", ad: "Mısır", bayrak: "🇪🇬" },
  { kod: "+961", ad: "Lübnan", bayrak: "🇱🇧" },
  { kod: "+962", ad: "Ürdün", bayrak: "🇯🇴" },
  { kod: "+964", ad: "Irak", bayrak: "🇮🇶" },
  { kod: "+98", ad: "İran", bayrak: "🇮🇷" },
  { kod: "+91", ad: "Hindistan", bayrak: "🇮🇳" },
  { kod: "+86", ad: "Çin", bayrak: "🇨🇳" },
  { kod: "+81", ad: "Japonya", bayrak: "🇯🇵" },
  { kod: "+61", ad: "Avustralya", bayrak: "🇦🇺" },
  { kod: "+55", ad: "Brezilya", bayrak: "🇧🇷" },
  { kod: "+27", ad: "Güney Afrika", bayrak: "🇿🇦" },
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
