import { TR_ZAMAN } from "@/lib/zaman";

const SAAT = new Intl.DateTimeFormat("en-US", { timeZone: TR_ZAMAN, hour: "2-digit", hour12: false });

/**
 * Günün saatine göre karşılama: panelin genel bakışındaki ilk kelime.
 *
 * Saat Türkiye saati (TR_ZAMAN): sayfa sunucuda çiziliyor ve Vercel UTC'de;
 * cihaz saatine bakmak için istemcide hesaplamak hidrasyon uyuşmazlığı ve
 * ilk karede yanlış selam demekti. Katılımcılar Türkiye'de.
 *
 *   05:00–11:59  Günaydın
 *   12:00–17:59  Merhaba
 *   18:00–22:59  İyi akşamlar
 *   23:00–04:59  İyi geceler
 */
export function gunSelami(an: Date = new Date()): string {
  const saat = Number(SAAT.format(an)) % 24;
  if (saat >= 5 && saat < 12) return "Günaydın";
  if (saat >= 12 && saat < 18) return "Merhaba";
  if (saat >= 18 && saat < 23) return "İyi akşamlar";
  return "İyi geceler";
}
