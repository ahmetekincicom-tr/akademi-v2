import type { IconName } from "@/components/Icon";

/** Single source of truth for contact details used across the site. */

export const WHATSAPP_NUMARALAR = [
  { gosterim: "+90 850 307 1259", numara: "908503071259" },
  { gosterim: "+90 545 276 6866", numara: "905452766866" },
];

export const EPOSTA = "iletisim@ahmetekinciakademi.com";
export const INSTAGRAM_KULLANICI = "@ahmetekincicomtr";
export const INSTAGRAM_URL = "https://instagram.com/ahmetekincicomtr";
export const LINKEDIN_URL = "https://www.linkedin.com/in/ahmet-ekinci/";
export const SEHIR = "Ankara";

/**
 * Ofis adresi üç parçada tutuluyor.
 *
 * Tek bir metin olarak durduğunda schema.org'a yanlış giriliyordu:
 * `streetAddress` yalnızca sokak satırını ister, ilçe `addressLocality`
 * alanına aittir. Parçalanmış hâl aynı zamanda iletişim kartında adresin
 * iki satıra bölünmesini sağlıyor — dar kartta tek uzun satır kırılıyordu.
 */
export const ADRES_SOKAK = "Kızılırmak Mah. Dumlupınar Bulvarı No: 3C1-160";
export const ADRES_ILCE = "Çankaya/Ankara";
export const OFIS_BINA = "Next Level";
export const OFIS_ADRESI = `${ADRES_SOKAK} ${ADRES_ILCE} · ${OFIS_BINA}`;

export function whatsappLink(numara: string, mesaj?: string) {
  const q = mesaj ? `?text=${encodeURIComponent(mesaj)}` : "";
  return `https://wa.me/${numara}${q}`;
}

/**
 * WhatsApp hazır mesajı.
 *
 * Varsayılan — footer dahil, eğitim detay sayfası DIŞINDAKİ her yer. Eğitim
 * detay sayfalarında mesaj eğitimin ADINDAN kuruluyor (bkz.
 * egitimWhatsappMesaji). Ref kodu her koşulda ayrıca ekleniyor (route.ts).
 */
export const WHATSAPP_VARSAYILAN_MESAJ =
  "Merhaba, birebir eğitimleriniz hakkında bilgi almak istiyorum.";

/**
 * Eğitime özel hazır mesaj.
 *
 * ESKİDEN slug → metin diye elle yazılmış bir harita vardı ve SESSİZCE
 * BOZULMUŞTU: taşımada eğitim adresleri değişti ("birebir-meta-ads-egitimi"
 * artık "meta-ads-egitimi"), haritadaki üç anahtarın ikisi hiçbir eğitimle
 * eşleşmiyordu. Yani Meta Ads ve Sosyal Medya düğmelerine basan herkes
 * eğitime özel değil genel mesajla WhatsApp'a düşüyordu; hiçbir yerde hata
 * görünmediği için de fark edilmiyordu.
 *
 * Artık metin eğitimin kendi başlığından kuruluyor: yeni eğitim eklendiğinde
 * ya da adı değiştiğinde kod değişmeden doğru çalışıyor.
 *
 * Başlık VERİTABANINDAN geliyor, adres çubuğundan değil: URL'deki slug
 * yalnızca arama anahtarı. Böylece mesaj metnine dışarıdan bir şey
 * yazdırılamıyor.
 */
export function egitimWhatsappMesaji(baslik: string | null | undefined): string {
  const temiz = baslik?.trim();
  if (!temiz) return WHATSAPP_VARSAYILAN_MESAJ;
  return `Merhaba, ${temiz} hakkında bilgi almak istiyorum.`;
}

/**
 * Sosyal medya ikonları.
 *
 * WhatsApp'ın adresi YOK, `whatsapp: true` işareti var: o bağlantı doğrudan
 * wa.me'ye gitmek zorunda (gerekçesi WhatsAppBaglantisi.tsx'te) ve tıklama
 * kaydı ayrı bir işaretle yapılıyor. Burada bir adres tutulsaydı, çizen taraf
 * onu sıradan bir dış bağlantı gibi basardı.
 */
export const SOSYAL: { ad: string; ikon: IconName; href?: string; whatsapp?: boolean }[] = [
  { ad: "Instagram", ikon: "instagram", href: INSTAGRAM_URL },
  { ad: "LinkedIn", ikon: "linkedin", href: LINKEDIN_URL },
  { ad: "WhatsApp", ikon: "whatsapp", whatsapp: true },
];
