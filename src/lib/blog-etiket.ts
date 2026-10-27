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

/* ------------------------------------------------- panel: etiket önerisi --- */
/*
  Etiket alanı virgülle ayrılmış serbest metin. Öneri, var olan etiketleri
  öne çıkarıyor: aynı konuya "Meta Ads", "meta reklam", "Meta ADS" diye üç
  ayrı etiket açılmasın (her biri ayrı, ince bir sayfa olurdu). Karşılaştırma
  adres (slug) üzerinden: büyük/küçük harf ve Türkçe harf farkı yok sayılıyor.
*/

/** Virgülle ayrılmış metnin etiketleri (boşlar atılır). */
export function etiketleriAyir(metin: string): string[] {
  return metin
    .split(",")
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/**
 * Yazılmakta olan (son virgülden sonraki) parçaya göre var olan etiketler.
 * Parça boşsa en çok kullanılanlar. Yazıda zaten olanlar önerilmez.
 */
export function etiketOnerileri(metin: string, mevcut: EtiketOzeti[], adet = 8): EtiketOzeti[] {
  const parcalar = metin.split(",");
  const yazilan = etiketSlug(parcalar[parcalar.length - 1] ?? "");
  const kullanilan = new Set(etiketleriAyir(parcalar.slice(0, -1).join(",")).map(etiketSlug));
  const adaylar = mevcut.filter((e) => !kullanilan.has(e.slug) && e.slug !== yazilan);
  if (!yazilan) return adaylar.slice(0, adet);
  const basla = adaylar.filter((e) => e.slug.startsWith(yazilan));
  const icinde = adaylar.filter((e) => !e.slug.startsWith(yazilan) && e.slug.includes(yazilan));
  return [...basla, ...icinde].slice(0, adet);
}

/** Öneri seçilince: son parça önerinin yazımıyla değişir, ardına ", ". */
export function etiketSec(metin: string, ad: string): string {
  const parcalar = metin.split(",");
  parcalar[parcalar.length - 1] = ` ${ad}`;
  return `${parcalar.map((p) => p.trim()).filter(Boolean).join(", ")}, `;
}

/**
 * Var olan bir etiketle aynı adrese düşen ama farklı yazılmış etiketler
 * (ör. "meta ads" ↔ "Meta Ads"). Kayıtta var olan yazıma çevriliyor.
 */
export function etiketYazimFarklari(etiketler: string[], mevcut: EtiketOzeti[]): { yazilan: string; kanonik: string }[] {
  const harita = new Map(mevcut.map((e) => [e.slug, e.ad]));
  return etiketler
    .map((yazilan) => ({ yazilan, kanonik: harita.get(etiketSlug(yazilan)) ?? yazilan }))
    .filter((f) => f.kanonik !== f.yazilan);
}

/** Kayda gidecek etiketler: var olan yazıma çevrilmiş, aynı adrese düşen tekrarlar atılmış. */
export function etiketleriDuzenle(etiketler: string[], mevcut: EtiketOzeti[]): string[] {
  const harita = new Map(mevcut.map((e) => [e.slug, e.ad]));
  const gorulen = new Set<string>();
  const sonuc: string[] = [];
  for (const e of etiketler) {
    const slug = etiketSlug(e);
    if (!slug || gorulen.has(slug)) continue;
    gorulen.add(slug);
    sonuc.push(harita.get(slug) ?? e);
  }
  return sonuc;
}
