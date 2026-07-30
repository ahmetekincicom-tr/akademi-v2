type SeansBenzeri = { baslangic: string; durum: "planlandi" | "tamamlandi" | "iptal" };

/**
 * Splits sessions into upcoming and past. Kept out of component bodies so the
 * "now" read doesn't happen during render.
 */
export function seansAyir<T extends SeansBenzeri>(seanslar: T[]): { yaklasan: T[]; gecmis: T[] } {
  const simdi = Date.now();
  const yaklasan: T[] = [];
  const gecmis: T[] = [];

  for (const s of seanslar) {
    if (s.durum === "planlandi" && new Date(s.baslangic).getTime() >= simdi) yaklasan.push(s);
    else gecmis.push(s);
  }

  return { yaklasan, gecmis };
}
