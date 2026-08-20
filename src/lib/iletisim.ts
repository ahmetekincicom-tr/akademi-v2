import type { IconName } from "@/components/Icon";

/** Single source of truth for contact details used across the site. */

export const WHATSAPP_NUMARALAR = [
  { gosterim: "+90 850 307 1259", numara: "908503071259" },
  { gosterim: "+90 545 276 6866", numara: "905452766866" },
];

export const EPOSTA = "iletisim@ahmetekinciakademi.com";
export const INSTAGRAM_KULLANICI = "@ahmetekincicomtr";
export const INSTAGRAM_URL = "https://instagram.com/ahmetekincicomtr";
export const LINKEDIN_URL = "https://www.linkedin.com/in/ahmetekinci";
export const SEHIR = "Ankara";
export const OFIS_ADRESI = "Next Level Tower, Ankara";

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
export function olculenWhatsapp(yer: string, sira = 0) {
  const q = new URLSearchParams({ yer });
  if (sira) q.set("no", String(sira));
  return `/git/whatsapp?${q}`;
}

export const SOSYAL: { ad: string; ikon: IconName; href: string }[] = [
  { ad: "Instagram", ikon: "instagram", href: INSTAGRAM_URL },
  { ad: "LinkedIn", ikon: "linkedin", href: LINKEDIN_URL },
  { ad: "WhatsApp", ikon: "whatsapp", href: olculenWhatsapp("sosyal") },
];
