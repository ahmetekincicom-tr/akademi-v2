import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { CorporateStrip } from "@/components/site/CorporateStrip";
import { SectionKicker } from "@/components/site/SectionKicker";
import { siteNav } from "@/components/site/siteNav";
import { YorumlarFiltre } from "@/components/site/YorumlarFiltre";
import { getCourses } from "@/lib/courses";
import { getYorumlar } from "@/lib/icerik";

// Kurslar admin panelinden düzenlendiği için sayfa istek anında render edilir;
// build anında dondurulursa yayınlanan eğitim siteye hiç yansımaz.
export const dynamic = "force-dynamic";

export default async function YorumlarPage() {
  const [courses, yorumlar] = await Promise.all([getCourses(), getYorumlar()]);

  return (
    <div className="bg-white">
      <PublicHeader nav={siteNav} ctaLabel="Eğitimleri incele" ctaHref="/egitimler" />

      <section className="mx-auto max-w-[1240px] px-5 sm:px-8 pt-16 pb-10">
        <SectionKicker>Katılımcı yorumları</SectionKicker>
        <h1 className="mt-[18px] max-w-[640px] font-heading text-[36px] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-[46px]">
          Eğitimden sonra ne değişti
        </h1>
        <p className="mt-6 max-w-[560px] text-[16.5px] leading-[1.62] text-[#5C6273]">
          Programa göre filtreleyip katılımcıların kendi cümleleriyle ne değiştiğini okuyabilirsiniz.
        </p>
      </section>

      <YorumlarFiltre yorumlar={yorumlar} kurslar={courses.map((c) => ({ id: c.id, etiket: c.baslikVurgu }))} />

      <CorporateStrip text="Ekibinize özel, yerinde ya da uzaktan dijital pazarlama eğitimi." />
      <PublicFooter />
    </div>
  );
}
