import { TR_ZAMAN } from "@/lib/zaman";

const PARCA = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TR_ZAMAN,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * Sayfa başlıklarının üstündeki tarih: "CUMARTESİ · 3 EKİM 2026".
 *
 * Parça parça kuruluyor: tarayıcılar ve Node tr-TR'de gün adını farklı yere
 * koyuyor ("3 Ekim 2026 Cumartesi" ↔ "Cumartesi 3 Ekim 2026"); hazır metni
 * bölmek bir ortamda "3 · EKİM 2026 CUMARTESİ" çıkarıyordu.
 */
export function tarihSatiri(an: Date, { yil = true }: { yil?: boolean } = {}): string {
  const p = Object.fromEntries(PARCA.formatToParts(an).map((x) => [x.type, x.value]));
  return `${p.weekday} · ${p.day} ${p.month}${yil ? ` ${p.year}` : ""}`.toLocaleUpperCase("tr");
}

const AY_PARCA = new Intl.DateTimeFormat("en-US", { timeZone: TR_ZAMAN, year: "numeric", month: "2-digit" });

/** Türkiye saatine göre "2026-10" — ay bazlı gruplamada UTC kayması olmasın. */
export function ayAnahtari(an: Date): string {
  const p = Object.fromEntries(AY_PARCA.formatToParts(an).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}`;
}
