import "server-only";

import { ga4Yapisi, ga4RunReport, type Ga4Rapor, type Ga4Satir } from "@/lib/google/ga4-erisim";
import { yolaSlug, yuzdeDegisim } from "@/lib/google/ga4-yardimci";

export { yuzdeDegisim } from "@/lib/google/ga4-yardimci";

/**
 * Blog performans raporları (GA4 Data API).
 *
 * Tasarım:
 *  - URL normalizasyonu: blog yazıları kökte /{slug}/. pagePath'in sondaki
 *    çizgisi ve query'si ayıklanıp slug'a indiriliyor (aynı yazının varyantları
 *    tek sayılıyor). GA4 `pagePath` zaten query'siz döner; yine de güvenceye
 *    alıyoruz.
 *  - N+1 yok: liste metrikleri TÜM yazılar için 2 çağrıda (görüntülenme +
 *    CTA). Detayda yazı başına ~3 çağrı, 30 dk önbellekle.
 *  - Güvenli: yapılandırma yoksa {yapilandirildi:false}; API hatası fırlatılıp
 *    çağıran tarafından yakalanıyor (CMS'i bozmuyor).
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

/** Önbelleği elle temizler ("Verileri yenile" için). */
export function ga4OnbellegiTemizle(): void {
  onbellek.clear();
}

function isoGun(gunOnce: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - gunOnce);
  return d.toISOString().slice(0, 10);
}

const d = (s: Ga4Satir, i: number) => s.dimensionValues?.[i]?.value ?? "";
const m = (s: Ga4Satir, i: number) => Number(s.metricValues?.[i]?.value ?? "0") || 0;

/* ----------------------------------------------------- liste metrikleri --- */

export type ListeMetrik = { views30: number; oncekiViews30: number; degisim: number | null; cta30: number };
export type ListeSonuc =
  | { yapilandirildi: false }
  | { yapilandirildi: true; metrikler: Map<string, ListeMetrik> };

/** Tüm yazılar için 30 gün görüntülenme + değişim + CTA (2 GA4 çağrısı). */
export async function blogListeMetrikleri(sluglar: string[]): Promise<ListeSonuc> {
  const yapi = ga4Yapisi();
  if (!yapi) return { yapilandirildi: false };

  return onbellekli(`liste:${sluglar.length}`, async () => {
    const slugKume = new Set(sluglar);

    // 1) Görüntülenme: güncel 30 gün + önceki 30 gün (tek raporda 2 dateRange).
    const gorRapor: Ga4Rapor = await ga4RunReport(yapi, {
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }],
      dateRanges: [
        { startDate: isoGun(30), endDate: "today" },
        { startDate: isoGun(60), endDate: isoGun(31) },
      ],
      limit: 2000,
    });

    // 2) CTA tıklamaları (güncel 30 gün), pagePath × eventName.
    const ctaRapor: Ga4Rapor = await ga4RunReport(yapi, {
      dimensions: [{ name: "pagePath" }, { name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      dateRanges: [{ startDate: isoGun(30), endDate: "today" }],
      dimensionFilter: {
        filter: { fieldName: "eventName", stringFilter: { value: "blog_cta_click" } },
      },
      limit: 2000,
    });

    const metrikler = new Map<string, ListeMetrik>();
    const al = (slug: string): ListeMetrik =>
      metrikler.get(slug) ?? { views30: 0, oncekiViews30: 0, degisim: null, cta30: 0 };

    // Görüntülenme raporunda dateRange, ekstra bir boyut olarak "dateRange"
    // dönüyor; iki aralık iki ayrı satır. metricValues tek: screenPageViews.
    for (const satir of gorRapor.rows ?? []) {
      const slug = yolaSlug(d(satir, 0));
      if (!slug || !slugKume.has(slug)) continue;
      const aralik = d(satir, 1); // "date_range_0" | "date_range_1"
      const cur = al(slug);
      if (aralik.endsWith("0")) cur.views30 += m(satir, 0);
      else cur.oncekiViews30 += m(satir, 0);
      metrikler.set(slug, cur);
    }
    for (const satir of ctaRapor.rows ?? []) {
      const slug = yolaSlug(d(satir, 0));
      if (!slug || !slugKume.has(slug)) continue;
      const cur = al(slug);
      cur.cta30 += m(satir, 0);
      metrikler.set(slug, cur);
    }
    for (const [slug, cur] of metrikler) {
      cur.degisim = yuzdeDegisim(cur.views30, cur.oncekiViews30);
      metrikler.set(slug, cur);
    }
    return { yapilandirildi: true as const, metrikler };
  });
}

/* ----------------------------------------------------- detay metrikleri --- */

export type DetayMetrik = {
  views7: number;
  views30: number;
  views90: number;
  oncekiViews30: number;
  degisim: number | null;
  users30: number;
  ortEngagementSn: number;
  olaylar: Record<string, number>;
  gunluk: { tarih: string; views: number }[];
};
export type DetaySonuc =
  | { yapilandirildi: false }
  | { yapilandirildi: true; metrik: DetayMetrik };

const slugFiltresi = (slug: string) => ({
  orGroup: {
    expressions: [
      { filter: { fieldName: "pagePath", stringFilter: { value: `/${slug}/` } } },
      { filter: { fieldName: "pagePath", stringFilter: { value: `/${slug}` } } },
    ],
  },
});

/** Tek yazının detay metrikleri (~3 GA4 çağrısı, 30 dk önbellekli). */
export async function blogDetayMetrikleri(slug: string): Promise<DetaySonuc> {
  const yapi = ga4Yapisi();
  if (!yapi) return { yapilandirildi: false };

  return onbellekli(`detay:${slug}`, async () => {
    // 1) Görüntülenme/kullanıcı/engagement: 7/30/90 + önceki 30 (4 dateRange).
    const trafik: Ga4Rapor = await ga4RunReport(yapi, {
      dimensions: [{ name: "pagePath" }],
      metrics: [
        { name: "screenPageViews" },
        { name: "activeUsers" },
        { name: "userEngagementDuration" },
      ],
      dateRanges: [
        { startDate: isoGun(7), endDate: "today" },
        { startDate: isoGun(30), endDate: "today" },
        { startDate: isoGun(90), endDate: "today" },
        { startDate: isoGun(60), endDate: isoGun(31) },
      ],
      dimensionFilter: slugFiltresi(slug),
    });

    const donem: Record<string, { views: number; users: number; eng: number }> = {};
    for (const satir of trafik.rows ?? []) {
      const aralik = d(satir, 1) || "date_range_0";
      const cur = donem[aralik] ?? { views: 0, users: 0, eng: 0 };
      cur.views += m(satir, 0);
      cur.users += m(satir, 1);
      cur.eng += m(satir, 2);
      donem[aralik] = cur;
    }
    const dr = (i: number) => donem[`date_range_${i}`] ?? { views: 0, users: 0, eng: 0 };

    // 2) Blog olayları (30 gün): eventName × eventCount.
    const olayRapor: Ga4Rapor = await ga4RunReport(yapi, {
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      dateRanges: [{ startDate: isoGun(30), endDate: "today" }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            slugFiltresi(slug),
            { filter: { fieldName: "eventName", inListFilter: { values: BLOG_OLAYLAR } } },
          ],
        },
      },
    });
    const olaylar: Record<string, number> = {};
    for (const satir of olayRapor.rows ?? []) olaylar[d(satir, 0)] = m(satir, 0);

    // 3) Günlük görüntülenme (son 30 gün) — küçük zaman serisi grafiği için.
    const gunlukRapor: Ga4Rapor = await ga4RunReport(yapi, {
      dimensions: [{ name: "date" }],
      metrics: [{ name: "screenPageViews" }],
      dateRanges: [{ startDate: isoGun(30), endDate: "today" }],
      dimensionFilter: slugFiltresi(slug),
      orderBys: [{ dimension: { dimensionName: "date" } }],
    });
    const gunluk = (gunlukRapor.rows ?? []).map((s) => ({
      tarih: d(s, 0), // YYYYMMDD
      views: m(s, 0),
    }));

    const eng30 = dr(1);
    const metrik: DetayMetrik = {
      views7: dr(0).views,
      views30: dr(1).views,
      views90: dr(2).views,
      oncekiViews30: dr(3).views,
      degisim: yuzdeDegisim(dr(1).views, dr(3).views),
      users30: eng30.users,
      ortEngagementSn: eng30.users > 0 ? Math.round(eng30.eng / eng30.users) : 0,
      olaylar,
      gunluk,
    };
    return { yapilandirildi: true as const, metrik };
  });
}

export const BLOG_OLAYLAR = [
  "blog_view",
  "blog_scroll_25",
  "blog_scroll_50",
  "blog_scroll_75",
  "blog_complete",
  "blog_cta_click",
  "blog_prompt_copy",
  "blog_image_lightbox",
  "blog_related_post_click",
];
