import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { CorporateStrip } from "@/components/site/CorporateStrip";
import { SectionKicker } from "@/components/site/SectionKicker";
import { siteNav } from "@/components/site/siteNav";
import { EgitimlerFiltre } from "@/components/site/EgitimlerFiltre";
import { getCourses } from "@/lib/courses";

export default async function EgitimlerPage() {
  const courses = await getCourses();

  return (
    <div className="bg-white">
      <AnnouncementBar />
      <PublicHeader nav={siteNav} ctaLabel="İletişime geç" ctaHref="/iletisim" />

      <section className="relative overflow-hidden bg-ink text-white">
        <div
          className="bg-grid-dark absolute inset-0"
          style={{
            maskImage: "radial-gradient(120% 90% at 25% 15%, #000 30%, transparent 78%)",
            WebkitMaskImage: "radial-gradient(120% 90% at 25% 15%, #000 30%, transparent 78%)",
          }}
        />
        <div className="absolute -top-40 -right-20 h-[520px] w-[520px] rounded-full bg-brand opacity-18 blur-[120px]" />
        <div className="relative mx-auto max-w-[1240px] px-8 pt-20 pb-24">
          <SectionKicker tone="light">Eğitimler</SectionKicker>
          <h1 className="mt-[18px] max-w-[640px] font-heading text-[38px] leading-[1.06] font-semibold tracking-[-0.035em] sm:text-[48px]">
            Üç program. <span className="text-brand">Aynı yöntem:</span> birebir.
          </h1>
          <p className="mt-6 max-w-[540px] text-[17px] leading-[1.62] text-white/68">
            Her program online veya Ankara&apos;da yüz yüze ilerler. Müfredat, ön görüşmede işinize göre yeniden
            kurulur — fiyat yerine kapsam konuşulur.
          </p>
        </div>
      </section>

      <EgitimlerFiltre courses={courses} />

      <CorporateStrip text="Ekibinize özel, yerinde ya da uzaktan dijital pazarlama eğitimi." />
      <PublicFooter />
    </div>
  );
}
