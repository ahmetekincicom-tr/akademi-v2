/**
 * Search Console rapor saf yardımcıları (server-only DEĞİL — test edilebilir).
 *
 * Blog URL'leri kökte çalışıyor (/{slug}/). GSC `page` boyutu TAM URL döndürür
 * (protokol + host + yol). Kayıtlarla eşlerken protokol, host (www farkı),
 * sondaki çizgi ve query normalize ediliyor.
 */

export { yuzdeDegisim } from "@/lib/google/ga4-yardimci";

/** GSC page (tam URL) → blog slug. Kök tek segment; host/protokol/query/trailing slash elenir. */
export function gscYolaSlug(pageUrl: string): string | null {
  let yol = pageUrl;
  if (/^https?:\/\//i.test(pageUrl)) {
    try {
      yol = new URL(pageUrl).pathname;
    } catch {
      return null;
    }
  }
  const temiz = yol.split("?")[0].split("#")[0].replace(/^\/+/, "").replace(/\/+$/, "");
  if (!temiz || temiz.includes("/")) return null;
  try {
    return decodeURIComponent(temiz);
  } catch {
    return temiz;
  }
}

/**
 * GSC page filtresi için RE2 regex: http/https, herhangi host, /{slug} (opsiyonel
 * sondaki çizgi ve query). Host-agnostik olduğu için www/apex ve domain farkları
 * kendiliğinden kapsanır.
 */
export function gscSlugRegex(slug: string): string {
  const kacir = slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return `^https?://[^/]+/${kacir}/?(\\?.*)?$`;
}

/** n gün önce, YYYY-MM-DD (UTC) — GSC tarih parametreleri "today" kabul etmez. */
export function gscGunOnce(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

/** İzlenim (gösterim) ile ağırlıklı ortalama pozisyon; gösterim yoksa 0. */
export function agirlikliPozisyon(satirlar: { position: number; impressions: number }[]): number {
  let topImp = 0;
  let topPos = 0;
  for (const s of satirlar) {
    topImp += s.impressions;
    topPos += s.position * s.impressions;
  }
  return topImp > 0 ? topPos / topImp : 0;
}
