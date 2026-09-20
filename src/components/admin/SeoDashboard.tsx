import Link from "next/link";
import { SeoYenile } from "@/components/admin/SeoYenile";
import { TUR_ETIKET, type SayfaTuru } from "@/lib/seo/sayfa-turu";
import type { SeoAralik, SeoSayfaSatir, SeoToplam } from "@/lib/google/gsc-site";
import type { Ga4OrganikOzet } from "@/lib/google/ga4-site";

/**
 * Merkezi SEO Performans Dashboard (site geneli).
 *
 * Yalnız GERÇEK veri: Search Console (tıklama/gösterim/CTR/pozisyon) + GA4
 * (organik ziyaret, dönüşüm olayı). SEO skoru YOK. Kaynağı olmayan hücre "—".
 * Tasarım blog performans paneliyle aynı dil (KPI kart + yoğun tablo + filtre).
 */

export type DashboardSatir = SeoSayfaSatir & { tur: SayfaTuru; baslik: string };

const sy = new Intl.NumberFormat("tr-TR");
const yuzde = (oran: number) => `%${(oran * 100).toFixed(1)}`;
const ARALIKLAR: SeoAralik[] = [7, 28, 90];

function DeltaYuzde({ cur, prev }: { cur: number; prev: number }) {
  if (!prev || prev <= 0) return <span className="text-[10.5px] text-[#9aa0ae]">—</span>;
  const d = Math.round(((cur - prev) / prev) * 100);
  const arti = d >= 0;
  return (
    <span className={`text-[10.5px] font-bold ${arti ? "text-emerald-600" : "text-red-500"}`}>
      {arti ? "↑" : "↓"} %{Math.abs(d)}
    </span>
  );
}

function DeltaBadge({ d }: { d: number | null }) {
  if (d == null) return <span className="text-[10.5px] text-[#9aa0ae]">—</span>;
  const arti = d >= 0;
  return (
    <span className={`text-[10.5px] font-bold ${arti ? "text-emerald-600" : "text-red-500"}`}>
      {arti ? "↑" : "↓"} %{Math.abs(d)}
    </span>
  );
}

const TUR_RENK: Record<SayfaTuru, string> = {
  blog: "border-brand/20 bg-brand/[0.07] text-brand",
  egitim: "border-emerald-200 bg-emerald-50 text-emerald-700",
  statik: "border-ink/12 bg-ink/[0.05] text-[#5C6273]",
  diger: "border-amber-200 bg-amber-50 text-amber-700",
};
function TurRozet({ tur }: { tur: SayfaTuru }) {
  return (
    <span className={`inline-block rounded-[6px] border px-2 py-0.5 text-[11px] font-semibold ${TUR_RENK[tur]}`}>
      {TUR_ETIKET[tur]}
    </span>
  );
}

const GRID = "grid-cols-[minmax(220px,2.6fr)_86px_92px_98px_64px_72px_72px]";

export function SeoDashboard({
  gun,
  turFiltre,
  satirlar,
  toplam,
  gscYapili,
  ga4,
  guncelSaat,
}: {
  gun: SeoAralik;
  turFiltre: SayfaTuru | "tumu";
  satirlar: DashboardSatir[];
  toplam: SeoToplam | null;
  gscYapili: boolean;
  ga4: Ga4OrganikOzet;
  guncelSaat: string;
}) {
  const sayimlar: Record<SayfaTuru | "tumu", number> = {
    tumu: satirlar.length,
    blog: satirlar.filter((s) => s.tur === "blog").length,
    egitim: satirlar.filter((s) => s.tur === "egitim").length,
    statik: satirlar.filter((s) => s.tur === "statik").length,
    diger: satirlar.filter((s) => s.tur === "diger").length,
  };
  const gosterilen = turFiltre === "tumu" ? satirlar : satirlar.filter((s) => s.tur === turFiltre);

  const ga4Var = ga4.yapilandirildi;
  const kpis: { etiket: string; deger: string; delta: React.ReactNode; not: string }[] = [
    {
      etiket: "Google tıklama",
      deger: toplam ? sy.format(toplam.clicks) : "—",
      delta: toplam ? <DeltaYuzde cur={toplam.clicks} prev={toplam.clicksOnce} /> : null,
      not: "Search Console",
    },
    {
      etiket: "Gösterim",
      deger: toplam ? sy.format(toplam.impressions) : "—",
      delta: toplam ? <DeltaYuzde cur={toplam.impressions} prev={toplam.imprOnce} /> : null,
      not: "Search Console",
    },
    { etiket: "CTR", deger: toplam ? yuzde(toplam.ctr) : "—", delta: null, not: "tıklama / gösterim" },
    { etiket: "Ort. pozisyon", deger: toplam && toplam.position > 0 ? toplam.position.toFixed(1) : "—", delta: null, not: "düşük = daha iyi" },
    {
      etiket: "Organik ziyaret",
      deger: ga4Var ? sy.format(ga4.organik) : "—",
      delta: ga4Var ? <DeltaYuzde cur={ga4.organik} prev={ga4.organikOnce} /> : null,
      not: "GA4 · Organic Search",
    },
    {
      etiket: "Dönüşüm olayı",
      deger: ga4Var ? sy.format(ga4.donusum) : "—",
      delta: ga4Var ? <DeltaYuzde cur={ga4.donusum} prev={ga4.donusumOnce} /> : null,
      not: "WhatsApp + CTA",
    },
  ];

  return (
    <main className="p-4 pb-14 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-[24px] leading-[1.1] font-extrabold tracking-[-0.02em] sm:text-[27px]">
            SEO performansı
          </h1>
          <p className="mt-[6px] text-[13px] text-[#64748b]">
            Site geneli · son {gun} gün · Search Console + GA4 · güncelleme {guncelSaat}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-[9px] border border-ink/12 bg-white p-[3px]">
            {ARALIKLAR.map((a) => (
              <Link
                key={a}
                href={`/kontrol-9f4x2k/seo-performans?gun=${a}${turFiltre !== "tumu" ? `&tur=${turFiltre}` : ""}`}
                className={`rounded-[7px] px-[11px] py-[6px] text-[13px] font-semibold transition ${
                  a === gun ? "bg-ink text-white" : "text-[#5C6273] hover:text-ink"
                }`}
              >
                {a} gün
              </Link>
            ))}
          </div>
          <SeoYenile />
        </div>
      </div>

      <p className="mt-3 text-[12px] text-[#9aa0ae]">
        Search Console verisi 2-3 gün gecikmeli olabilir; gerçek zamanlı değildir.
      </p>

      {!gscYapili && (
        <div className="mt-4 rounded-[12px] border border-ink/12 bg-mist px-4 py-3 text-[13px] text-[#5C6273]">
          Search Console bağlı değil; tıklama/gösterim/CTR/pozisyon “—” gösteriliyor. Bağlamak için servis hesabını
          property’ye ekleyip sunucuda <code className="mx-1">GSC_SITE_URL</code> tanımlayın. (Kurulum: Sistem tanılama →
          Google Search Console.)
        </div>
      )}
      {!ga4Var && (
        <div className="mt-3 rounded-[12px] border border-ink/12 bg-mist px-4 py-3 text-[13px] text-[#5C6273]">
          GA4 bağlı değil; organik ziyaret ve dönüşüm “—” gösteriliyor.
        </div>
      )}

      {/* KPI kartları */}
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.etiket} className="rounded-[12px] border border-ink/11 bg-white p-4">
            <div className="text-[11px] font-bold tracking-[0.06em] text-[#9aa0ae] uppercase">{k.etiket}</div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-mono text-[20px] font-extrabold tracking-[-0.02em] text-ink">{k.deger}</span>
              {k.delta}
            </div>
            <div className="mt-0.5 text-[11px] text-[#9aa0ae]">{k.not}</div>
          </div>
        ))}
      </div>

      {/* Tür filtresi */}
      <div className="mt-5 flex flex-wrap gap-1.5">
        {(["tumu", "blog", "egitim", "statik", "diger"] as const).map((t) => (
          <Link
            key={t}
            href={`/kontrol-9f4x2k/seo-performans?gun=${gun}${t !== "tumu" ? `&tur=${t}` : ""}`}
            className={`rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition ${
              turFiltre === t ? "border-brand bg-brand/10 text-brand" : "border-ink/12 bg-white text-[#5C6273] hover:text-ink"
            }`}
          >
            {t === "tumu" ? "Tümü" : TUR_ETIKET[t]}{" "}
            <span className="text-[#9aa0ae]">{sayimlar[t]}</span>
          </Link>
        ))}
      </div>

      {/* Sayfa performans tablosu (sm+) */}
      <div className="mt-4 hidden overflow-hidden rounded-[14px] border border-ink/11 bg-white sm:block">
        <div className="overflow-x-auto">
          <div className="min-w-[840px]">
            <div className={`grid ${GRID} gap-3 border-b border-ink/10 bg-mist px-4 py-2.5 text-[10.5px] font-bold tracking-[0.07em] text-[#9aa0ae] uppercase`}>
              <span>Sayfa</span>
              <span className="text-right">Tıklama</span>
              <span className="text-right">Gösterim</span>
              <span className="text-right">CTR / Poz.</span>
              <span className="text-right">Δ tık</span>
              <span>Tür</span>
              <span className="text-right">Detay</span>
            </div>
            {gosterilen.map((s) => (
              <div
                key={s.yol}
                className={`grid ${GRID} items-center gap-3 border-b border-ink/[0.06] px-4 py-3 last:border-0 hover:bg-mist/60`}
              >
                <div className="flex min-w-0 flex-col gap-[3px]">
                  <span className="truncate text-[13.5px] font-semibold tracking-[-0.01em]">{s.baslik}</span>
                  <span className="truncate font-mono text-[11px] text-[#9aa0ae]">{s.yol}</span>
                </div>
                <span className="text-right font-mono text-[13.5px] font-semibold">{sy.format(s.clicks)}</span>
                <span className="text-right font-mono text-[13px] text-[#334155]">{sy.format(s.impressions)}</span>
                <span className="text-right font-mono text-[12.5px] text-[#334155]">
                  {yuzde(s.ctr)} · {s.position > 0 ? s.position.toFixed(1) : "—"}
                </span>
                <span className="text-right">
                  <DeltaBadge d={s.degisim} />
                </span>
                <span>
                  <TurRozet tur={s.tur} />
                </span>
                <div className="flex justify-end">
                  <Link
                    href={`/kontrol-9f4x2k/seo-performans/detay?url=${encodeURIComponent(s.yol)}&gun=${gun}`}
                    className="rounded-[7px] border border-brand/25 bg-brand/[0.06] px-2.5 py-1.5 text-[12px] font-semibold text-brand hover:bg-brand hover:text-white"
                  >
                    Aç
                  </Link>
                </div>
              </div>
            ))}
            {gosterilen.length === 0 && (
              <div className="px-4 py-10 text-center text-[13px] text-[#9aa0ae]">
                {gscYapili ? "Bu türde veri yok." : "Search Console bağlanınca sayfalar burada listelenir."}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobil kartlar */}
      <div className="mt-4 flex flex-col gap-3 sm:hidden">
        {gosterilen.map((s) => (
          <Link
            key={s.yol}
            href={`/kontrol-9f4x2k/seo-performans/detay?url=${encodeURIComponent(s.yol)}&gun=${gun}`}
            className="rounded-[13px] border border-ink/11 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-[14px] font-bold">{s.baslik}</div>
                <div className="mt-0.5 truncate font-mono text-[11px] text-[#9aa0ae]">{s.yol}</div>
              </div>
              <TurRozet tur={s.tur} />
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 border-t border-ink/[0.07] pt-3 text-center">
              <div>
                <div className="text-[10px] text-[#9aa0ae]">Tık</div>
                <div className="font-mono text-[14px] font-semibold">{sy.format(s.clicks)}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#9aa0ae]">Göster.</div>
                <div className="font-mono text-[14px]">{sy.format(s.impressions)}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#9aa0ae]">CTR</div>
                <div className="font-mono text-[14px]">{yuzde(s.ctr)}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#9aa0ae]">Poz.</div>
                <div className="font-mono text-[14px]">{s.position > 0 ? s.position.toFixed(1) : "—"}</div>
              </div>
            </div>
          </Link>
        ))}
        {gosterilen.length === 0 && (
          <div className="rounded-[12px] border border-ink/11 bg-white px-4 py-8 text-center text-[13px] text-[#9aa0ae]">
            {gscYapili ? "Bu türde veri yok." : "Search Console bağlanınca sayfalar burada listelenir."}
          </div>
        )}
      </div>
    </main>
  );
}
