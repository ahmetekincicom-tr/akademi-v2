import { slugYap } from "@/lib/duyuru";

/**
 * Etiket sayfaları (/blog/etiket/{slug}/).
 *
 * Etiketler bugün yazının üzerinde serbest metin (posts.etiketler). Sayfa
 * adresi metinden türetiliyor: "Meta Ads", "meta ads" ve "Meta  Ads" aynı
 * sayfa. Görünen ad, o etiketi en çok kullanan yazım.
 *
 * İnce sayfa kuralı (kaynak sistemle aynı): 3'ten az yazısı olan etiket
 * sayfası açılıyor ama arama motoruna kapalı ve site haritasında yok.
 */
export const ETIKET_ESIGI = 3;

export function etiketSlug(ad: string): string {
  return slugYap(ad.trim());
}

export function etiketAdresi(ad: string): string {
  return `/blog/etiket/${etiketSlug(ad)}/`;
}

export type EtiketOzeti = { slug: string; ad: string; adet: number };

/** Yazıların etiketlerini toplar; çok yazılı olan önde. */
export function etiketleriTopla(yazilar: { etiketler: string[] }[]): EtiketOzeti[] {
  const harita = new Map<string, { adlar: Map<string, number>; adet: number }>();
  for (const y of yazilar) {
    const gorulen = new Set<string>();
    for (const ham of y.etiketler) {
      const slug = etiketSlug(ham);
      if (!slug || gorulen.has(slug)) continue;
      gorulen.add(slug);
      const k = harita.get(slug) ?? { adlar: new Map(), adet: 0 };
      k.adet++;
      k.adlar.set(ham.trim(), (k.adlar.get(ham.trim()) ?? 0) + 1);
      harita.set(slug, k);
    }
  }
  return [...harita.entries()]
    .map(([slug, k]) => ({ slug, adet: k.adet, ad: [...k.adlar.entries()].sort((a, b) => b[1] - a[1])[0][0] }))
    .sort((a, b) => b.adet - a.adet || a.ad.localeCompare(b.ad, "tr"));
}

export function etiketliMi(yazi: { etiketler: string[] }, slug: string): boolean {
  return yazi.etiketler.some((e) => etiketSlug(e) === slug);
}
