import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { CorporateStrip } from "@/components/site/CorporateStrip";
import { getReferanslar } from "@/lib/icerik";
import { ReferansLogo } from "@/components/site/ReferansLogo";
import { sayfaMeta } from "@/lib/seo";
import { otomatikSeo } from "@/lib/sayfa-seo";

// Paylaşım görseli panelden okunduğu için metadata istek anında üretiliyor.
export function generateMetadata(): Promise<Metadata> {
  return sayfaMeta({
  // Metinler tek kaynakta: src/lib/sayfa-seo.ts. Panel de aynı yerden
  // okuyor — iki yere yazılsaydı biri değiştiğinde diğeri sessizce eskir.
  ...otomatikSeo("/referanslar"),
  yol: "/referanslar",
});
}

// Gerekçe: src/app/page.tsx
export const revalidate = 3600;

export default async function ReferanslarPage() {
  const referanslar = (await getReferanslar()).filter((r) => r.yayinda);

  /*
    Sektöre göre döküm. Logolar görsel; arama motoru ve ekran okuyucu için
    sayfada kurum adları metin olarak da bulunsun (SEO denetimi bu sayfayı
    "ince içerik" diye işaretliyordu). Veri panelden girilen sektör alanı,
    uydurma bir metin yok. Sektörü boş olanlar "Diğer"de.
  */
  const sektorler = new Map<string, string[]>();
  for (const r of referanslar) {
    const s = r.sektor.trim() || "Diğer";
    sektorler.set(s, [...(sektorler.get(s) ?? []), r.ad]);
  }
  const sektorListesi = [...sektorler.entries()].sort(
    (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], "tr"),
  );

  return (
    <div className="bg-white">
      <PublicHeader />

      <section className="mx-auto max-w-[1240px] px-5 pt-16 pb-12 sm:px-8">
        <h1 className="font-heading text-[36px] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-[46px]">
          Referanslar
        </h1>
        <p className="mt-6 max-w-[620px] text-[16.5px] leading-[1.62] text-[#5C6273]">
          Eğitimlerimizi tercih eden kuruluşlar &amp; referanslar: {sektorler.size} farklı sektörden{" "}
          {referanslar.length} kurum ve marka. Ekibinize özel bir program için{" "}
          <Link href="/kurumsal" className="font-semibold text-brand hover:text-ink">
            kurumsal eğitim
          </Link>{" "}
          sayfasına göz atabilirsiniz.
        </p>
      </section>

      {/*
        Üç sütun ve gri: logolar farklı renklerde ve farklı yoğunluklarda
        olduğu için renkli bir ızgara alacalı görünüyor. Gri hepsini aynı ağırlığa
        indiriyor; üzerine gelince kendi rengine dönüyor.
      */}
      <section className="mx-auto max-w-[1240px] px-5 pb-16 sm:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5">
          {referanslar.map((r) => (
            <ReferansLogo
              key={r.id}
              referans={r}
              gri
              boyut="izgara"
              className="h-[112px] rounded-[14px] border border-ink/10 bg-white px-4 transition hover:border-brand/35 sm:h-[132px] sm:px-6"
            />
          ))}
        </div>
      </section>

      {sektorListesi.length > 0 && (
        <section className="mx-auto max-w-[1240px] px-5 pb-24 sm:px-8">
          <h2 className="font-heading text-[26px] leading-[1.15] font-semibold tracking-[-0.03em] sm:text-[30px]">
            Sektörlere göre referanslar
          </h2>
          <dl className="mt-8 grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            {sektorListesi.map(([sektor, adlar]) => (
              <div key={sektor} className="border-t border-ink/10 pt-4">
                <dt className="font-mono text-[11px] tracking-[0.14em] text-[#6B7080] uppercase">{sektor}</dt>
                <dd className="mt-2 text-[15.5px] leading-[1.6] text-ink">{adlar.join(", ")}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-10 max-w-[620px] text-[15.5px] leading-[1.65] text-[#5C6273]">
            Katılımcıların eğitim sonrası görüşlerini{" "}
            <Link href="/yorumlar" className="font-semibold text-brand hover:text-ink">
              yorumlar
            </Link>{" "}
            sayfasında, tüm programları{" "}
            <Link href="/egitimler" className="font-semibold text-brand hover:text-ink">
              eğitimler
            </Link>{" "}
            sayfasında bulabilirsiniz.
          </p>
        </section>
      )}

      <CorporateStrip text="Ekibinize özel, yerinde ya da uzaktan dijital pazarlama eğitimi." />
      <PublicFooter />
    </div>
  );
}
