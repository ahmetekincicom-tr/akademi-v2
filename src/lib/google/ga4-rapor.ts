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

/* ------------------------------------------------------ panel metrikleri --- */

export type PanelAralik = 7 | 30 | 90;

export type PanelSatir = {
  views: number;
  degisim: number | null;
  ortEngagementSn: number;
  cta: number;
  cvr: number | null;
  /** Aralık uzunluğunda günlük görüntülenme dizisi (sparkline). */
  gunluk: number[];
};
export type PanelOzet = {
  toplamViews: number;
  degisim: number | null;
  ortEngagementSn: number;
  toplamCta: number;
  cvr: number | null;
  tamamlanmaOrani: number | null;
};
export type PanelSonuc =
  | { yapilandirildi: false }
  | { yapilandirildi: true; satir: Map<string, PanelSatir>; ozet: PanelOzet };

/** YYYYMMDD (GA4 `date` boyutu biçimi), n gün önce. */
function isoSikisik(gunOnce: number): string {
  return isoGun(gunOnce).replace(/-/g, "");
}

/**
 * Blog performans paneli metrikleri (seçili aralık: 7/30/90 gün).
 *
 * Sabit 3 GA4 çağrısı (yazı sayısından bağımsız, N+1 yok):
 *  1. pagePath × [screenPageViews, activeUsers, userEngagementDuration],
 *     güncel + önceki dönem (2 dateRange) → görüntülenme, değişim, süre.
 *  2. pagePath × eventName [cta/complete/view] → dönüşüm ve tamamlanma.
 *  3. date × pagePath × screenPageViews → günlük trend (sparkline).
 */
export async function blogPanelMetrikleri(sluglar: string[], gun: PanelAralik): Promise<PanelSonuc> {
  const yapi = ga4Yapisi();
  if (!yapi) return { yapilandirildi: false };

  return onbellekli(`panel:${gun}:${sluglar.length}`, async () => {
    const kume = new Set(sluglar);

    const trafik: Ga4Rapor = await ga4RunReport(yapi, {
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }, { name: "userEngagementDuration" }],
      dateRanges: [
        { startDate: isoGun(gun), endDate: "today" },
        { startDate: isoGun(gun * 2), endDate: isoGun(gun + 1) },
      ],
      limit: 5000,
    });

    const olayRapor: Ga4Rapor = await ga4RunReport(yapi, {
      dimensions: [{ name: "pagePath" }, { name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      dateRanges: [{ startDate: isoGun(gun), endDate: "today" }],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          inListFilter: { values: ["blog_cta_click", "blog_complete", "blog_view"] },
        },
      },
      limit: 5000,
    });

    const gunlukRapor: Ga4Rapor = await ga4RunReport(yapi, {
      dimensions: [{ name: "date" }, { name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }],
      dateRanges: [{ startDate: isoGun(gun), endDate: "today" }],
      limit: 20000,
    });

    type Ham = { views: number; prevViews: number; users: number; eng: number; cta: number; complete: number; view: number; gunluk: Map<string, number> };
    const ham = new Map<string, Ham>();
    const al = (slug: string): Ham =>
      ham.get(slug) ?? { views: 0, prevViews: 0, users: 0, eng: 0, cta: 0, complete: 0, view: 0, gunluk: new Map() };

    for (const s of trafik.rows ?? []) {
      const slug = yolaSlug(d(s, 0));
      if (!slug || !kume.has(slug)) continue;
      const cur = al(slug);
      if ((d(s, 1) || "date_range_0").endsWith("0")) {
        cur.views += m(s, 0);
        cur.users += m(s, 1);
        cur.eng += m(s, 2);
      } else {
        cur.prevViews += m(s, 0);
      }
      ham.set(slug, cur);
    }
    for (const s of olayRapor.rows ?? []) {
      const slug = yolaSlug(d(s, 0));
      if (!slug || !kume.has(slug)) continue;
      const cur = al(slug);
      const ad = d(s, 1);
      if (ad === "blog_cta_click") cur.cta += m(s, 0);
      else if (ad === "blog_complete") cur.complete += m(s, 0);
      else if (ad === "blog_view") cur.view += m(s, 0);
      ham.set(slug, cur);
    }
    for (const s of gunlukRapor.rows ?? []) {
      const slug = yolaSlug(d(s, 1));
      if (!slug || !kume.has(slug)) continue;
      const cur = al(slug);
      cur.gunluk.set(d(s, 0), m(s, 0));
      ham.set(slug, cur);
    }

    // Aralık boyunca gün anahtarları (eski → yeni), sparkline'ı boşluklarla dolu tutmak için.
    const gunAnahtar: string[] = [];
    for (let i = gun - 1; i >= 0; i--) gunAnahtar.push(isoSikisik(i));

    const satir = new Map<string, PanelSatir>();
    let tView = 0, tPrev = 0, tUsers = 0, tEng = 0, tCta = 0, tComplete = 0, tViewEv = 0;
    for (const [slug, h] of ham) {
      tView += h.views; tPrev += h.prevViews; tUsers += h.users; tEng += h.eng;
      tCta += h.cta; tComplete += h.complete; tViewEv += h.view;
      satir.set(slug, {
        views: h.views,
        degisim: yuzdeDegisim(h.views, h.prevViews),
        ortEngagementSn: h.users > 0 ? Math.round(h.eng / h.users) : 0,
        cta: h.cta,
        cvr: h.views > 0 ? (h.cta / h.views) * 100 : null,
        gunluk: gunAnahtar.map((k) => h.gunluk.get(k) ?? 0),
      });
    }

    const ozet: PanelOzet = {
      toplamViews: tView,
      degisim: yuzdeDegisim(tView, tPrev),
      ortEngagementSn: tUsers > 0 ? Math.round(tEng / tUsers) : 0,
      toplamCta: tCta,
      cvr: tView > 0 ? (tCta / tView) * 100 : null,
      tamamlanmaOrani: tViewEv > 0 ? (tComplete / tViewEv) * 100 : null,
    };
    return { yapilandirildi: true as const, satir, ozet };
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
