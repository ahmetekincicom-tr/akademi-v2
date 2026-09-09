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
 * Ölçülen WhatsApp bağlantısı.
 *
 * wa.me'ye DOĞRUDAN gitmek yerine kendi ucumuzdan geçiyor: orada tıklama
 * kimliği kaydediliyor ve WhatsApp mesajına kısa bir referans kodu
 * gömülüyor. Gerekçesi app/git/whatsapp/route.ts içinde.
 *
 * WordPress'teki ana site de bu adresi kullanıyor — tam adresiyle:
 * https://panel.ahmetekinciakademi.com/git/whatsapp?yer=wp-header
 *
 * `yer` hangi düğmeye basıldığını söylüyor; hangi yerleşimin çalıştığını
 * ancak böyle görebiliyoruz.
 */
export function olculenWhatsapp(yer: string, sira = 0, egitim?: string) {
  const q = new URLSearchParams({ yer });
  if (sira) q.set("no", String(sira));
  // Eğitim detay sayfasındaki düğmeler eğitimin slug'ını taşıyor; hazır mesaj
  // buna göre kuruluyor (bkz. app/git/whatsapp/route.ts).
  if (egitim) q.set("e", egitim);
  /*
    Sondaki eğik çizgi ŞART.

    next.config.ts'te trailingSlash açık: çizgisiz yazılan adres önce 308 ile
    çizgili biçime yönlendiriliyordu. Yani WhatsApp'a giden her tıklama iki
    sıçrama yapıyordu (308 → 303 → wa.me) ve telefonda uygulamanın açılması
    o kadar gecikiyordu. Ölçüldü: çizgiyle tek sıçrama kalıyor.
  */
  return `/git/whatsapp/?${q}`;
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

export const SOSYAL: { ad: string; ikon: IconName; href: string }[] = [
  { ad: "Instagram", ikon: "instagram", href: INSTAGRAM_URL },
  { ad: "LinkedIn", ikon: "linkedin", href: LINKEDIN_URL },
  { ad: "WhatsApp", ikon: "whatsapp", href: olculenWhatsapp("sosyal") },
];
