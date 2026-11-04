/**
 * Gelen kutusunun saf görünüm yardımcıları (tarayıcıda ve sunucuda).
 * Veritabanına dokunmuyor; testle sabitleniyor.
 */

/** "908503071259" → "+90 850 307 12 59"; başka ülkeler "+" ile ham rakam. */
export function numaraBicimle(waId: string): string {
  const r = waId.replace(/\D/g, "");
  if (r.length === 12 && r.startsWith("90")) {
    return `+90 ${r.slice(2, 5)} ${r.slice(5, 8)} ${r.slice(8, 10)} ${r.slice(10)}`;
  }
  return r ? `+${r}` : waId;
}

const TURLER: Record<string, string> = {
  image: "Fotoğraf",
  video: "Video",
  audio: "Ses kaydı",
  voice: "Ses kaydı",
  document: "Belge",
  sticker: "Çıkartma",
  location: "Konum",
  contacts: "Kişi kartı",
  reaction: "Tepki",
  button: "Düğme yanıtı",
  interactive: "Seçim yanıtı",
  order: "Sipariş",
  unsupported: "Desteklenmeyen mesaj",
};

/** Metni olmayan mesajın okunur adı ("[image]" yerine "Fotoğraf"). */
export function turEtiketi(tur: string): string {
  return TURLER[tur] ?? "Mesaj";
}

/** Liste önizlemesi: metin varsa metin, yoksa tür; medya açıklamasında tür öne. */
export function mesajOnizleme(m: { tur: string; metin: string | null }): string {
  const metin = m.metin?.trim();
  if (m.tur === "text") return metin || "Mesaj";
  return metin ? `${turEtiketi(m.tur)}: ${metin}` : turEtiketi(m.tur);
}

export type KaynakTuru = "meta" | "google" | "ctwa" | "site" | "dogrudan";

/**
 * Kişinin geliş kaynağı. Öncelik: WhatsApp'a tıklama reklamı (mesajda
 * ctwa_clid) → sitedeki tıklamanın reklam kimliği (fbc / gclid) → sitedeki
 * düğme (kod var, reklam yok) → doğrudan yazmış.
 */
export function kaynakBul(g: { ctwa: boolean; kod: boolean; fbc?: string | null; gclid?: string | null }): KaynakTuru {
  if (g.ctwa) return "ctwa";
  if (g.gclid) return "google";
  if (g.fbc) return "meta";
  if (g.kod) return "site";
  return "dogrudan";
}

export const KAYNAK_ADI: Record<KaynakTuru, string> = {
  ctwa: "WhatsApp reklamı (Meta)",
  meta: "Meta reklamı → site",
  google: "Google reklamı → site",
  site: "Site (reklamsız)",
  dogrudan: "Doğrudan yazdı",
};
