import Link from "next/link";
import { StatusBadge } from "@/lib/admin/shared";
import { PerformansYenile } from "@/components/admin/PerformansYenile";
import type { PanelYazi } from "@/lib/yazilar";
import type { PanelSonuc, PanelSatir, PanelAralik } from "@/lib/google/ga4-rapor";

/**
 * Blog performans paneli (admin).
 *
 * Tasarım referansındaki performans-odaklı düzeni (KPI kartları + yoğun tablo +
 * 7/30/90 filtresi + mini trend) projenin design token/component sistemiyle
 * uyarladık: marka/ink renkleri, --font-mono sayılar, mevcut StatusBadge,
 * rounded/border ölçüleri. Yalnız GERÇEK veri: görüntülenme/değişim/süre/CVR/
 * trend GA4'ten, SEO tamlığı Supabase'ten; kaynağı olmayan hücre "—".
 *
 * Blog CRUD (Yeni yazı, Kategoriler, Gör, Düzenle) mevcut rotalara dokunmuyor.
 */

const sy = new Intl.NumberFormat("tr-TR");
const T = { day: "numeric", month: "short", year: "numeric" } as const;
function kisaTarih(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : new Intl.DateTimeFormat("tr-TR", T).format(d);
}
function sure(sn: number): string {
  if (!sn) return "—";
  return sn >= 60 ? `${Math.floor(sn / 60)}dk ${sn % 60}sn` : `${sn}sn`;
}
function bashHarf(baslik: string): string {
  const p = baslik.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "?";
}

function Delta({ d }: { d: number | null }) {
  if (d == null) return <span className="text-[10.5px] text-[#9aa0ae]">—</span>;
  const arti = d >= 0;
  return (
    <span className={`text-[10.5px] font-bold ${arti ? "text-emerald-600" : "text-red-500"}`}>
      {arti ? "↑" : "↓"} %{Math.abs(d)}
    </span>
  );
}

/** Küçük SVG sparkline (harici chart lib yok). */
function Mini({ veri }: { veri: number[] }) {
  if (!veri || veri.length < 2 || veri.every((v) => v === 0)) {
    return <span className="text-[11px] text-[#c2c7d0]">—</span>;
  }
  const en = 104;
  const boy = 28;
  const maks = Math.max(...veri, 1);
  const nokta = veri
    .map((v, i) => `${((i / (veri.length - 1)) * en).toFixed(1)},${(boy - (v / maks) * (boy - 3) - 1.5).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${en} ${boy}`} width={en} height={boy} preserveAspectRatio="none" aria-hidden>
      <polyline points={nokta} fill="none" stroke="var(--color-brand)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function SeoRozet({ tam }: { tam: boolean }) {
  return tam ? (
    <span className="inline-block rounded-[6px] border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
      Tam
    </span>
  ) : (
    <span className="inline-block rounded-[6px] border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
      Eksik
    </span>
  );
}

const ARALIKLAR: PanelAralik[] = [7, 30, 90];

export function BlogPanel({
  yazilar,
  metrik,
  gun,
  guncelSaat,
}: {
  yazilar: PanelYazi[];
  metrik: PanelSonuc;
  gun: PanelAralik;
  guncelSaat: string;
}) {
  const yapili = metrik.yapilandirildi;
  const satirlar = yapili ? metrik.satir : null;
  const ozet = yapili ? metrik.ozet : null;
  const yayindaSayi = yazilar.filter((y) => y.durum === "yayin").length;

  // Görüntülenmeye göre sırala (verisi olan yazılar üste); veri yoksa mevcut sıra.
  const sirali = [...yazilar].sort((a, b) => (satirlar?.get(b.slug)?.views ?? -1) - (satirlar?.get(a.slug)?.views ?? -1));

  const m = (slug: string): PanelSatir | undefined => satirlar?.get(slug);

  const kpis: { etiket: string; deger: string; delta: number | null; not: string }[] = ozet
    ? [
        { etiket: "Toplam görüntülenme", deger: sy.format(ozet.toplamViews), delta: ozet.degisim, not: `son ${gun} gün` },
        { etiket: "Ort. etkileşim süresi", deger: sure(ozet.ortEngagementSn), delta: null, not: "kullanıcı başına" },
        { etiket: "CTA tıklaması", deger: sy.format(ozet.toplamCta), delta: null, not: "eğitim CTA'ları" },
        { etiket: "CTA dönüşümü", deger: ozet.cvr != null ? `%${ozet.cvr.toFixed(2)}` : "—", delta: null, not: "CTA / görüntülenme" },
        { etiket: "Tamamlanma", deger: ozet.tamamlanmaOrani != null ? `%${Math.round(ozet.tamamlanmaOrani)}` : "—", delta: null, not: "yazıyı bitirenler" },
      ]
    : [];

  return (
    <main className="p-4 pb-14 sm:p-7">
      {/* Başlık + filtre + eylemler */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-[24px] leading-[1.1] font-extrabold tracking-[-0.02em] sm:text-[27px]">
            Blog performansı
          </h1>
          <p className="mt-[6px] text-[13px] text-[#64748b]">
            {yayindaSayi} yayında yazı · son {gun} günün organik verileri · güncelleme {guncelSaat}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-[9px] border border-ink/12 bg-white p-[3px]">
            {ARALIKLAR.map((a) => (
              <Link
                key={a}
                href={`/kontrol-9f4x2k/blog?gun=${a}`}
                className={`rounded-[7px] px-[11px] py-[6px] text-[13px] font-semibold transition ${
                  a === gun ? "bg-ink text-white" : "text-[#5C6273] hover:text-ink"
                }`}
              >
                {a} gün
              </Link>
            ))}
          </div>
          <PerformansYenile />
          <Link
            href="/kontrol-9f4x2k/blog/kategoriler"
            className="flex h-[38px] items-center rounded-[9px] border border-ink/13 bg-white px-[14px] text-[13px] font-semibold text-[#5C6273] hover:border-brand hover:text-brand"
          >
            Kategoriler
          </Link>
          <Link
            href="/kontrol-9f4x2k/blog/yeni"
            className="flex h-[38px] items-center rounded-[9px] bg-brand px-[16px] text-[13px] font-semibold text-white hover:bg-ink"
          >
            + Yeni yazı
          </Link>
        </div>
      </div>

      {!yapili && (
        <div className="mt-5 rounded-[12px] border border-ink/12 bg-mist px-4 py-3 text-[13px] text-[#5C6273]">
          GA4 Data API bağlı değil; görüntülenme/dönüşüm metrikleri “—” gösteriliyor. Bağlamak için sunucuda
          <code className="mx-1">GA4_PROPERTY_ID</code>,<code className="mx-1">GA4_SA_CLIENT_EMAIL</code>,
          <code className="ml-1">GA4_SA_PRIVATE_KEY</code> tanımlayın. Olay ölçümü bağlantıdan bağımsız çalışıyor.
        </div>
      )}

      {/* KPI kartları */}
      {yapili && (
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {kpis.map((k) => (
            <div key={k.etiket} className="rounded-[12px] border border-ink/11 bg-white p-4">
              <div className="text-[11px] font-bold tracking-[0.07em] text-[#9aa0ae] uppercase">{k.etiket}</div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="font-mono text-[22px] font-extrabold tracking-[-0.02em] text-ink">{k.deger}</span>
                <Delta d={k.delta} />
              </div>
              <div className="mt-0.5 text-[11.5px] text-[#9aa0ae]">{k.not}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tablo (sm+) */}
      <div className="mt-5 hidden overflow-hidden rounded-[14px] border border-ink/11 bg-white sm:block">
        <div className="overflow-x-auto">
          <div className="min-w-[880px]">
            <div className="grid grid-cols-[minmax(200px,2.4fr)_104px_96px_88px_78px_104px_124px] gap-3 border-b border-ink/10 bg-mist px-4 py-2.5 text-[10.5px] font-bold tracking-[0.08em] text-[#9aa0ae] uppercase">
              <span>Yazı</span>
              <span className="text-right">Görüntülenme</span>
              <span className="text-right">Ort. süre</span>
              <span className="text-right">Dönüşüm</span>
              <span className="text-right">SEO</span>
              <span>30 gün trendi</span>
              <span className="text-right">İşlem</span>
            </div>
            {sirali.map((y) => {
              const d = m(y.slug);
              const veriVar = Boolean(d && d.views > 0);
              return (
                <div
                  key={y.id}
                  className="grid grid-cols-[minmax(200px,2.4fr)_104px_96px_88px_78px_104px_124px] items-center gap-3 border-b border-ink/[0.06] px-4 py-3 last:border-0 hover:bg-mist/60"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {y.kapak ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={y.kapak} alt="" className="h-9 w-9 flex-none rounded-[9px] object-cover" />
                    ) : (
                      <div className="grid h-9 w-9 flex-none place-items-center rounded-[9px] bg-brand/[0.08] font-mono text-[12px] font-bold text-brand">
                        {bashHarf(y.baslik)}
                      </div>
                    )}
                    <div className="flex min-w-0 flex-col gap-[3px]">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-[13.5px] font-bold tracking-[-0.01em]">{y.baslik}</span>
                        <StatusBadge durum={y.durum === "yayin" ? "Yayında" : "Taslak"} />
                      </div>
                      <span className="truncate font-mono text-[11px] text-[#9aa0ae]">
                        /{y.slug} · {kisaTarih(y.durum === "yayin" ? y.yayinTarihi : y.guncelleme)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 text-right">
                    <span className="font-mono text-[13.5px] font-semibold">{veriVar ? sy.format(d!.views) : "—"}</span>
                    {veriVar && <Delta d={d!.degisim} />}
                  </div>
                  <span className="text-right font-mono text-[13px] text-[#334155]">{veriVar ? sure(d!.ortEngagementSn) : "—"}</span>
                  <span className="text-right font-mono text-[13px] text-[#334155]">
                    {veriVar && d!.cvr != null ? `%${d!.cvr.toFixed(2)}` : "—"}
                  </span>
                  <div className="flex justify-end">
                    <SeoRozet tam={y.seoTam} />
                  </div>
                  <div className="flex items-center">{veriVar ? <Mini veri={d!.gunluk} /> : <span className="text-[11px] text-[#c2c7d0]">—</span>}</div>
                  <div className="flex justify-end gap-1.5">
                    {y.durum === "yayin" && (
                      <Link
                        href={`/${y.slug}`}
                        target="_blank"
                        className="rounded-[7px] border border-ink/13 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#475569] hover:border-brand hover:text-brand"
                      >
                        Gör
                      </Link>
                    )}
                    <Link
                      href={`/kontrol-9f4x2k/blog/${y.slug}/duzenle`}
                      className="rounded-[7px] border border-brand/25 bg-brand/[0.06] px-2.5 py-1.5 text-[12px] font-semibold text-brand hover:bg-brand hover:text-white"
                    >
                      Düzenle
                    </Link>
                  </div>
                </div>
              );
            })}
            {sirali.length === 0 && (
              <div className="px-4 py-10 text-center text-[13px] text-[#9aa0ae]">Henüz yazı yok.</div>
            )}
          </div>
        </div>
      </div>

      {/* Mobil kart düzeni (tabloyu zorla küçültmek yerine) */}
      <div className="mt-5 flex flex-col gap-3 sm:hidden">
        {sirali.map((y) => {
          const d = m(y.slug);
          const veriVar = Boolean(d && d.views > 0);
          return (
            <div key={y.id} className="rounded-[13px] border border-ink/11 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[14px] font-bold">{y.baslik}</span>
                    <StatusBadge durum={y.durum === "yayin" ? "Yayında" : "Taslak"} />
                  </div>
                  <div className="mt-1 truncate font-mono text-[11px] text-[#9aa0ae]">
                    /{y.slug} · {kisaTarih(y.durum === "yayin" ? y.yayinTarihi : y.guncelleme)}
                  </div>
                </div>
                <SeoRozet tam={y.seoTam} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 border-t border-ink/[0.07] pt-3">
                <div>
                  <div className="text-[10.5px] text-[#9aa0ae]">Görüntülenme</div>
                  <div className="mt-0.5 flex items-baseline gap-1.5">
                    <span className="font-mono text-[15px] font-semibold">{veriVar ? sy.format(d!.views) : "—"}</span>
                    {veriVar && <Delta d={d!.degisim} />}
                  </div>
                </div>
                <div>
                  <div className="text-[10.5px] text-[#9aa0ae]">Ort. süre</div>
                  <div className="mt-0.5 font-mono text-[15px]">{veriVar ? sure(d!.ortEngagementSn) : "—"}</div>
                </div>
                <div>
                  <div className="text-[10.5px] text-[#9aa0ae]">Dönüşüm</div>
                  <div className="mt-0.5 font-mono text-[15px]">{veriVar && d!.cvr != null ? `%${d!.cvr.toFixed(2)}` : "—"}</div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                {y.durum === "yayin" && (
                  <Link href={`/${y.slug}`} target="_blank" className="flex-1 rounded-[8px] border border-ink/13 bg-white py-2 text-center text-[13px] font-semibold text-[#475569]">
                    Gör
                  </Link>
                )}
                <Link
                  href={`/kontrol-9f4x2k/blog/${y.slug}/duzenle`}
                  className="flex-1 rounded-[8px] border border-brand/25 bg-brand/[0.06] py-2 text-center text-[13px] font-semibold text-brand"
                >
                  Düzenle
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
