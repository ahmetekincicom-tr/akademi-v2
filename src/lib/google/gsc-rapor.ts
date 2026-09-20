import "server-only";

import { gscYapisi, gscQuery, type GscRow } from "@/lib/google/gsc-erisim";
import { gscYolaSlug, gscSlugRegex, yuzdeDegisim } from "@/lib/google/gsc-yardimci";
import type { PanelAralik } from "@/lib/google/ga4-rapor";

/**
 * Search Console (SEO performansı) raporları.
 *
 * Tasarım (GA4 mimarisiyle birebir):
 *  - N+1 yok: liste metrikleri TÜM yazılar için 2 çağrıda (güncel + önceki dönem,
 *    dimension=page). Detayda yazı başına 2 çağrı (günlük seri + sorgular),
 *    30 dk önbellekli.
 *  - Veri gecikmesi: dataState="final" — yalnız Google'ın kesinleştirdiği veri.
 *    Böylece rakamlar gerçek zamanlı gibi sunulmuyor (son 2-3 gün eksik olabilir).
 *  - URL eşleme: gscYolaSlug/gscSlugRegex protokol, host (www), trailing slash ve
 *    query farklarını normalize eder (bkz. gsc-yardimci).
 *  - Güvenli: yapılandırma yoksa {yapilandirildi:false}; API hatası fırlatılıp
 *    çağıran tarafından yakalanıyor (CMS/panel bozulmuyor).
 */

const ONBELLEK_MS = 30 * 60 * 1000; // 30 dakika
const onbellek = new Map<string, { veri: unknown; bitis: number }>();

async function onbellekli<T>(anahtar: string, uret: () => Promise<T>): Promise<T> {
  const simdi = Date.now();
  const v = onbellek.get(anahtar);
  if (v && v.bitis > simdi) return v.veri as T;
  const veri = await uret();
  onbellek.set(anahtar, { veri, bitis: simdi + ONBELLEK_MS });
  return veri;
}

/** GSC önbelleğini elle temizler ("Verileri yenile" için). */
export function gscOnbellegiTemizle(): void {
  onbellek.clear();
}

/** GSC yalnız YYYY-MM-DD kabul eder ("today" anahtarı yok). n gün önce. */
function isoGun(gunOnce: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - gunOnce);
  return d.toISOString().slice(0, 10);
}

const BUGUN = () => isoGun(0);

function olcuTopla(rows: { clicks: number; impressions: number; position: number }[]): GscOlcu {
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

/* ------------------------------------------------------- panel metrikleri --- */

export type GscPanelSatir = {
  clicks: number;
  impressions: number;
  ctr: number; // 0-1 (oran)
  position: number;
  degisim: number | null; // tıklama % değişimi (önceki eş dönem)
};
export type GscPanelSonuc =
  | { yapilandirildi: false }
  | { yapilandirildi: true; satir: Map<string, GscPanelSatir> };

/**
 * Blog listesi için SEO metrikleri (seçili aralık: 7/30/90 gün).
 * 2 GSC çağrısı (güncel + önceki dönem), dimension=page.
 */
export async function gscPanelMetrikleri(sluglar: string[], gun: PanelAralik): Promise<GscPanelSonuc> {
  const yapi = gscYapisi();
  if (!yapi) return { yapilandirildi: false };

  return onbellekli(`panel:${gun}:${sluglar.length}`, async () => {
    const kume = new Set(sluglar);

    const govde = (baslangic: string, bitis: string) => ({
      startDate: baslangic,
      endDate: bitis,
      dimensions: ["page"],
      rowLimit: 25000,
      dataState: "final",
    });

    const [guncel, onceki] = await Promise.all([
      gscQuery(yapi, govde(isoGun(gun), BUGUN())),
      gscQuery(yapi, govde(isoGun(gun * 2), isoGun(gun + 1))),
    ]);

    const topla = (rows: GscRow[] | undefined) => {
      const harita = new Map<string, { clicks: number; impressions: number; position: number }[]>();
      for (const r of rows ?? []) {
        const slug = gscYolaSlug(r.keys?.[0] ?? "");
        if (!slug || !kume.has(slug)) continue;
        (harita.get(slug) ?? harita.set(slug, []).get(slug)!).push({
          clicks: r.clicks,
          impressions: r.impressions,
          position: r.position,
        });
      }
      return harita;
    };

    const gHarita = topla(guncel.rows);
    const oHarita = topla(onceki.rows);

    const satir = new Map<string, GscPanelSatir>();
    for (const [slug, rows] of gHarita) {
      const o = olcuTopla(rows);
      const onceOlcu = oHarita.has(slug) ? olcuTopla(oHarita.get(slug)!) : null;
      satir.set(slug, {
        clicks: o.clicks,
        impressions: o.impressions,
        ctr: o.ctr,
        position: o.position,
        degisim: yuzdeDegisim(o.clicks, onceOlcu?.clicks ?? 0),
      });
    }
    return { yapilandirildi: true as const, satir };
  });
}

/* ------------------------------------------------------- detay metrikleri --- */

export type GscOlcu = { clicks: number; impressions: number; ctr: number; position: number };
export type GscSorgu = { sorgu: string; clicks: number; impressions: number; ctr: number; position: number };
export type GscDetayMetrik = {
  d7: GscOlcu;
  d30: GscOlcu;
  d90: GscOlcu;
  o7: GscOlcu; // önceki eş dönemler
  o30: GscOlcu;
  o90: GscOlcu;
  sorgular: GscSorgu[];
};
export type GscDetaySonuc =
  | { yapilandirildi: false }
  | { yapilandirildi: true; metrik: GscDetayMetrik };

/** Tek yazının SEO metrikleri: 1) günlük seri (180g, pencerelere bölünür) 2) sorgular. */
export async function gscDetayMetrikleri(slug: string): Promise<GscDetaySonuc> {
  const yapi = gscYapisi();
  if (!yapi) return { yapilandirildi: false };

  return onbellekli(`detay:${slug}`, async () => {
    const sayfaFiltre = {
      dimensionFilterGroups: [
        { filters: [{ dimension: "page", operator: "includingRegex", expression: gscSlugRegex(slug) }] },
      ],
    };

    const [gunlukRapor, sorguRapor] = await Promise.all([
      gscQuery(yapi, {
        startDate: isoGun(180),
        endDate: BUGUN(),
        dimensions: ["date"],
        ...sayfaFiltre,
        rowLimit: 1000,
        dataState: "final",
      }),
      gscQuery(yapi, {
        startDate: isoGun(90),
        endDate: BUGUN(),
        dimensions: ["query"],
        ...sayfaFiltre,
        rowLimit: 100,
        dataState: "final",
      }),
    ]);

    // Günlük satırları tarih aralıklarına böl (YYYY-MM-DD sözlüksel karşılaştırma).
    const pencere = (bas: number, bit: number): GscOlcu => {
      const bd = isoGun(bas);
      const ed = isoGun(bit);
      const secili = (gunlukRapor.rows ?? []).filter((r) => {
        const t = r.keys?.[0] ?? "";
        return t >= bd && t <= ed;
      });
      return olcuTopla(secili.map((r) => ({ clicks: r.clicks, impressions: r.impressions, position: r.position })));
    };

    const sorgular: GscSorgu[] = (sorguRapor.rows ?? [])
      .map((r) => ({
        sorgu: r.keys?.[0] ?? "",
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      }))
      .filter((s) => s.sorgu)
      .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);

    const metrik: GscDetayMetrik = {
      d7: pencere(7, 0),
      d30: pencere(30, 0),
      d90: pencere(90, 0),
      o7: pencere(14, 8),
      o30: pencere(60, 31),
      o90: pencere(180, 91),
      sorgular,
    };
    return { yapilandirildi: true as const, metrik };
  });
}
