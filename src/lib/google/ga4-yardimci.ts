/**
 * GA4 rapor saf yardımcıları (server-only DEĞİL — test edilebilir).
 */

/** pagePath → slug: kök tek segment; query ve sondaki çizgi ayıklanır. */
export function yolaSlug(yol: string): string | null {
  const temiz = yol.split("?")[0].replace(/^\/+/, "").replace(/\/+$/, "");
  if (!temiz || temiz.includes("/")) return null;
  return temiz;
}

/** Yüzde değişim; önceki dönem 0/yoksa null (yanıltıcı yüzde gösterme). */
export function yuzdeDegisim(guncel: number, onceki: number): number | null {
  if (!onceki || onceki <= 0) return null;
  return Math.round(((guncel - onceki) / onceki) * 100);
}
