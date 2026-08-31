import Link from "next/link";
import type { Metadata } from "next";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { TestimonialCard } from "@/components/site/TestimonialCard";
import { FaqAccordion } from "@/components/site/FaqAccordion";
import { SectionKicker } from "@/components/site/SectionKicker";
import { Icon, type IconName } from "@/components/Icon";
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

/*
  Numaralar KALDIRILDI.

  01-04 sıralı bir süreç sözü veriyordu ama bunlar birbirinden bağımsız dört
  özellik; sıra numarası okuyucuya "önce bu, sonra şu" diye yanlış bir şey
  söylüyordu. Sıralı olan tek bölüm aşağıdaki süreç zaman çizelgesi ve o
  ayrım artık görsel olarak da net.

  "Tek noktadan faturalandırma" buradan çıkarıldı: satın alma detayı, eğitimi
  neden tercih edeceğini anlatan bir vaat değil. Bilgi SSS'de duruyor.
*/
const farklar: { ikon: IconName; baslik: string; metin: string }[] = [
  {
    ikon: "sliders",
    baslik: "İhtiyaca özel program",
    metin:
      "Hazır bir müfredat uygulamak yerine, eğitim içeriğini ekibinizin bilgi düzeyine ve hedeflerine göre oluşturuyoruz.",
  },
  {
    ikon: "grid",
    baslik: "Gerçek hesaplarla uygulama",
    metin:
      "Çalışmaları kendi reklam hesaplarınız, kampanyalarınız ve güncel projeleriniz üzerinden gerçekleştiriyoruz.",
  },
  {
    ikon: "pin",
    baslik: "Yerinde veya online eğitim",
    metin:
      "Eğitimi Ankara'daki ofisinizde ya da canlı online oturumlarla, ekibinize uygun formatta düzenliyoruz.",
  },
  {
    ikon: "message",
    baslik: "Eğitim sonrası destek",
    metin:
      "Eğitim sonunda ekip bazlı değerlendirme paylaşırken, soru-cevap iletişimini eğitim sonrasında da sürdürüyoruz.",
  },
];

const surec = [
  {
    no: "1",
    etiket: "Ücretsiz",
    baslik: "İhtiyaç analizi",
    metin:
      "Ekibinizin deneyim düzeyini, hedeflerini, katılımcı sayısını ve öncelikli eğitim konularını birlikte belirliyoruz.",
  },
  {
    no: "2",
    etiket: "Planlama",
    baslik: "Program ve takvim",
    metin:
      "Eğitimin içeriğini, süresini ve formatını belirleyerek oturumları ekibinizin iş takvimine göre planlıyoruz.",
  },
  {
    no: "3",
    etiket: "Uygulama",
    baslik: "Uygulamalı ekip eğitimi",
    metin:
      "Eğitimi, ekibinizin kendi hesapları ve gerçek projeleri üzerinden uygulamalı olarak gerçekleştiriyoruz.",
  },
  {
    /*
      Etiket "Süresiz" idi. Süresiz bir hizmet taahhüdü vermiyoruz ve o
      kelime, satın alma kararını sonradan karşılanamayacak bir beklentiyle
      kuruyordu. "Devam desteği" aynı şeyi söz vermeden anlatıyor.
    */
    no: "4",
    etiket: "Devam desteği",
    baslik: "Raporlama ve destek",
    metin:
      "Eğitim sonunda ekip bazlı değerlendirme paylaşıyor ve soru-cevap iletişimini eğitim sonrasında da sürdürüyoruz.",
  },
];

const sss = [
  { soru: "Kaç kişilik ekiplere uygun?", cevap: "2 kişiden büyük pazarlama ekiplerine kadar uyarlanabilir. Katılımcı sayısına göre birebir mi grup formatı mı uygun olduğunu birlikte belirleriz." },
  { soru: "Hangi programlar kurumsal formatta sunulabilir?", cevap: "Meta Ads, sosyal medya yönetimi ve yapay zekâ eğitimlerinin üçü de kurumsal formata uyarlanır; birden fazla programı tek pakette birleştirmek de mümkün." },
  { soru: "Yerinde eğitim sadece Ankara'da mı mümkün?", cevap: "Yerinde eğitim öncelikli olarak Ankara'da yapılır; şehir dışı için seyahat şartları ayrıca konuşulur. Uzaktan format tüm şehirlerde mümkün." },
  { soru: "Fatura ve ödeme nasıl işliyor?", cevap: "Kurumsal fatura, e-fatura ve toplu/taksitli ödeme seçenekleri mevcut. Sözleşme ve fatura bilgileri ihtiyaç görüşmesinde netleşir." },
  { soru: "Eğitim sonrası ekip için destek devam ediyor mu?", cevap: "Evet. Soru-cevap kanalı ekip için açık kalır; kampanya veya içerik gözden geçirme talepleri karşılanır." },
];

// Gerekçe: src/app/page.tsx
export const revalidate = 3600;

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
          <SectionKicker tone="light">Kurumsal Eğitimler</SectionKicker>
          {/* Vurgu rengi yok: koyu zeminde marka mavisi başlığın ortasını geri
              çekiyor. Aynı karar eğitim sayfası hero'sunda da alındı. */}
          <h1 className="mt-[18px] max-w-[700px] font-heading text-[36px] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-[48px]">
            Ekibinizin ihtiyaçlarına özel dijital pazarlama eğitimleri.
          </h1>
          <p className="mt-6 max-w-[620px] text-[17px] leading-[1.62] text-white/72">
            Eğitim içeriğini ekibinizin hedeflerine göre planlıyor; uygulamaları kendi hesaplarınız, kampanyalarınız
            ve gerçek iş süreçleriniz üzerinden gerçekleştiriyoruz. Eğitimlerimizi yerinde veya online olarak
            düzenliyoruz.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            {/* Konu formda hazır seçili geliyor; kurumsal talep eden kişi
                açılır listede kendi konusunu aramak zorunda kalmasın. */}
            <Link
              href="/iletisim?konu=kurumsal"
              className="inline-flex h-14 items-center gap-[10px] rounded-[11px] bg-brand px-7 text-[16.5px] font-semibold text-white shadow-[0_12px_32px_rgba(28,86,243,0.4)] hover:bg-white hover:text-ink"
            >
              Ekibiniz İçin Eğitim Planlayın <span>→</span>
            </Link>
            <span className="font-mono text-xs tracking-[0.06em] text-white/50">Ücretsiz ihtiyaç görüşmesiyle başlar</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 sm:px-8 pt-22 pb-20">
        <SectionKicker>Neden Ahmet Ekinci Akademi?</SectionKicker>
        <h2 className="mt-[18px] max-w-[640px] font-heading text-[32px] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-[40px]">
          Standart bir eğitim değil, ekibinize özel bir gelişim planı.
        </h2>
        <p className="mt-5 mb-11 max-w-[620px] text-[16.5px] leading-[1.7] text-[#3A3F4F]">
          Eğitim programını ekibinizin deneyim düzeyine, hedeflerine ve çalışma süreçlerine göre birlikte
          şekillendiriyoruz.
        </p>
        {/*
          Kartlar rakam yerine ikonla açılıyor ve daha alçak: 34px'lik rakam
          kartın üçte birini kaplıyor, altındaki başlığı aşağı itiyordu.
          Hover'da hafif yükselme ve maviye yaklaşan kenarlık — kartın
          tıklanabilir olmadığını bozmayacak kadar.
        */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {farklar.map((f) => (
            <div
              key={f.baslik}
              className="rounded-[15px] border border-ink/11 p-6 transition duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_10px_28px_rgba(10,13,24,0.07)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-brand/10 text-brand">
                <Icon name={f.ikon} size={20} />
              </span>
              <h3 className="mt-[18px] text-[18px] leading-[1.3] font-semibold tracking-[-0.02em]">{f.baslik}</h3>
              <p className="mt-[10px] text-[14.5px] leading-[1.65] text-[#3A3F4F]">{f.metin}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-ink/8 bg-mist">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8 py-20">
          <SectionKicker>Süreç</SectionKicker>
          <h2 className="mt-[18px] max-w-[620px] font-heading text-[32px] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-[40px]">
            Kurumsal eğitim süreci nasıl ilerliyor?
          </h2>
          <p className="mt-5 mb-14 max-w-[620px] text-[16.5px] leading-[1.7] text-[#3A3F4F]">
            İlk ihtiyaç görüşmesinden eğitim sonrası desteğe kadar tüm süreci birlikte planlıyoruz.
          </p>

          {/*
            Kart ızgarası DEĞİL, zaman çizelgesi.

            Dört kutu yan yana dizildiğinde üstteki avantaj kartlarıyla aynı
            şeyi anlatıyor gibi duruyordu; oysa buradaki dört madde birbirini
            takip eden aşamalar. Aradaki çizgi tam olarak bu farkı söylüyor:
            numaralar bir çizgi üzerinde duruyor, kutuların içinde değil.

            Çizgi mutlak konumlandırma ile değil, her adımın kendi satırındaki
            esneyen bir parça olarak çiziliyor — böylece sütun genişliği
            değiştiğinde hizalama kendiliğinden korunuyor. Son adımda çizgi
            yok: hiçbir yere bağlanmayan bir çizgi sürecin devam ettiğini
            söylerdi.

            Dar ekranda aynı yapı dikeye dönüyor; numara solda, çizgi aşağı
            iniyor.
          */}
          {/* Tablette de TEK sütun: iki sütuna bölünen bir zaman çizelgesinde
              okuma sırası "sağa mı, aşağı mı" belirsiz kalıyor. */}
          <ol className="grid grid-cols-1 gap-x-8 lg:grid-cols-4">
            {surec.map((a, i) => {
              const son = i === surec.length - 1;
              const numara = (
                <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-brand font-mono text-[13px] font-medium text-white">
                  {a.no}
                </span>
              );

              return (
                <li key={a.no} className="flex gap-4 lg:block">
                  {/* Dar ekran: numara solda, çizgi aşağı iniyor. */}
                  <div className="flex flex-col items-center lg:hidden">
                    {numara}
                    {!son && <span className="mt-2 w-px flex-1 bg-ink/12" />}
                  </div>

                  {/* Geniş ekran: numara solda, çizgi sağa uzanıyor. */}
                  <div className="hidden items-center gap-3 lg:flex">
                    {numara}
                    {!son && <span className="h-px flex-1 bg-ink/12" />}
                  </div>

                  <div className={`lg:pt-6 lg:pr-8 lg:pb-0 ${son ? "pb-0" : "pb-9"}`}>
                    <span className="font-mono text-[10.5px] tracking-[0.12em] text-[#656B7A] uppercase">
                      {a.etiket}
                    </span>
                    <h3 className="mt-[10px] text-[18px] leading-[1.3] font-semibold tracking-[-0.02em]">
                      {a.baslik}
                    </h3>
                    <p className="mt-[10px] text-[14.5px] leading-[1.65] text-[#3A3F4F]">{a.metin}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Sürecin sonunda tek eylem: çizelgeyi okuyup "peki nasıl
              başlıyorum" diyen kişinin aşağı inmesi gerekmesin. */}
          <div className="mt-14 flex flex-col items-center">
            <Link
              href="/iletisim?konu=kurumsal"
              className="inline-flex h-14 items-center gap-[10px] rounded-[11px] bg-brand px-7 text-[16px] font-semibold text-white shadow-[0_12px_32px_rgba(28,86,243,0.28)] transition hover:bg-ink"
            >
              Ekibiniz İçin Eğitim Planlayın <span>→</span>
            </Link>
            <span className="mt-[14px] text-[13.5px] text-[#6B7080]">Ücretsiz ihtiyaç analiziyle başlayın</span>
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
                {/* Modül sayısı kaldırıldı; gerekçesi EgitimlerFiltre'de. */}
                {c.sure}
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
            href="/iletisim?konu=kurumsal"
            className="mt-6 inline-flex h-12 items-center rounded-[10px] bg-ink px-5 text-[14.5px] font-semibold text-white hover:bg-brand"
          >
            Ekibiniz İçin Eğitim Planlayın →
          </Link>
        </div>
        <FaqAccordion items={sss} />
      </section>

      <PublicFooter />
    </div>
  );
}
