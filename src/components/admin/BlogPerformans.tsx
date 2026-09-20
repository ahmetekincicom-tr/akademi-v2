import type { DetaySonuc } from "@/lib/google/ga4-rapor";
import { PerformansYenile } from "@/components/admin/PerformansYenile";

/**
 * Yazı Performans sekmesi (GA4 verileri).
 *
 * Faz 1: Trafik + Davranış + Dönüşüm (GA4). SEO Performansı (Search Console)
 * için ayrı bir bölüm mimaride ayrık duruyor (Faz 2). CMS'ten bağımsız: veri
 * gelmezse editör/yayınlama etkilenmez.
 */

const sy = new Intl.NumberFormat("tr-TR");

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

export function BlogPerformans({ sonuc, hata }: { sonuc: DetaySonuc | null; hata?: boolean }) {
  if (hata) {
    return (
      <div className="rounded-[12px] border border-amber-200 bg-amber-50 p-5 text-[14px] text-amber-800">
        Performans verileri şu anda alınamadı. Yazı düzenleme ve yayınlama bundan etkilenmez; birazdan tekrar deneyin.
        <div className="mt-3">
          <PerformansYenile />
        </div>
      </div>
    );
  }

  if (!sonuc || sonuc.yapilandirildi === false) {
    return (
      <div className="rounded-[12px] border border-ink/12 bg-mist p-5 text-[13.5px] leading-[1.6] text-[#5C6273]">
        <p className="font-semibold text-ink">Performans verisi için GA4 Data API bağlantısı gerekli.</p>
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
        <p className="text-[13px] text-[#5C6273]">GA4 verisi · 30 dakikada bir yenilenir</p>
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

      {/* Faz 2 için ayrık alan — Search Console bağlanınca burası dolacak. */}
      <div className="rounded-[12px] border border-dashed border-ink/15 bg-white/60 p-4 text-[12.5px] text-[#9aa0ae]">
        <span className="font-semibold text-[#6B7080]">SEO Performansı</span> · Google gösterim, tıklama, CTR ve
        ortalama pozisyon (Search Console) Faz 2’de bu bölüme eklenecek.
      </div>
    </div>
  );
}
