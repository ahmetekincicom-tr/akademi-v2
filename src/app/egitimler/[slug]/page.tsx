import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { CorporateStrip } from "@/components/site/CorporateStrip";
import { TestimonialCard } from "@/components/site/TestimonialCard";
import { FaqAccordion } from "@/components/site/FaqAccordion";
import { SectionKicker } from "@/components/site/SectionKicker";
import { CurriculumAccordion } from "@/components/site/CurriculumAccordion";
import { getCourses, getCourseBySlug, egitmenStats, kutuNot } from "@/lib/courses";

export async function generateStaticParams() {
  const courses = await getCourses();
  return courses.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  return { title: course ? `${course.baslik} — Ahmet Ekinci Akademi` : "Eğitim bulunamadı" };
}

const nav = [
  { label: "Müfredat", href: "#mufredat" },
  { label: "Kimler için", href: "#kimler" },
  { label: "Eğitmen", href: "#egitmen" },
  { label: "Yorumlar", href: "#yorumlar" },
  { label: "SSS", href: "#sss" },
];

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const courses = await getCourses();
  const digerler = courses.filter((c) => c.slug !== course.slug);

  return (
    <div className="bg-white">
      <AnnouncementBar />
      <PublicHeader nav={nav} ctaLabel="Hemen katıl" ctaHref="#katil" />

      <section className="relative overflow-hidden bg-ink text-white">
        <div
          className="bg-grid-dark absolute inset-0"
          style={{
            maskImage: "radial-gradient(120% 90% at 25% 15%, #000 30%, transparent 78%)",
            WebkitMaskImage: "radial-gradient(120% 90% at 25% 15%, #000 30%, transparent 78%)",
          }}
        />
        <div className="absolute -top-45 -right-25 h-[600px] w-[600px] rounded-full bg-brand opacity-18 blur-[120px]" />
        <div className="relative mx-auto max-w-[1240px] px-8 pt-9 pb-22">
          <div className="flex items-center gap-[10px] font-mono text-[11px] tracking-[0.08em] text-white/45">
            <Link href="/" className="text-white/45 hover:text-white">
              Ana sayfa
            </Link>
            <span>/</span>
            <Link href="/egitimler" className="text-white/45 hover:text-white">
              Eğitimler
            </Link>
            <span>/</span>
            <span className="text-white/80">{course.baslikVurgu}</span>
          </div>
          <div className="mt-10 grid grid-cols-1 items-start gap-16 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="animate-rise">
              <div className="flex flex-wrap gap-[10px]">
                <span className="inline-flex h-[30px] items-center rounded-full border border-brand/55 bg-brand/14 px-[13px] font-mono text-[10.5px] tracking-[0.12em] text-[#A9C0FF] uppercase">
                  Birebir
                </span>
                <span className="inline-flex h-[30px] items-center rounded-full border border-white/16 px-[13px] font-mono text-[10.5px] tracking-[0.12em] text-white/60 uppercase">
                  Online &amp; Ankara
                </span>
                <span className="inline-flex h-[30px] items-center rounded-full border border-white/16 px-[13px] font-mono text-[10.5px] tracking-[0.12em] text-white/60 uppercase">
                  2026 müfredatı
                </span>
              </div>
              <h1 className="mt-[26px] font-heading text-[38px] leading-[1.06] font-semibold tracking-[-0.04em] sm:text-[46px] lg:text-[56px] lg:leading-[1.04]">
                Birebir <span className="text-brand">{course.baslikVurgu}</span> {course.slug === "meta-business" ? "Eğitimi" : ""}
              </h1>
              <p className="mt-6 max-w-[560px] text-[19px] leading-[1.62] text-white/68">{course.heroAciklama}</p>
              <div className="mt-11 grid grid-cols-2 gap-9 sm:grid-cols-4">
                {course.hizli.map((h) => (
                  <div key={h.etiket}>
                    <div className="font-mono text-[10px] tracking-[0.14em] text-white/42 uppercase">{h.etiket}</div>
                    <div className="mt-2 font-heading text-[21px] font-semibold tracking-[-0.02em]">{h.deger}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="placeholder-block-dark relative flex aspect-[4/3] items-end overflow-hidden rounded-2xl p-5">
              <span className="rounded-[7px] bg-ink/72 px-[11px] py-[7px] font-mono text-[11px] tracking-[0.08em] text-white/60">
                program kapak görseli 4:3
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-16 px-8 lg:grid-cols-[1fr_380px]">
        <main className="min-w-0 py-20 pb-24">
          <section>
            <SectionKicker>Kazanımlar</SectionKicker>
            <h2 className="mt-[18px] mb-8 font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[34px]">
              Eğitim sonunda yapabilecekleriniz
            </h2>
            <div className="grid grid-cols-1 gap-x-7 gap-y-[14px] sm:grid-cols-2">
              {course.kazanimlar.map((k) => (
                <div key={k} className="flex items-start gap-3 text-[15.5px] leading-[1.55] text-[#2B303D]">
                  <span className="mt-[2px] flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[6px] bg-brand/12 text-[10px] font-bold text-brand">
                    ✓
                  </span>
                  <span>{k}</span>
                </div>
              ))}
            </div>
          </section>

          <section id="mufredat" className="mt-22">
            <CurriculumAccordion modules={course.modules} />
          </section>

          <section id="kimler" className="mt-22">
            <SectionKicker>Uygunluk</SectionKicker>
            <h2 className="mt-[18px] mb-8 font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[34px]">
              Kimler için uygun
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="rounded-[15px] border border-brand/30 bg-[#F5F8FF] p-[26px] pt-[26px] pb-7">
                <div className="font-mono text-[10.5px] tracking-[0.14em] text-brand uppercase">Uygun</div>
                <div className="mt-[18px] flex flex-col gap-[13px]">
                  {course.uygun.map((u) => (
                    <div key={u} className="flex items-start gap-[11px] text-[15px] leading-[1.55] text-[#2B303D]">
                      <span className="mt-[2px] flex h-[17px] w-[17px] flex-none items-center justify-center rounded-[6px] bg-brand text-[10px] font-bold text-white">
                        ✓
                      </span>
                      <span>{u}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[15px] border border-ink/11 p-[26px] pt-[26px] pb-7">
                <div className="font-mono text-[10.5px] tracking-[0.14em] text-[#8A8F9E] uppercase">Bu program değil</div>
                <div className="mt-[18px] flex flex-col gap-[13px]">
                  {course.uygunDegil.map((u) => (
                    <div key={u} className="flex items-start gap-[11px] text-[15px] leading-[1.55] text-[#5C6273]">
                      <span className="mt-[2px] flex h-[17px] w-[17px] flex-none items-center justify-center rounded-[6px] bg-ink/8 text-[11px] font-bold text-[#8A8F9E]">
                        —
                      </span>
                      <span>{u}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-22">
            <SectionKicker>Format</SectionKicker>
            <h2 className="mt-[18px] mb-8 font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[34px]">
              Süre ve format
            </h2>
            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[15px] border border-ink/10 bg-ink/10 sm:grid-cols-3">
              {course.format.map((f) => (
                <div key={f.etiket} className="bg-white p-6 px-6 pt-6 pb-[26px]">
                  <div className="font-mono text-[10.5px] tracking-[0.12em] text-[#8A8F9E] uppercase">{f.etiket}</div>
                  <div className="mt-[10px] text-[16.5px] font-semibold tracking-[-0.015em]">{f.deger}</div>
                  <div className="mt-[6px] text-sm leading-[1.6] text-[#5C6273]">{f.not}</div>
                </div>
              ))}
            </div>
          </section>

          <section id="egitmen" className="mt-22">
            <div className="grid grid-cols-1 overflow-hidden rounded-[18px] border border-ink/11 md:grid-cols-[300px_1fr]">
              <div className="placeholder-block flex min-h-[280px] items-end p-4">
                <span className="rounded-[5px] bg-white/90 px-2 py-[5px] font-mono text-[10px] text-[#8A8F9E]">eğitmen portresi</span>
              </div>
              <div className="p-9 pt-9 pb-[38px]">
                <div className="font-mono text-[10.5px] tracking-[0.16em] text-brand uppercase">Eğitmen</div>
                <h2 className="mt-[14px] font-heading text-[26px] leading-[1.12] font-semibold tracking-[-0.03em] sm:text-[30px]">
                  Ahmet Ekinci
                </h2>
                <div className="mt-2 text-[15px] text-[#5C6273]">Dijital pazarlama eğitmeni · Ankara</div>
                <p className="mt-5 max-w-[560px] text-[15.5px] leading-[1.68] text-[#3A3F4F]">
                  2021&apos;den bu yana yalnızca birebir eğitim veriyor. Derslerde teori anlatmak yerine katılımcının
                  kendi hesabı üzerinde çalışıyor; eğitim bittikten sonra da soru-cevap kanalından desteği sürdürüyor.
                </p>
                <div className="mt-[26px] flex flex-wrap gap-[34px]">
                  {egitmenStats.map((e) => (
                    <div key={e.t}>
                      <div className="font-heading text-[26px] font-semibold tracking-[-0.025em]">{e.n}</div>
                      <div className="mt-1 text-[13.5px] text-[#5C6273]">{e.t}</div>
                    </div>
                  ))}
                </div>
                <Link href="/hakkimizda" className="mt-7 inline-flex text-[14.5px] font-semibold">
                  Hakkımızda sayfası →
                </Link>
              </div>
            </div>
          </section>

          <section id="yorumlar" className="mt-22">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
              <div>
                <SectionKicker>Bu programa katılanlar</SectionKicker>
                <h2 className="mt-[18px] font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[34px]">
                  Katılımcı yorumları
                </h2>
              </div>
              <Link href="/yorumlar" className="text-[14.5px] font-semibold whitespace-nowrap">
                Tüm yorumlar →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {course.yorumlar.map((y) => (
                <TestimonialCard key={y.isim} {...y} />
              ))}
            </div>
          </section>

          <section id="sss" className="mt-22">
            <SectionKicker>SSS</SectionKicker>
            <h2 className="mt-[18px] mb-7 font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[34px]">
              Bu program hakkında
            </h2>
            <FaqAccordion items={course.sss} />
          </section>
        </main>

        <aside id="katil" className="pt-20 lg:sticky lg:top-[106px] lg:self-start">
          <div className="overflow-hidden rounded-[18px] border border-ink/11 bg-white shadow-[0_26px_60px_rgba(10,13,24,0.1)]">
            <div className="bg-ink px-6 pt-[26px] pb-6 text-white">
              <div className="font-mono text-[10.5px] tracking-[0.14em] text-white/50 uppercase">Kişiye özel program</div>
              <div className="mt-3 font-heading text-[26px] leading-[1.15] font-semibold tracking-[-0.025em]">
                Kapsam ve süre size göre kurulur
              </div>
              <p className="mt-3 text-[14.5px] leading-[1.6] text-white/62">
                Bu yüzden sabit bir liste fiyatı yok. Ücretsiz ön görüşmeden sonra net teklifinizi paylaşıyoruz.
              </p>
            </div>
            <div className="px-6 pt-6 pb-[26px]">
              <div className="flex flex-col gap-3">
                {course.kutuSatir.map((k) => (
                  <div key={k.etiket} className="flex items-center justify-between gap-4 text-[14.5px]">
                    <span className="text-[#6B7080]">{k.etiket}</span>
                    <span className="text-right font-semibold text-ink">{k.deger}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/odeme"
                className="mt-[22px] flex h-13 items-center justify-center gap-[9px] rounded-[11px] bg-brand text-[16px] font-semibold text-white shadow-[0_12px_28px_rgba(28,86,243,0.32)] hover:bg-ink"
              >
                Hemen katıl <span>→</span>
              </Link>
              <Link
                href="/iletisim"
                className="mt-[10px] flex h-12 items-center justify-center rounded-[11px] border border-ink/14 text-[15px] font-semibold text-ink hover:border-brand hover:text-brand"
              >
                Ücretsiz ön görüşme planla
              </Link>
              <div className="mt-[18px] flex flex-col gap-[10px] border-t border-ink/9 pt-[18px]">
                {kutuNot.map((n) => (
                  <div key={n} className="flex items-start gap-[10px] text-[13.5px] leading-[1.5] text-[#5C6273]">
                    <span className="mt-[1px] flex h-4 w-4 flex-none items-center justify-center rounded-[5px] bg-brand/12 text-[9px] font-bold text-brand">
                      ✓
                    </span>
                    <span>{n}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-[14px] rounded-[14px] border border-ink/11 p-5">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-[#F2F4FA] text-[15px] text-brand">
              ?
            </span>
            <div>
              <div className="text-[14.5px] font-semibold">Emin değil misiniz?</div>
              <p className="mt-[6px] mb-[10px] text-[13.5px] leading-[1.55] text-[#5C6273]">
                Hangi programın uyduğunu 15 dakikalık görüşmede netleştirelim.
              </p>
              <Link href="/iletisim" className="text-[13.5px] font-semibold">
                WhatsApp&apos;tan yazın →
              </Link>
            </div>
          </div>
        </aside>
      </div>

      <CorporateStrip text="Bu programı ekibiniz için özelleştirelim." />

      <section className="mx-auto max-w-[1240px] px-8 pt-22 pb-24">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
          <h2 className="font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[34px]">
            Diğer programlar
          </h2>
          <Link href="/egitimler" className="text-[14.5px] font-semibold whitespace-nowrap">
            Tüm eğitimler →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-[22px] sm:grid-cols-2">
          {digerler.map((d) => (
            <Link
              key={d.slug}
              href={`/egitimler/${d.slug}`}
              className="flex gap-5 rounded-2xl border border-ink/11 p-[22px] text-ink transition hover:-translate-y-1 hover:border-brand/45 hover:shadow-[0_20px_44px_rgba(10,13,24,0.1)]"
            >
              <div className="placeholder-block aspect-[4/3] w-[130px] flex-none rounded-[11px]" />
              <div className="min-w-0">
                <div className="font-mono text-[10.5px] tracking-[0.08em] text-[#8A8F9E]">
                  {d.sure} · {d.modul}
                </div>
                <div className="mt-[10px] font-heading text-[20px] leading-[1.2] font-semibold tracking-[-0.02em]">
                  {d.baslik}
                </div>
                <p className="mt-2 text-[14.5px] leading-[1.55] text-[#5C6273]">{d.aciklama}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
