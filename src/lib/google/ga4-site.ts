import "server-only";

import { ga4Yapisi, ga4RunReport, type Ga4Rapor } from "@/lib/google/ga4-erisim";
import type { SeoAralik } from "@/lib/google/gsc-site";

/**
 * Site geneli GA4 verisi — SEO dashboard için (organik ziyaret + dönüşüm olayı).
 *
 * Blog GA4 servisleri (ga4-erisim / ga4-rapor) yeniden yazılmadı; buradaki
 * fonksiyonlar ga4-erisim'i REUSE ediyor. Batch + 30 dk cache. Yapılandırma/
 * hata olursa {yapilandirildi:false} / fırlatma → çağıran yakalıyor.
 *
 * Organik = sessionDefaultChannelGroup "Organic Search". Dönüşüm olayları:
 * whatsapp_iletisim (lead) + blog_cta_click. Gerçek olan gösterilir; yoksa "—".
 */

export const DONUSUM_OLAYLARI = ["whatsapp_iletisim", "blog_cta_click"];
const ORGANIK = "Organic Search";

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

export function ga4SiteOnbellegiTemizle(): void {
  onbellek.clear();
}

function isoGun(gunOnce: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - gunOnce);
  return d.toISOString().slice(0, 10);
}
const num = (v: string | undefined) => Number(v ?? "0") || 0;

/* ------------------------------------------------------------ özet --- */

export type Ga4OrganikOzet =
  | { yapilandirildi: false }
  | { yapilandirildi: true; organik: number; organikOnce: number; donusum: number; donusumOnce: number };

/** Site geneli organik oturum + dönüşüm olayı (güncel + önceki dönem). */
export async function ga4OrganikOzet(gun: SeoAralik): Promise<Ga4OrganikOzet> {
  const yapi = ga4Yapisi();
  if (!yapi) return { yapilandirildi: false };

  return onbellekli(`ozet:${gun}`, async () => {
    const donemler = [
      { startDate: isoGun(gun), endDate: "today" },
      { startDate: isoGun(gun * 2), endDate: isoGun(gun + 1) },
    ];

    const [organikRapor, donusumRapor]: [Ga4Rapor, Ga4Rapor] = await Promise.all([
      ga4RunReport(yapi, {
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "sessions" }],
        dateRanges: donemler,
      }),
      ga4RunReport(yapi, {
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        dateRanges: donemler,
        dimensionFilter: {
          filter: { fieldName: "eventName", inListFilter: { values: DONUSUM_OLAYLARI } },
        },
      }),
    ]);

    // GA4 çoklu dateRange: her satır dimensionValues sonunda date_range_N taşır.
    let organik = 0;
    let organikOnce = 0;
    for (const s of organikRapor.rows ?? []) {
      if ((s.dimensionValues?.[0]?.value ?? "") !== ORGANIK) continue;
      const dr = s.dimensionValues?.[1]?.value ?? "date_range_0";
      if (dr.endsWith("0")) organik += num(s.metricValues?.[0]?.value);
      else organikOnce += num(s.metricValues?.[0]?.value);
    }

    let donusum = 0;
    let donusumOnce = 0;
    for (const s of donusumRapor.rows ?? []) {
      const dr = s.dimensionValues?.[1]?.value ?? "date_range_0";
      if (dr.endsWith("0")) donusum += num(s.metricValues?.[0]?.value);
      else donusumOnce += num(s.metricValues?.[0]?.value);
    }

    return { yapilandirildi: true as const, organik, organikOnce, donusum, donusumOnce };
  });
}

/* ----------------------------------------------------------- sayfa --- */

export type Ga4SayfaOzet =
  | { yapilandirildi: false }
  | {
      yapilandirildi: true;
      organik: number;
      gunluk: { tarih: string; views: number }[];
      olaylar: Record<string, number>;
    };

/** Tek sayfanın organik oturumları (günlük) + dönüşüm olayları. */
export async function ga4SayfaOzet(yol: string, gun: SeoAralik): Promise<Ga4SayfaOzet> {
  const yapi = ga4Yapisi();
  if (!yapi) return { yapilandirildi: false };

  return onbellekli(`sayfa:${gun}:${yol}`, async () => {
    // GA4 pagePath sondaki çizgi/query'siz gelir; regex ile tam eşleşme.
    const yolKacir = (yol === "/" ? "/" : yol.replace(/\/+$/, "")).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const sayfaFiltre = {
      filter: { fieldName: "pagePath", stringFilter: { matchType: "FULL_REGEXP", value: `^${yolKacir}/?$` } },
    };

    const [organikRapor, olayRapor]: [Ga4Rapor, Ga4Rapor] = await Promise.all([
      ga4RunReport(yapi, {
        dimensions: [{ name: "date" }],
        metrics: [{ name: "sessions" }],
        dateRanges: [{ startDate: isoGun(gun), endDate: "today" }],
        dimensionFilter: {
          andGroup: {
            expressions: [
              sayfaFiltre,
              { filter: { fieldName: "sessionDefaultChannelGroup", stringFilter: { value: ORGANIK } } },
            ],
          },
        },
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
      ga4RunReport(yapi, {
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        dateRanges: [{ startDate: isoGun(gun), endDate: "today" }],
        dimensionFilter: {
          andGroup: {
            expressions: [
              sayfaFiltre,
              { filter: { fieldName: "eventName", inListFilter: { values: DONUSUM_OLAYLARI } } },
            ],
          },
        },
      }),
    ]);

    let organik = 0;
    const gunluk = (organikRapor.rows ?? []).map((s) => {
      const v = num(s.metricValues?.[0]?.value);
      organik += v;
      return { tarih: s.dimensionValues?.[0]?.value ?? "", views: v };
    });

    const olaylar: Record<string, number> = {};
    for (const s of olayRapor.rows ?? []) {
      olaylar[s.dimensionValues?.[0]?.value ?? ""] = num(s.metricValues?.[0]?.value);
    }

    return { yapilandirildi: true as const, organik, gunluk, olaylar };
  });
}
