import Link from "next/link";
import type { Metadata } from "next";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { TestimonialCard } from "@/components/site/TestimonialCard";
import { FaqAccordion } from "@/components/site/FaqAccordion";
import { SectionKicker } from "@/components/site/SectionKicker";
import { getCourses } from "@/lib/courses";
import { sayfaMeta } from "@/lib/seo";

// Paylaşım görseli panelden okunduğu için metadata istek anında üretiliyor.
export function generateMetadata(): Promise<Metadata> {
  return sayfaMeta({
  baslik: "Kurumsal Eğitim",
  aciklama:
    "Ekibinize özel dijital pazarlama eğitimi: Ankara'da yerinde ya da tamamen uzaktan. Müfredat ekibin seviyesine göre kurulur, kurumsal faturalandırma ve eğitim sonrası destek dahil.",
  yol: "/kurumsal",
});
}

const farklar = [
  { no: "01", baslik: "Ekibe özel müfredat", metin: "Program, ekibinizin mevcut seviyesine ve kullandığınız hesaplara göre yeniden kurulur." },
  { no: "02", baslik: "Yerinde veya uzaktan", metin: "Ankara'da ofisinizde ya da tamamen online — ekibinizin uygun olduğu formatta ilerleriz." },
  { no: "03", baslik: "Tek noktadan faturalandırma", metin: "Kurumsal fatura, e-fatura ve toplu ödeme seçenekleriyle satın alma süreciniz tek elden yürür." },
  { no: "04", baslik: "Rapor ve devam desteği", metin: "Eğitim sonunda ekip bazlı bir özet rapor paylaşılır; soru-cevap kanalı ekip için açık kalır." },
];

const surec = [
  { no: "1", etiket: "Ücretsiz", baslik: "İhtiyaç görüşmesi", metin: "Ekibinizin mevcut seviyesini ve hedefini konuşuruz; kaç kişinin katılacağını netleştiririz." },
  { no: "2", etiket: "Planlama", baslik: "Müfredat ve takvim", metin: "Modüller ekibinize göre kurulur; oturumlar iş takviminize göre planlanır." },
  { no: "3", etiket: "Uygulama", baslik: "Ekip eğitimi", metin: "Oturumlar ekibin kendi hesapları ve kendi projeleri üzerinde ilerler." },
  { no: "4", etiket: "Süresiz", baslik: "Rapor ve devam desteği", metin: "Ekip özet raporu paylaşılır; soru-cevap kanalı eğitim sonrasında da açık kalır." },
];

const sss = [
  { soru: "Kaç kişilik ekiplere uygun?", cevap: "2 kişiden büyük pazarlama ekiplerine kadar uyarlanabilir. Katılımcı sayısına göre birebir mi grup formatı mı uygun olduğunu birlikte belirleriz." },
  { soru: "Hangi programlar kurumsal formatta sunulabilir?", cevap: "Meta Ads, sosyal medya yönetimi ve yapay zekâ eğitimlerinin üçü de kurumsal formata uyarlanır; birden fazla programı tek pakette birleştirmek de mümkün." },
  { soru: "Yerinde eğitim sadece Ankara'da mı mümkün?", cevap: "Yerinde eğitim öncelikli olarak Ankara'da yapılır; şehir dışı için seyahat şartları ayrıca konuşulur. Uzaktan format tüm şehirlerde mümkün." },
  { soru: "Fatura ve ödeme nasıl işliyor?", cevap: "Kurumsal fatura, e-fatura ve toplu/taksitli ödeme seçenekleri mevcut. Sözleşme ve fatura bilgileri ihtiyaç görüşmesinde netleşir." },
  { soru: "Eğitim sonrası ekip için destek devam ediyor mu?", cevap: "Evet. Soru-cevap kanalı ekip için açık kalır; kampanya veya içerik gözden geçirme talepleri karşılanır." },
];

// Kurslar admin panelinden düzenlendiği için sayfa istek anında render edilir;
// build anında dondurulursa yayınlanan eğitim siteye hiç yansımaz.
export const dynamic = "force-dynamic";

export default async function KurumsalPage() {
  const courses = await getCourses();

  return (
    <div className="bg-white">
      <PublicHeader />

      <section className="relative overflow-hidden bg-ink text-white">
        <div
          className="bg-grid-dark absolute inset-0"
          style={{
            maskImage: "radial-gradient(120% 90% at 25% 15%, #000 30%, transparent 78%)",
            WebkitMaskImage: "radial-gradient(120% 90% at 25% 15%, #000 30%, transparent 78%)",
          }}
        />
        <div className="absolute -top-40 -right-20 h-[520px] w-[520px] rounded-full bg-brand opacity-18 blur-[120px]" />
        <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8 pt-20 pb-24">
          <SectionKicker tone="light">Kurumsal</SectionKicker>
          <h1 className="mt-[18px] max-w-[680px] font-heading text-[36px] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-[48px]">
            Ekibinize özel, <span className="text-brand">yerinde ya da uzaktan</span> dijital pazarlama eğitimi.
          </h1>
          <p className="mt-6 max-w-[560px] text-[17px] leading-[1.62] text-white/68">
            Aynı birebir yöntemi ekip formatına uyarlıyoruz: kendi hesaplarınız, kendi kampanyalarınız üzerinde,
            işinize göre kurulan bir müfredatla.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/iletisim"
              className="inline-flex h-14 items-center gap-[10px] rounded-[11px] bg-brand px-7 text-[16.5px] font-semibold text-white shadow-[0_12px_32px_rgba(28,86,243,0.4)] hover:bg-white hover:text-ink"
            >
              Kurumsal eğitim planı oluştur <span>→</span>
            </Link>
            <span className="font-mono text-xs tracking-[0.06em] text-white/50">Ücretsiz ihtiyaç görüşmesiyle başlar</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 sm:px-8 pt-22 pb-20">
        <SectionKicker>Fark</SectionKicker>
        <h2 className="mt-[18px] mb-12 max-w-[620px] font-heading text-[32px] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-[40px]">
          Standart kurumsal eğitim programı değil.
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {farklar.map((f) => (
            <div key={f.no} className="rounded-[15px] border border-ink/11 p-6 px-6 pt-7 pb-[30px]">
              <div className="font-heading text-[34px] font-semibold tracking-[-0.03em] text-brand">{f.no}</div>
              <h3 className="mt-[22px] text-[19px] leading-[1.3] font-semibold tracking-[-0.02em]">{f.baslik}</h3>
              <p className="mt-[11px] text-[14.5px] leading-[1.65] text-[#5C6273]">{f.metin}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-ink/8 bg-mist">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8 py-20">
          <SectionKicker>Süreç</SectionKicker>
          <h2 className="mt-[18px] mb-12 max-w-[620px] font-heading text-[32px] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-[40px]">
            Kurumsal eğitim nasıl kuruluyor
          </h2>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 sm:grid-cols-2 lg:grid-cols-4">
            {surec.map((a) => (
              <div key={a.no} className="bg-white p-[26px] px-[26px] pt-[30px] pb-[34px]">
                <div className="flex items-center gap-3">
                  <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[8px] bg-brand font-mono text-[11px] font-medium text-white">
                    {a.no}
                  </span>
                  <span className="font-mono text-[10.5px] tracking-[0.12em] text-[#656B7A] uppercase">{a.etiket}</span>
                </div>
                <h3 className="mt-5 text-[19px] leading-[1.3] font-semibold tracking-[-0.02em]">{a.baslik}</h3>
                <p className="mt-[10px] text-[14.5px] leading-[1.65] text-[#5C6273]">{a.metin}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 sm:px-8 py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <SectionKicker>Programlar</SectionKicker>
            <h2 className="mt-[18px] font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[34px]">
              Kurumsal formata uyarlanabilen programlar
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {courses.map((c) => (
            <Link
              key={c.slug}
              href={`/egitimler/${c.slug}`}
              className="flex flex-col rounded-2xl border border-ink/11 p-6 transition hover:-translate-y-1 hover:border-brand/45 hover:shadow-[0_20px_44px_rgba(10,13,24,0.1)]"
            >
              <div className="font-mono text-[10.5px] tracking-[0.08em] text-[#656B7A]">
                {c.sure} · {c.modul}
              </div>
              <div className="mt-3 font-heading text-lg leading-[1.25] font-semibold tracking-[-0.02em]">{c.baslik}</div>
              <p className="mt-2 flex-1 text-[14px] leading-[1.55] text-[#5C6273]">{c.aciklama}</p>
              <span className="mt-4 inline-flex w-fit items-center rounded-full bg-brand/12 px-[10px] py-1 font-mono text-[9.5px] tracking-[0.1em] text-brand uppercase">
                Kurumsala uyarlanabilir
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-ink/8 bg-mist">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8 py-20">
          <TestimonialCard
            metin="Ekibimizin reklam hesabı üzerinde çalışarak ilerlemesi teoriyi hemen pratiğe dökmemizi sağladı. Eğitim bitince rapor ve takip listesiyle devam ettik."
            isim="Kurumsal Katılımcı"
            rol="Pazarlama Direktörü"
          />
        </div>
      </section>

      <section className="mx-auto grid max-w-[1240px] grid-cols-1 gap-16 px-5 sm:px-8 py-24 lg:grid-cols-[0.75fr_1.25fr]">
        <div>
          <SectionKicker>SSS</SectionKicker>
          <h2 className="mt-[18px] font-heading text-[32px] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-[40px]">
            Kurumsal eğitim hakkında
          </h2>
          <Link
            href="/iletisim"
            className="mt-6 inline-flex h-12 items-center rounded-[10px] bg-ink px-5 text-[14.5px] font-semibold text-white hover:bg-brand"
          >
            Kurumsal eğitim planı oluştur →
          </Link>
        </div>
        <FaqAccordion items={sss} />
      </section>

      <PublicFooter />
    </div>
  );
}
