import { createHash } from "node:crypto";
import { telefonRakam } from "@/lib/meta/kimlik";

/**
 * GA4'e gönderilen kullanıcı verisi (Measurement Protocol → user_data).
 *
 * GA4'teki "kullanıcı tarafından sağlanan veri toplama" açıkken satışla birlikte
 * e-posta ve telefonun SHA-256 hash'i gidiyor; Google bunu reklam tıklamasıyla
 * eşleştirmede kullanıyor (Ads tarafında "gelişmiş dönüşümler"). HAM değer
 * hiçbir yere gitmez ve yazılmaz.
 *
 * Normalleştirme Google'ın kuralı, Meta'nınkinden iki yerde farklı (bkz.
 * developers.google.com/analytics/devguides/collection/ga4/uid-data):
 *  - gmail.com / googlemail.com adreslerinde @'ten önceki noktalar atılır;
 *  - telefon E.164 biçiminde, başında "+" ile hash'lenir.
 * Tek karakter farkı hash'i tamamen değiştirdiği için eşleşme sessizce sıfıra
 * düşer; kurallar testte sabitlendi.
 */

export type GoogleKullaniciVerisi = {
  sha256_email_address?: string[];
  sha256_phone_number?: string[];
};

const hash = (deger: string) => createHash("sha256").update(deger, "utf8").digest("hex");

const GMAIL = new Set(["gmail.com", "googlemail.com"]);

/** Google'ın e-posta normalleştirmesi (hash'siz); okunamıyorsa null. */
export function googleEposta(deger: string | null | undefined): string | null {
  if (typeof deger !== "string") return null;
  const temiz = deger.replace(/\s+/g, "").toLowerCase();
  const at = temiz.lastIndexOf("@");
  if (at < 1 || at === temiz.length - 1) return null;
  const yerel = temiz.slice(0, at);
  const alan = temiz.slice(at + 1);
  return `${GMAIL.has(alan) ? yerel.replace(/\./g, "") : yerel}@${alan}`;
}

/** Google'ın telefon normalleştirmesi: "+905321234567"; okunamıyorsa null. */
export function googleTelefon(deger: string | null | undefined): string | null {
  const rakam = telefonRakam(deger);
  return rakam ? `+${rakam}` : null;
}

/** Hash'li user_data; eşleştirilecek hiçbir alan yoksa null (boş nesne gönderilmez). */
export function googleKullaniciVerisi(girdi: {
  eposta?: string | null;
  telefon?: string | null;
}): GoogleKullaniciVerisi | null {
  const veri: GoogleKullaniciVerisi = {};
  const eposta = googleEposta(girdi.eposta);
  if (eposta) veri.sha256_email_address = [hash(eposta)];
  const telefon = googleTelefon(girdi.telefon);
  if (telefon) veri.sha256_phone_number = [hash(telefon)];
  return Object.keys(veri).length ? veri : null;
}
