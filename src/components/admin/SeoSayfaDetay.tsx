import Link from "next/link";
import { TUR_ETIKET, type SayfaTuru } from "@/lib/seo/sayfa-turu";
import type { SeoSayfaDetaySonuc, SeoOlcu } from "@/lib/google/gsc-site";
import type { Ga4SayfaOzet } from "@/lib/google/ga4-site";

/**
 * Site SEO dashboard'unda bir sayfanın detayı.
 *
 * GSC: zaman serisi + özet (7/28/90 + değişim) + en çok trafik getiren sorgular.
 * GA4: organik trafik + dönüşüm olayları. Yalnız gerçek veri; yoksa "—" / boş
 * state. Sahte veri yok.
 */

const sy = new Intl.NumberFormat("tr-TR");
const yuzde = (oran: number) => `%${(oran * 100).toFixed(1)}`;
const pozFmt = (p: number) => (p > 0 ? p.toFixed(1) : "—");
const SORGU_ILK = 15;

function Kutu({ ust, deger, alt }: { ust: string; deger: string; alt?: string }) {
  return (
    <div className="rounded-[12px] border border-ink/11 bg-white p-4">
      <div className="text-[12px] text-[#6B7080]">{ust}</div>
      <div className="mt-1 text-[22px] font-semibold text-ink">{deger}</div>
      {alt && <div className="mt-0.5 text-[11.5px] text-[#9aa0ae]">{alt}</div>}
    </div>
  );
}

function DeltaClicks({ cur, prev }: { cur: number; prev: number }) {
  if (!prev || prev <= 0) return <span className="text-[11px] text-[#9aa0ae]">—</span>;
  const d = Math.round(((cur - prev) / prev) * 100);
  const arti = d >= 0;
  return (
    <span className={`text-[11px] font-semibold ${arti ? "text-emerald-600" : "text-red-500"}`}>
      {arti ? "↑" : "↓"} %{Math.abs(d)}
    </span>
  );
}

/** GSC günlük tıklama (mavi) + gösterim (gri) çizgisi; harici kütüphane yok. */
function ZamanSerisi({ veri }: { veri: { tarih: string; clicks: number; impressions: number }[] }) {
  if (veri.length < 2) return null;
  const en = 640;
  const boy = 120;
  const cizgi = (secim: (d: { clicks: number; impressions: number }) => number) => {
    const maks = Math.max(...veri.map(secim), 1);
    return veri
      .map((v, i) => `${((i / (veri.length - 1)) * en).toFixed(1)},${(boy - (secim(v) / maks) * (boy - 8) - 4).toFixed(1)}`)
      .join(" ");
  };
  return (
    <div className="rounded-[12px] border border-ink/11 bg-white p-4">
      <div className="mb-2 flex items-center gap-4 text-[11.5px]">
        <span className="text-[#6B7080]">Son 28 gün · günlük</span>
        <span className="flex items-center gap-1.5 text-[#6B7080]">
          <span className="inline-block h-2 w-2 rounded-full bg-brand" /> tıklama
        </span>
        <span className="flex items-center gap-1.5 text-[#9aa0ae]">
          <span className="inline-block h-2 w-2 rounded-full bg-[#c2c7d0]" /> gösterim
        </span>
      </div>
      <svg viewBox={`0 0 ${en} ${boy}`} className="w-full" preserveAspectRatio="none" role="img" aria-label="Günlük tıklama ve gösterim">
        <polyline points={cizgi((d) => d.impressions)} fill="none" stroke="#c2c7d0" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        <polyline points={cizgi((d) => d.clicks)} fill="none" stroke="var(--color-brand)" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

function OzetSatiri({ metrik }: { metrik: { d7: SeoOlcu; d28: SeoOlcu; d90: SeoOlcu; o28: SeoOlcu } }) {
  const { d7, d28, d90, o28 } = metrik;
  const rows = [
    { ad: "Google tıklama", s7: sy.format(d7.clicks), s28: sy.format(d28.clicks), s90: sy.format(d90.clicks), delta: <DeltaClicks cur={d28.clicks} prev={o28.clicks} /> },
    { ad: "Gösterim", s7: sy.format(d7.impressions), s28: sy.format(d28.impressions), s90: sy.format(d90.impressions), delta: <DeltaClicks cur={d28.impressions} prev={o28.impressions} /> },
    { ad: "CTR", s7: yuzde(d7.ctr), s28: yuzde(d28.ctr), s90: yuzde(d90.ctr), delta: <span className="text-[11px] text-[#9aa0ae]">—</span> },
    { ad: "Ort. pozisyon", s7: pozFmt(d7.position), s28: pozFmt(d28.position), s90: pozFmt(d90.position), delta: <span className="text-[11px] text-[#9aa0ae]">—</span> },
  ];
  return (
    <div className="overflow-hidden rounded-[12px] border border-ink/11 bg-white">
      <div className="grid grid-cols-[minmax(120px,1.6fr)_1fr_1fr_1fr_1fr] gap-2 border-b border-ink/10 bg-mist px-4 py-2.5 text-[10.5px] font-bold tracking-[0.06em] text-[#9aa0ae] uppercase">
        <span>Metrik</span>
        <span className="text-right">7 gün</span>
        <span className="text-right">28 gün</span>
        <span className="text-right">90 gün</span>
        <span className="text-right">Δ 28g</span>
      </div>
      {rows.map((r) => (
        <div key={r.ad} className="grid grid-cols-[minmax(120px,1.6fr)_1fr_1fr_1fr_1fr] items-center gap-2 border-b border-ink/[0.06] px-4 py-2.5 last:border-0">
          <span className="text-[13px] font-medium text-ink">{r.ad}</span>
          <span className="text-right font-mono text-[13px] text-[#334155]">{r.s7}</span>
          <span className="text-right font-mono text-[13.5px] font-semibold text-ink">{r.s28}</span>
          <span className="text-right font-mono text-[13px] text-[#334155]">{r.s90}</span>
          <span className="text-right">{r.delta}</span>
        </div>
      ))}
    </div>
  );
}

function SorguSatiri({ s }: { s: { sorgu: string; clicks: number; impressions: number; ctr: number; position: number } }) {
  return (
    <div className="grid grid-cols-[minmax(140px,2.4fr)_70px_84px_64px_64px] items-center gap-2 border-b border-ink/[0.06] px-4 py-2.5 last:border-0">
      <span className="truncate text-[13px] text-ink" title={s.sorgu}>{s.sorgu}</span>
      <span className="text-right font-mono text-[13px] font-semibold text-ink">{sy.format(s.clicks)}</span>
      <span className="text-right font-mono text-[13px] text-[#334155]">{sy.format(s.impressions)}</span>
      <span className="text-right font-mono text-[12.5px] text-[#334155]">{yuzde(s.ctr)}</span>
      <span className="text-right font-mono text-[12.5px] text-[#334155]">{s.position.toFixed(1)}</span>
    </div>
  );
}

function SorguListesi({ sorgular }: { sorgular: { sorgu: string; clicks: number; impressions: number; ctr: number; position: number }[] }) {
  const ilk = sorgular.slice(0, SORGU_ILK);
  const kalan = sorgular.slice(SORGU_ILK);
  return (
    <div>
      <div className="grid grid-cols-[minmax(140px,2.4fr)_70px_84px_64px_64px] gap-2 border-b border-ink/10 bg-mist px-4 py-2 text-[10.5px] font-bold tracking-[0.06em] text-[#9aa0ae] uppercase">
        <span>Sorgu</span>
        <span className="text-right">Tık</span>
        <span className="text-right">Gösterim</span>
        <span className="text-right">CTR</span>
        <span className="text-right">Poz.</span>
      </div>
      {ilk.map((s) => (
        <SorguSatiri key={s.sorgu} s={s} />
      ))}
      {kalan.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer list-none px-4 py-2.5 text-center text-[12.5px] font-semibold text-brand hover:bg-mist">
            <span className="group-open:hidden">Tümünü göster ({kalan.length} sorgu daha)</span>
            <span className="hidden group-open:inline">Daralt</span>
          </summary>
          {kalan.map((s) => (
            <SorguSatiri key={s.sorgu} s={s} />
          ))}
        </details>
      )}
    </div>
  );
}

function Grup({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-[13px] font-semibold tracking-[0.02em] text-[#5C6273] uppercase">{baslik}</h3>
      {children}
    </div>
  );
}

export function SeoSayfaDetay({
  yol,
  baslik,
  tur,
  gsc,
  gscHata,
  ga4,
  ga4Hata,
}: {
  yol: string;
  baslik: string;
  tur: SayfaTuru;
  gsc: SeoSayfaDetaySonuc;
  gscHata: boolean;
  ga4: Ga4SayfaOzet;
  ga4Hata: boolean;
}) {
  return (
    <div className="mt-3 flex flex-col gap-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate font-heading text-[22px] leading-[1.1] font-semibold tracking-[-0.02em] sm:text-[26px]">
            {baslik}
          </h1>
          <div className="mt-1 flex items-center gap-2 font-mono text-[12px] text-[#9aa0ae]">
            <span className="rounded-[6px] border border-ink/12 bg-ink/[0.04] px-2 py-0.5 text-[11px] font-semibold text-[#5C6273]">
              {TUR_ETIKET[tur]}
            </span>
            <span className="truncate">{yol}</span>
          </div>
        </div>
        <Link href={yol} target="_blank" className="flex-none rounded-[8px] border border-ink/13 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#475569] hover:border-brand hover:text-brand">
          Sayfayı gör
        </Link>
      </div>

      {/* SEO Performansı — Search Console */}
      <Grup baslik="SEO Performansı · Search Console">
        {gscHata ? (
          <div className="rounded-[12px] border border-amber-200 bg-amber-50 p-5 text-[13.5px] text-amber-800">
            Search Console verisi şu anda alınamadı. Birazdan tekrar deneyin.
          </div>
        ) : !gsc.yapilandirildi ? (
          <div className="rounded-[12px] border border-ink/12 bg-mist p-5 text-[13.5px] text-[#5C6273]">
            Search Console bağlı değil. Sistem tanılama → Google Search Console bölümünden bağlayın.
          </div>
        ) : gsc.metrik.d90.impressions === 0 ? (
          <div className="rounded-[12px] border border-ink/12 bg-mist p-5 text-[13.5px] text-[#5C6273]">
            Bu sayfa için henüz Search Console verisi yok.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Kutu ust="Google tıklama (28g)" deger={sy.format(gsc.metrik.d28.clicks)} alt={gsc.metrik.o28.clicks > 0 ? `önceki: ${sy.format(gsc.metrik.o28.clicks)}` : "önceki dönem —"} />
              <Kutu ust="Gösterim (28g)" deger={sy.format(gsc.metrik.d28.impressions)} />
              <Kutu ust="CTR (28g)" deger={gsc.metrik.d28.impressions > 0 ? yuzde(gsc.metrik.d28.ctr) : "—"} alt="tıklama / gösterim" />
              <Kutu ust="Ort. pozisyon (28g)" deger={pozFmt(gsc.metrik.d28.position)} alt="düşük = daha iyi" />
            </div>
            {gsc.metrik.gunluk.length >= 2 && <ZamanSerisi veri={gsc.metrik.gunluk} />}
            <OzetSatiri metrik={gsc.metrik} />
            <div className="overflow-hidden rounded-[12px] border border-ink/11 bg-white">
              <div className="border-b border-ink/10 px-4 py-3">
                <h4 className="text-[13.5px] font-semibold text-ink">En çok trafik getiren sorgular</h4>
                <p className="mt-0.5 text-[11.5px] text-[#9aa0ae]">Son 90 gün · tıklamaya göre sıralı</p>
              </div>
              {gsc.metrik.sorgular.length === 0 ? (
                <div className="px-4 py-6 text-center text-[13px] text-[#9aa0ae]">Kayıtlı sorgu yok.</div>
              ) : (
                <SorguListesi sorgular={gsc.metrik.sorgular} />
              )}
            </div>
          </div>
        )}
      </Grup>

      {/* Trafik / Dönüşüm — GA4 */}
      <Grup baslik="Organik Trafik / Dönüşüm · GA4">
        {ga4Hata ? (
          <div className="rounded-[12px] border border-amber-200 bg-amber-50 p-5 text-[13.5px] text-amber-800">
            GA4 verisi şu anda alınamadı. Birazdan tekrar deneyin.
          </div>
        ) : !ga4.yapilandirildi ? (
          <div className="rounded-[12px] border border-ink/12 bg-mist p-5 text-[13.5px] text-[#5C6273]">
            GA4 bağlı değil; organik trafik ve dönüşüm gösterilemiyor.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Kutu ust="Organik ziyaret" deger={sy.format(ga4.organik)} alt="GA4 · Organic Search" />
              <Kutu ust="WhatsApp teması" deger={ga4.olaylar.whatsapp_iletisim != null ? sy.format(ga4.olaylar.whatsapp_iletisim) : "—"} alt="dönüşüm olayı" />
              <Kutu ust="CTA tıklaması" deger={ga4.olaylar.blog_cta_click != null ? sy.format(ga4.olaylar.blog_cta_click) : "—"} alt="dönüşüm olayı" />
              <Kutu ust="Toplam dönüşüm" deger={sy.format(Object.values(ga4.olaylar).reduce((a, b) => a + b, 0))} alt="izlenen olaylar" />
            </div>
            {ga4.organik === 0 && (
              <div className="rounded-[10px] border border-ink/12 bg-mist px-4 py-3 text-[13px] text-[#5C6273]">
                Bu sayfada seçili dönemde organik ziyaret kaydı yok.
              </div>
            )}
          </div>
        )}
      </Grup>
    </div>
  );
}
