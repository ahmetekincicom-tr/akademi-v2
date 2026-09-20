import type { DetaySonuc } from "@/lib/google/ga4-rapor";
import type { GscDetaySonuc, GscOlcu } from "@/lib/google/gsc-rapor";
import { yuzdeDegisim } from "@/lib/google/gsc-yardimci";
import { PerformansYenile } from "@/components/admin/PerformansYenile";

/**
 * Yazı Performans sekmesi.
 *
 * İki ayrı kaynak, iki ayrı bölüm:
 *  - Trafik / Davranış / Dönüşüm → GA4 (Faz 1, mantığı değişmedi).
 *  - SEO Performansı + sorgular → Search Console (Faz 2).
 * CMS'ten bağımsız: veri gelmezse editör/yayınlama etkilenmez; her bölüm kendi
 * empty/error state'ini gösterir ve biri yokken diğeri görünür.
 */

const sy = new Intl.NumberFormat("tr-TR");
const yuzdeFmt = (oran: number) => `%${(oran * 100).toFixed(1)}`;
const pozFmt = (p: number) => (p > 0 ? p.toFixed(1) : "—");

function Kutu({ ust, deger, alt }: { ust: string; deger: string; alt?: string }) {
  return (
    <div className="rounded-[12px] border border-ink/11 bg-white p-4">
      <div className="text-[12px] text-[#6B7080]">{ust}</div>
      <div className="mt-1 text-[22px] font-semibold text-ink">{deger}</div>
      {alt && <div className="mt-0.5 text-[11.5px] text-[#9aa0ae]">{alt}</div>}
    </div>
  );
}

function Grup({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-[13px] font-semibold tracking-[0.02em] text-[#5C6273] uppercase">{baslik}</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{children}</div>
    </div>
  );
}

/** Küçük SVG sparkline (harici chart kütüphanesi yok). */
function Sparkline({ veri }: { veri: { tarih: string; views: number }[] }) {
  if (veri.length < 2) return null;
  const en = 320;
  const boy = 48;
  const maks = Math.max(...veri.map((v) => v.views), 1);
  const nokta = veri
    .map((v, i) => {
      const x = (i / (veri.length - 1)) * en;
      const y = boy - (v.views / maks) * (boy - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <div className="rounded-[12px] border border-ink/11 bg-white p-4">
      <div className="mb-2 text-[12px] text-[#6B7080]">Son 30 gün · günlük görüntülenme</div>
      <svg viewBox={`0 0 ${en} ${boy}`} className="w-full" preserveAspectRatio="none" role="img" aria-label="Günlük görüntülenme grafiği">
        <polyline points={nokta} fill="none" stroke="var(--color-brand)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

/* --------------------------------------------------------------- GA4 --- */

function Ga4Bolum({ sonuc, hata }: { sonuc: DetaySonuc | null; hata?: boolean }) {
  if (hata) {
    return (
      <div className="rounded-[12px] border border-amber-200 bg-amber-50 p-5 text-[14px] text-amber-800">
        GA4 performans verileri şu anda alınamadı. Yazı düzenleme ve yayınlama bundan etkilenmez; birazdan tekrar deneyin.
        <div className="mt-3">
          <PerformansYenile />
        </div>
      </div>
    );
  }

  if (!sonuc || sonuc.yapilandirildi === false) {
    return (
      <div className="rounded-[12px] border border-ink/12 bg-mist p-5 text-[13.5px] leading-[1.6] text-[#5C6273]">
        <p className="font-semibold text-ink">Trafik verisi için GA4 Data API bağlantısı gerekli.</p>
        <p className="mt-1.5">
          Bir Google Cloud servis hesabı oluşturup GA4 mülküne “Görüntüleyici” olarak ekleyin; anahtarı sunucuda
          <code className="mx-1">GA4_PROPERTY_ID</code>,<code className="mx-1">GA4_SA_CLIENT_EMAIL</code>,
          <code className="ml-1">GA4_SA_PRIVATE_KEY</code> ortam değişkenlerine koyun. Olay ölçümü (blog_view, scroll,
          CTA…) bağlantıdan bağımsız zaten çalışıyor; yalnız bu ekrandaki raporlama bekliyor.
        </p>
      </div>
    );
  }

  const m = sonuc.metrik;
  const yeterli = m.views30 > 0;
  const o = m.olaylar;
  const cta = o.blog_cta_click ?? 0;
  const ctr = m.views30 > 0 ? (cta / m.views30) * 100 : 0;
  const yonRenk = m.degisim == null ? "text-[#9aa0ae]" : m.degisim >= 0 ? "text-emerald-600" : "text-red-500";
  const yon = m.degisim == null ? "" : m.degisim >= 0 ? "↑" : "↓";
  const dk = (sn: number) => (sn >= 60 ? `${Math.floor(sn / 60)}dk ${sn % 60}sn` : `${sn}sn`);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[#5C6273]">Trafik / Davranış · GA4 · 30 dakikada bir yenilenir</p>
        <PerformansYenile />
      </div>

      {!yeterli && (
        <div className="rounded-[10px] border border-ink/12 bg-mist px-4 py-3 text-[13px] text-[#5C6273]">
          Henüz yeterli veri yok. Yazı trafik almaya başladığında metrikler burada dolacak.
        </div>
      )}

      <Grup baslik="Trafik">
        <Kutu ust="Son 7 gün" deger={sy.format(m.views7)} />
        <Kutu
          ust="Son 30 gün"
          deger={sy.format(m.views30)}
          alt={yeterli && m.degisim != null ? `${yon} %${Math.abs(m.degisim)} önceki 30 güne göre` : "önceki döneme göre —"}
        />
        <Kutu ust="Son 90 gün" deger={sy.format(m.views90)} />
        <Kutu ust="Aktif kullanıcı (30g)" deger={sy.format(m.users30)} alt={`ort. etkileşim ${dk(m.ortEngagementSn)}`} />
      </Grup>

      {yeterli && m.degisim != null && (
        <div className="flex items-baseline gap-2 rounded-[12px] border border-ink/11 bg-white p-4">
          <span className="text-[28px] font-semibold text-ink">{sy.format(m.views30)}</span>
          <span className={`text-[14px] font-medium ${yonRenk}`}>
            {yon} %{Math.abs(m.degisim)} <span className="text-[#9aa0ae]">önceki 30 güne göre</span>
          </span>
        </div>
      )}

      <Grup baslik="Davranış">
        <Kutu ust="%25 scroll" deger={sy.format(o.blog_scroll_25 ?? 0)} />
        <Kutu ust="%50 scroll" deger={sy.format(o.blog_scroll_50 ?? 0)} />
        <Kutu ust="%75 scroll" deger={sy.format(o.blog_scroll_75 ?? 0)} />
        <Kutu ust="Tamamlanma" deger={sy.format(o.blog_complete ?? 0)} />
      </Grup>

      <Grup baslik="Dönüşüm">
        <Kutu ust="CTA tıklaması" deger={sy.format(cta)} />
        <Kutu ust="CTA oranı (CTR)" deger={yeterli ? `%${ctr.toFixed(2)}` : "—"} alt="CTA / görüntülenme" />
        <Kutu ust="Prompt kopyalama" deger={sy.format(o.blog_prompt_copy ?? 0)} />
        <Kutu ust="Benzer yazı tıklaması" deger={sy.format(o.blog_related_post_click ?? 0)} />
      </Grup>

      {m.gunluk.length >= 2 && <Sparkline veri={m.gunluk} />}
    </div>
  );
}

/* ------------------------------------------------- Search Console (SEO) --- */

/** Tıklama/gösterim için % değişim rozeti (artış iyi). */
function DeltaClicks({ cur, prev }: { cur: number; prev: number }) {
  const d = yuzdeDegisim(cur, prev);
  if (d == null) return <span className="text-[11px] text-[#9aa0ae]">—</span>;
  const arti = d >= 0;
  return (
    <span className={`text-[11px] font-semibold ${arti ? "text-emerald-600" : "text-red-500"}`}>
      {arti ? "↑" : "↓"} %{Math.abs(d)}
    </span>
  );
}

/** Pozisyon değişim rozeti (DÜŞÜK pozisyon iyidir → yükseliş yeşil). */
function DeltaPoz({ cur, prev }: { cur: number; prev: number }) {
  if (!cur || !prev) return <span className="text-[11px] text-[#9aa0ae]">—</span>;
  const fark = prev - cur; // pozitif = yukarı çıktı (iyi)
  if (Math.abs(fark) < 0.05) return <span className="text-[11px] text-[#9aa0ae]">≈</span>;
  const iyi = fark > 0;
  return (
    <span className={`text-[11px] font-semibold ${iyi ? "text-emerald-600" : "text-red-500"}`}>
      {iyi ? "↑" : "↓"} {Math.abs(fark).toFixed(1)}
    </span>
  );
}

function SeoOlcuTablosu({ metrik }: { metrik: { d7: GscOlcu; d30: GscOlcu; d90: GscOlcu; o30: GscOlcu } }) {
  const { d7, d30, d90, o30 } = metrik;
  const satirlar: { ad: string; s7: string; s30: string; s90: string; delta: React.ReactNode }[] = [
    {
      ad: "Google tıklama",
      s7: sy.format(d7.clicks),
      s30: sy.format(d30.clicks),
      s90: sy.format(d90.clicks),
      delta: <DeltaClicks cur={d30.clicks} prev={o30.clicks} />,
    },
    {
      ad: "Gösterim",
      s7: sy.format(d7.impressions),
      s30: sy.format(d30.impressions),
      s90: sy.format(d90.impressions),
      delta: <DeltaClicks cur={d30.impressions} prev={o30.impressions} />,
    },
    {
      ad: "CTR",
      s7: yuzdeFmt(d7.ctr),
      s30: yuzdeFmt(d30.ctr),
      s90: yuzdeFmt(d90.ctr),
      delta: <span className="text-[11px] text-[#9aa0ae]">—</span>,
    },
    {
      ad: "Ort. pozisyon",
      s7: pozFmt(d7.position),
      s30: pozFmt(d30.position),
      s90: pozFmt(d90.position),
      delta: <DeltaPoz cur={d30.position} prev={o30.position} />,
    },
  ];
  return (
    <div className="overflow-hidden rounded-[12px] border border-ink/11 bg-white">
      <div className="grid grid-cols-[minmax(120px,1.6fr)_1fr_1fr_1fr_1fr] gap-2 border-b border-ink/10 bg-mist px-4 py-2.5 text-[10.5px] font-bold tracking-[0.06em] text-[#9aa0ae] uppercase">
        <span>Metrik</span>
        <span className="text-right">7 gün</span>
        <span className="text-right">30 gün</span>
        <span className="text-right">90 gün</span>
        <span className="text-right">Δ 30g</span>
      </div>
      {satirlar.map((s) => (
        <div
          key={s.ad}
          className="grid grid-cols-[minmax(120px,1.6fr)_1fr_1fr_1fr_1fr] items-center gap-2 border-b border-ink/[0.06] px-4 py-2.5 last:border-0"
        >
          <span className="text-[13px] font-medium text-ink">{s.ad}</span>
          <span className="text-right font-mono text-[13px] text-[#334155]">{s.s7}</span>
          <span className="text-right font-mono text-[13.5px] font-semibold text-ink">{s.s30}</span>
          <span className="text-right font-mono text-[13px] text-[#334155]">{s.s90}</span>
          <span className="text-right">{s.delta}</span>
        </div>
      ))}
    </div>
  );
}

const SORGU_ILK = 15;

function SeoBolum({ sonuc, hata }: { sonuc: GscDetaySonuc | null; hata?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-[13px] font-semibold tracking-[0.02em] text-[#5C6273] uppercase">
          SEO Performansı · Search Console
        </h3>
        <p className="mt-1 text-[12px] text-[#9aa0ae]">
          Google aramadaki performans. Search Console verisi 2-3 gün gecikmeli olabilir; gerçek zamanlı değildir.
        </p>
      </div>

      {hata ? (
        <div className="rounded-[12px] border border-amber-200 bg-amber-50 p-5 text-[13.5px] text-amber-800">
          Search Console verisi şu anda alınamadı. Yazı düzenleme/yayınlama bundan etkilenmez; birazdan tekrar deneyin.
        </div>
      ) : !sonuc || sonuc.yapilandirildi === false ? (
        <div className="rounded-[12px] border border-ink/12 bg-mist p-5 text-[13.5px] leading-[1.6] text-[#5C6273]">
          <p className="font-semibold text-ink">SEO verisi için Search Console bağlantısı gerekli.</p>
          <p className="mt-1.5">
            GA4 ile aynı servis hesabını Search Console property’sine kullanıcı olarak ekleyin ve sunucuda
            <code className="mx-1">GSC_SITE_URL</code> ortam değişkenini tanımlayın (kimlik bilgileri GA4 ile ortak:
            <code className="mx-1">GA4_SA_CLIENT_EMAIL</code>,<code className="ml-1">GA4_SA_PRIVATE_KEY</code>).
          </p>
        </div>
      ) : (
        (() => {
          const m = sonuc.metrik;
          const veriVar = m.d90.impressions > 0;
          return (
            <>
              <Grup baslik="Özet (son 30 gün)">
                <Kutu
                  ust="Google tıklama"
                  deger={sy.format(m.d30.clicks)}
                  alt={m.o30.clicks > 0 ? `önceki 30g: ${sy.format(m.o30.clicks)}` : "önceki döneme göre —"}
                />
                <Kutu ust="Gösterim" deger={sy.format(m.d30.impressions)} alt={`son 7g: ${sy.format(m.d7.impressions)}`} />
                <Kutu ust="CTR" deger={m.d30.impressions > 0 ? yuzdeFmt(m.d30.ctr) : "—"} alt="tıklama / gösterim" />
                <Kutu ust="Ort. pozisyon" deger={pozFmt(m.d30.position)} alt="düşük = daha iyi" />
              </Grup>

              {!veriVar ? (
                <div className="rounded-[10px] border border-ink/12 bg-mist px-4 py-3 text-[13px] text-[#5C6273]">
                  Bu yazı için henüz Search Console verisi yok. Sayfa Google’da görünmeye başlayınca dolar (yeni
                  yazılarda birkaç gün/hafta sürebilir).
                </div>
              ) : (
                <>
                  <SeoOlcuTablosu metrik={m} />

                  {/* Sorgu tablosu */}
                  <div className="overflow-hidden rounded-[12px] border border-ink/11 bg-white">
                    <div className="border-b border-ink/10 px-4 py-3">
                      <h4 className="text-[13.5px] font-semibold text-ink">Google’da hangi sorgulardan trafik geliyor?</h4>
                      <p className="mt-0.5 text-[11.5px] text-[#9aa0ae]">Son 90 gün · tıklamaya göre sıralı</p>
                    </div>
                    {m.sorgular.length === 0 ? (
                      <div className="px-4 py-6 text-center text-[13px] text-[#9aa0ae]">Kayıtlı sorgu yok.</div>
                    ) : (
                      <SorguListesi sorgular={m.sorgular} />
                    )}
                  </div>
                </>
              )}
            </>
          );
        })()
      )}
    </div>
  );
}

function SorguSatiri({
  s,
}: {
  s: { sorgu: string; clicks: number; impressions: number; ctr: number; position: number };
}) {
  return (
    <div className="grid grid-cols-[minmax(140px,2.4fr)_70px_84px_64px_64px] items-center gap-2 border-b border-ink/[0.06] px-4 py-2.5 last:border-0">
      <span className="truncate text-[13px] text-ink" title={s.sorgu}>
        {s.sorgu}
      </span>
      <span className="text-right font-mono text-[13px] font-semibold text-ink">{sy.format(s.clicks)}</span>
      <span className="text-right font-mono text-[13px] text-[#334155]">{sy.format(s.impressions)}</span>
      <span className="text-right font-mono text-[12.5px] text-[#334155]">{yuzdeFmt(s.ctr)}</span>
      <span className="text-right font-mono text-[12.5px] text-[#334155]">{s.position.toFixed(1)}</span>
    </div>
  );
}

/** İlk N sorgu her zaman görünür; kalanı <details> ile genişletilebilir (client JS yok). */
function SorguListesi({
  sorgular,
}: {
  sorgular: { sorgu: string; clicks: number; impressions: number; ctr: number; position: number }[];
}) {
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

/* --------------------------------------------------------------- kök --- */

export function BlogPerformans({
  sonuc,
  hata,
  gscSonuc,
  gscHata,
}: {
  sonuc: DetaySonuc | null;
  hata?: boolean;
  gscSonuc?: GscDetaySonuc | null;
  gscHata?: boolean;
}) {
  return (
    <div className="flex flex-col gap-8">
      <Ga4Bolum sonuc={sonuc} hata={hata} />
      <div className="h-px bg-ink/8" />
      <SeoBolum sonuc={gscSonuc ?? null} hata={gscHata} />
    </div>
  );
}
