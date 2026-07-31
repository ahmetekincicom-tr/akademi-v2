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
export const SEHIR = "Çankaya, Ankara";

export function whatsappLink(numara: string, mesaj?: string) {
  const q = mesaj ? `?text=${encodeURIComponent(mesaj)}` : "";
  return `https://wa.me/${numara}${q}`;
}

export const SOSYAL: { ad: string; ikon: IconName; href: string }[] = [
  { ad: "Instagram", ikon: "instagram", href: INSTAGRAM_URL },
  { ad: "LinkedIn", ikon: "linkedin", href: LINKEDIN_URL },
  { ad: "WhatsApp", ikon: "whatsapp", href: whatsappLink(WHATSAPP_NUMARALAR[0].numara) },
];
