import "server-only";

import { gscYapisi, gscQuery, type GscRow } from "@/lib/google/gsc-erisim";
import { gscYol, gscYolRegex, yuzdeDegisim } from "@/lib/google/gsc-yardimci";

/**
 * Site geneli Search Console raporları (SEO dashboard).
 *
 * Blog Faz 2 servisleri (gsc-erisim / gsc-yardimci) yeniden yazılmadı; buradaki
 * fonksiyonlar onları REUSE ediyor. Blog'a özel gsc-rapor.ts'e dokunulmadı.
 *
 * Batch + cache (30 dk): site paneli TÜM sayfalar için 2 çağrı (güncel + önceki
 * dönem, dimension=page). Sayfa detayı 2 çağrı (günlük seri + sorgular). URL
 * başına ayrı çağrı YOK. dataState="final" → veri gecikmesi yansır.
 *
 * Aralık 7/28/90 (GSC standardı 28; blog paneli 7/30/90'dan bilinçli farklı).
 */

export type SeoAralik = 7 | 28 | 90;

const ONBELLEK_MS = 30 * 60 * 1000;
const onbellek = new Map<string, { veri: unknown; bitis: number }>();

async function onbellekli<T>(anahtar: string, uret: () => Promise<T>): Promise<T> {
  const simdi = Date.now();
  const v = onbellek.get(anahtar);
  if (v && v.bitis > simdi) return v.veri as T;
  const veri = await uret();
  onbellek.set(anahtar, { veri, bitis: simdi + ONBELLEK_MS });
  return veri;
}

export function seoOnbellegiTemizle(): void {
  onbellek.clear();
}

function isoGun(gunOnce: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - gunOnce);
  return d.toISOString().slice(0, 10);
}

export type SeoOlcu = { clicks: number; impressions: number; ctr: number; position: number };

function olcuTopla(rows: { clicks: number; impressions: number; position: number }[]): SeoOlcu {
  let clicks = 0;
  let impressions = 0;
  let posAgirlik = 0;
  for (const r of rows) {
    clicks += r.clicks;
    impressions += r.impressions;
    posAgirlik += r.position * r.impressions;
  }
  return {
    clicks,
    impressions,
    ctr: impressions > 0 ? clicks / impressions : 0,
    position: impressions > 0 ? posAgirlik / impressions : 0,
  };
}

/* ------------------------------------------------------------- site --- */

export type SeoSayfaSatir = {
  yol: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  degisim: number | null; // tıklama % değişimi (önceki eş dönem)
};
export type SeoToplam = SeoOlcu & { clicksOnce: number; imprOnce: number };
export type SeoSiteSonuc =
  | { yapilandirildi: false }
  | { yapilandirildi: true; sayfalar: SeoSayfaSatir[]; toplam: SeoToplam };

/** Site geneli sayfa metrikleri (2 çağrı, dimension=page). */
export async function gscSiteMetrikleri(gun: SeoAralik): Promise<SeoSiteSonuc> {
  const yapi = gscYapisi();
  if (!yapi) return { yapilandirildi: false };

  return onbellekli(`site:${gun}`, async () => {
    const govde = (bas: string, bit: string) => ({
      startDate: bas,
      endDate: bit,
      dimensions: ["page"],
      rowLimit: 25000,
      dataState: "final",
    });

    const [guncel, onceki] = await Promise.all([
      gscQuery(yapi, govde(isoGun(gun), isoGun(0))),
      gscQuery(yapi, govde(isoGun(gun * 2), isoGun(gun + 1))),
    ]);

    const yolaTopla = (rows: GscRow[] | undefined) => {
      const harita = new Map<string, { clicks: number; impressions: number; position: number }[]>();
      for (const r of rows ?? []) {
        const yol = gscYol(r.keys?.[0] ?? "");
        if (!yol) continue;
        const dizi = harita.get(yol) ?? [];
        dizi.push({ clicks: r.clicks, impressions: r.impressions, position: r.position });
        harita.set(yol, dizi);
      }
      return harita;
    };

    const gHarita = yolaTopla(guncel.rows);
    const oHarita = yolaTopla(onceki.rows);

    const sayfalar: SeoSayfaSatir[] = [];
    let tClicks = 0;
    let tImpr = 0;
    let tPosAgirlik = 0;
    let tClicksOnce = 0;
    let tImprOnce = 0;

    for (const [yol, rows] of gHarita) {
      const o = olcuTopla(rows);
      const once = oHarita.has(yol) ? olcuTopla(oHarita.get(yol)!) : null;
      sayfalar.push({
        yol,
        clicks: o.clicks,
        impressions: o.impressions,
        ctr: o.ctr,
        position: o.position,
        degisim: yuzdeDegisim(o.clicks, once?.clicks ?? 0),
      });
      tClicks += o.clicks;
      tImpr += o.impressions;
      tPosAgirlik += o.position * o.impressions;
    }
    for (const rows of oHarita.values()) {
      const o = olcuTopla(rows);
      tClicksOnce += o.clicks;
      tImprOnce += o.impressions;
    }

    sayfalar.sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);

    const toplam: SeoToplam = {
      clicks: tClicks,
      impressions: tImpr,
      ctr: tImpr > 0 ? tClicks / tImpr : 0,
      position: tImpr > 0 ? tPosAgirlik / tImpr : 0,
      clicksOnce: tClicksOnce,
      imprOnce: tImprOnce,
    };
    return { yapilandirildi: true as const, sayfalar, toplam };
  });
}

/* ------------------------------------------------------------ detay --- */

export type SeoSorgu = { sorgu: string; clicks: number; impressions: number; ctr: number; position: number };
export type SeoSayfaDetayMetrik = {
  d7: SeoOlcu;
  d28: SeoOlcu;
  d90: SeoOlcu;
  o28: SeoOlcu; // önceki 28 gün (değişim için)
  gunluk: { tarih: string; clicks: number; impressions: number }[];
  sorgular: SeoSorgu[];
};
export type SeoSayfaDetaySonuc =
  | { yapilandirildi: false }
  | { yapilandirildi: true; metrik: SeoSayfaDetayMetrik };

/** Tek sayfanın SEO detayı: 1) günlük seri (180g) 2) sorgular (90g). */
export async function gscSayfaDetay(yol: string): Promise<SeoSayfaDetaySonuc> {
  const yapi = gscYapisi();
  if (!yapi) return { yapilandirildi: false };

  return onbellekli(`detay:${yol}`, async () => {
    const sayfaFiltre = {
      dimensionFilterGroups: [
        { filters: [{ dimension: "page", operator: "includingRegex", expression: gscYolRegex(yol) }] },
      ],
    };

    const [gunlukRapor, sorguRapor] = await Promise.all([
      gscQuery(yapi, {
        startDate: isoGun(180),
        endDate: isoGun(0),
        dimensions: ["date"],
        ...sayfaFiltre,
        rowLimit: 1000,
        dataState: "final",
      }),
      gscQuery(yapi, {
        startDate: isoGun(90),
        endDate: isoGun(0),
        dimensions: ["query"],
        ...sayfaFiltre,
        rowLimit: 100,
        dataState: "final",
      }),
    ]);

    const gunlukTum = (gunlukRapor.rows ?? []).map((r) => ({
      tarih: r.keys?.[0] ?? "",
      clicks: r.clicks,
      impressions: r.impressions,
      position: r.position,
    }));

    const pencere = (bas: number, bit: number): SeoOlcu => {
      const bd = isoGun(bas);
      const ed = isoGun(bit);
      return olcuTopla(gunlukTum.filter((r) => r.tarih >= bd && r.tarih <= ed));
    };

    const sorgular: SeoSorgu[] = (sorguRapor.rows ?? [])
      .map((r) => ({
        sorgu: r.keys?.[0] ?? "",
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      }))
      .filter((s) => s.sorgu)
      .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);

    // Son 28 günün günlük serisi (grafik için, eski → yeni).
    const g28 = isoGun(28);
    const gunluk = gunlukTum
      .filter((r) => r.tarih >= g28)
      .sort((a, b) => a.tarih.localeCompare(b.tarih))
      .map((r) => ({ tarih: r.tarih, clicks: r.clicks, impressions: r.impressions }));

    const metrik: SeoSayfaDetayMetrik = {
      d7: pencere(7, 0),
      d28: pencere(28, 0),
      d90: pencere(90, 0),
      o28: pencere(56, 29),
      gunluk,
      sorgular,
    };
    return { yapilandirildi: true as const, metrik };
  });
}
