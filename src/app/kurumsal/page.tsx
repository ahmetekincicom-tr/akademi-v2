import Link from "next/link";
import type { Metadata } from "next";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { FaqAccordion } from "@/components/site/FaqAccordion";
import { SectionKicker } from "@/components/site/SectionKicker";
import { Icon, type IconName } from "@/components/Icon";
import { ReferansBulutu } from "@/components/site/ReferansBulutu";
import { getReferanslar } from "@/lib/icerik";
import { getKurumsalSss } from "@/lib/kurumsal";
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
      "Eğitimi ofisinizde ya da canlı online oturumlarla, ekibinize uygun formatta düzenliyoruz.",
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


// Gerekçe: src/app/page.tsx
export const revalidate = 3600;

export default async function KurumsalPage() {
  const [referanslar, sss] = await Promise.all([getReferanslar(), getKurumsalSss()]);

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
        {/*
          Hero ORTALI.

          Sola yaslıyken dar ekranda başlık ve açıklama sola, düğme de sola
          dayanıyordu ama satırlar farklı uzunlukta bittiği için blok dağınık
          duruyordu. Ortalanmış tek sütun hem mobilde hem masaüstünde derli
          toplu; hakkımızda hero'su da aynı düzende.
        */}
        <div className="relative mx-auto max-w-[860px] px-5 pt-20 pb-24 text-center sm:px-8">
          <div className="flex justify-center">
            <SectionKicker tone="light">Kurumsal Eğitimler</SectionKicker>
          </div>
          {/* Vurgu rengi yok: koyu zeminde marka mavisi başlığın ortasını geri
              çekiyor. Aynı karar eğitim sayfası hero'sunda da alındı. */}
          <h1 className="mx-auto mt-[18px] max-w-[700px] font-heading text-[36px] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-[48px]">
            Ekibinizin ihtiyaçlarına özel dijital pazarlama eğitimleri.
          </h1>
          <p className="mx-auto mt-6 max-w-[640px] text-[17px] leading-[1.62] text-white/72">
            Eğitim içeriğini ekibinizin hedeflerine göre planlıyor; uygulamaları kendi hesaplarınız, kampanyalarınız
            ve gerçek iş süreçleriniz üzerinden gerçekleştiriyoruz. Eğitimlerimizi yerinde veya online olarak
            düzenliyoruz.
          </p>
          <div className="mt-9 flex justify-center">
            {/* Konu formda hazır seçili geliyor; kurumsal talep eden kişi
                açılır listede kendi konusunu aramak zorunda kalmasın. */}
            <Link
              href="/iletisim?konu=kurumsal"
              className="inline-flex h-14 items-center gap-[10px] rounded-[11px] bg-brand px-7 text-[16.5px] font-semibold text-white shadow-[0_12px_32px_rgba(28,86,243,0.4)] hover:bg-white hover:text-ink"
            >
              Ekibiniz İçin Eğitim Planlayın <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Referanslar hero'nun hemen altında: sayfaya kurumsal bir talep için
          gelen kişinin ilk sorduğu şey "bunu kimler aldı". */}
      <ReferansBulutu referanslar={referanslar} />

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

      {/*
        Süreç bölümü mavimsi degrade zeminde.

        Düz beyaz sayfada üst üste üç bölüm aynı zeminde duruyor ve nerede
        birinin bitip diğerinin başladığı okunmuyordu. Renk, bölümü ayıran en
        ucuz araç: kutu, çerçeve ya da ayraç eklemeden sınırı çiziyor.

        Degrade dikey ve çok dar bir aralıkta (beyaz → açık mavi → beyaz):
        bölüm zeminden yumuşakça çıkıp yumuşakça iniyor, üstteki ve alttaki
        beyaz bölümlerle arasında sert bir çizgi kalmıyor.
      */}
      <section className="relative overflow-hidden border-y border-ink/8 bg-gradient-to-b from-white via-[#EAF0FE] to-white">
        <div
          className="bg-grid-acik pointer-events-none absolute inset-0"
          style={{
            maskImage: "radial-gradient(100% 80% at 50% 50%, #000 20%, transparent 78%)",
            WebkitMaskImage: "radial-gradient(100% 80% at 50% 50%, #000 20%, transparent 78%)",
          }}
        />
        <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8 py-20">
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

      {/*
        SSS bölümü ızgaralı ve degrade zeminde.

        Sayfanın son bölümü düz beyazdı ve bir üstündeki program kartlarıyla
        aynı zeminde durduğu için iki bölüm tek uzun blok gibi okunuyordu.
        Degrade yukarıdan aşağı açılıyor: bölüm başlarken beyazdan ayrılıyor,
        biterken footer'ın koyusuna hazırlıyor.

        Izgara koyu hero'daki desenin açık zemin kardeşi (bg-grid-acik) ve
        aynı maske tekniğiyle kenarlarda eritiliyor — kesilen bir ızgara
        çizgisi sayfayı bitmemiş gösteriyor.
      */}
      <section className="relative overflow-hidden border-t border-ink/8 bg-gradient-to-b from-white via-mist to-[#E7ECF8]">
        <div
          className="bg-grid-acik pointer-events-none absolute inset-0"
          style={{
            maskImage: "radial-gradient(120% 100% at 50% 0%, #000 25%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(120% 100% at 50% 0%, #000 25%, transparent 80%)",
          }}
        />
        {/* Marka renginden gelen yumuşak ışık; hero'daki lekenin açık zemin
            karşılığı, çok daha düşük opaklıkta. */}
        <div className="pointer-events-none absolute -top-32 -right-24 h-[460px] w-[460px] rounded-full bg-brand opacity-[0.07] blur-[130px]" />

      <div className="relative mx-auto grid max-w-[1240px] grid-cols-1 gap-16 px-5 sm:px-8 py-24 lg:grid-cols-[0.75fr_1.25fr]">
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
      </div>
      </section>

      <PublicFooter />
    </div>
  );
}
