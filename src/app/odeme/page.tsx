import type { Metadata } from "next";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { SectionKicker } from "@/components/site/SectionKicker";
import { TeklifFormu } from "@/components/site/TeklifFormu";
import { siteNav } from "@/components/site/siteNav";
import { getCourses } from "@/lib/courses";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = {
  title: "Ön görüşme talebi — Ahmet Ekinci Akademi",
  description:
    "Programın kapsamı ve fiyatı ihtiyacınıza göre belirlenir. Ücretsiz ön görüşme için formu doldurun, 1 iş günü içinde dönüş yapalım.",
};

const adimlar = [
  { baslik: "Formu doldur", metin: "Hangi programla ilgilendiğini ve hedefini yaz." },
  { baslik: "Ön görüşme", metin: "1 iş günü içinde arayıp ihtiyacını birlikte netleştiriyoruz." },
  { baslik: "Kapsam ve teklif", metin: "Sana özel müfredat ve fiyatı yazılı olarak iletiyoruz." },
  { baslik: "Panel erişimi", metin: "Anlaşınca hesabın açılıyor, dersler panelinde görünüyor." },
];

const guvenceler = [
  "Ön görüşme ücretsiz, seni bağlamaz",
  "Bireysel ve kurumsal faturalandırma",
  "Ödemeyi havale veya kartla yapabilirsin",
];

export default async function OnGorusmePage({
  searchParams,
}: {
  searchParams: Promise<{ kurs?: string }>;
}) {
  const { kurs } = await searchParams;
  const courses = await getCourses();
  const kurslar = courses.map((c) => ({ slug: c.slug, baslik: c.baslik }));

  return (
    <div className="bg-white">
      <AnnouncementBar />
      <PublicHeader nav={siteNav} ctaLabel="Eğitimleri incele" ctaHref="/egitimler" />

      <section className="mx-auto max-w-[1240px] px-5 sm:px-8 pt-16 pb-12">
        <SectionKicker>Ön görüşme</SectionKicker>
        <h1 className="mt-[18px] max-w-[660px] font-heading text-[36px] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-[46px]">
          Önce konuşalım, sonra kapsamı birlikte kuralım.
        </h1>
        <p className="mt-6 max-w-[560px] text-[16.5px] leading-[1.62] text-[#5C6273]">
          Eğitimler birebir yürüdüğü için hazır bir paket satmıyoruz. Kapsam da fiyat da senin işine, seviyene ve
          hedefine göre belirleniyor.
        </p>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 sm:px-8 pb-24">
        <div className="grid grid-cols-1 items-start gap-[22px] lg:grid-cols-[1fr_380px]">
          <TeklifFormu kurslar={kurslar} secilenSlug={kurs} />

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-ink/10 bg-mist p-6">
              <h2 className="font-heading text-[17px] font-semibold tracking-[-0.02em]">Nasıl ilerliyor?</h2>
              <ol className="mt-5 flex flex-col gap-[18px]">
                {adimlar.map((a, i) => (
                  <li key={a.baslik} className="flex gap-[13px]">
                    <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-brand font-mono text-[11px] font-semibold text-white">
                      {i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[14.5px] font-semibold text-ink">{a.baslik}</span>
                      <span className="mt-1 block text-[13.5px] leading-[1.55] text-[#5C6273]">{a.metin}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-ink/10 bg-white p-6">
              <div className="flex flex-col gap-[11px]">
                {guvenceler.map((m) => (
                  <div key={m} className="flex items-start gap-[10px] text-[14.5px] leading-[1.5] text-[#3A3F4F]">
                    <span className="mt-[2px] flex h-[17px] w-[17px] flex-none items-center justify-center rounded-[6px] bg-brand/12 text-brand">
                      <Icon name="check" size={11} strokeWidth={2.8} />
                    </span>
                    <span>{m}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
