import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { getCourses } from "@/lib/courses";
import { getYorumlar, getReferanslar } from "@/lib/icerik";
import { ReferansBulutu } from "@/components/site/ReferansBulutu";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { ProgramKarti } from "@/components/site/ProgramKarti";
import { TestimonialCard } from "@/components/site/TestimonialCard";
import type { Metadata } from "next";
import { sayfaMeta } from "@/lib/seo";
import { otomatikSeo } from "@/lib/sayfa-seo";

/*
  "Neler Sunuyoruz?" kartları.

  Her biri ikonuyla anlatılan, aynı anda geçerli dört imkân — sıralı bir süreç
  değil (o bir alttaki "Süreç Nasıl İlerliyor?" bölümünde).
*/
const farklar: { ikon: IconName; baslik: string; metin: string }[] = [
  {
    ikon: "playCircle",
    baslik: "Canlı ve Birebir Eğitim",
    metin:
      "Her oturumu yalnızca sizinle gerçekleştiriyor; sorularınızı anında yanıtlıyor, uygulamaları kendi hesabınız üzerinden birlikte yapıyoruz.",
  },
  {
    ikon: "grid",
    baslik: "Üye Paneline Erişim",
    metin:
      "Eğitim öncesi ve sonrası tüm sürecinizi üye panelinizden organize edebilir, dokümanlarınıza ve kayıtlarınıza 7/24 ücretsiz ulaşabilir, eğitmen ile iletişimde kalabilirsiniz.",
  },
  {
    ikon: "sliders",
    baslik: "Size Özel Eğitim Planı",
    metin:
      "Eğitim öncesi tamamlayacağınız ön değerlendirme testi; eğitimin seviyenize, hedeflerinize ve işinize uygun şekilde özelleştirilmesine imkân sağlar.",
  },
  {
    ikon: "message",
    baslik: "Ömür Boyu Destek",
    metin:
      "Eğitiminiz tamamlandıktan sonra ömür boyu destek süreciniz başlar. WhatsApp, e-posta ya da üye paneliniz üzerinden eğitmen ile iletişimde kalmaya devam edebilirsiniz.",
  },
];

/*
  Süreç adımları.

  Numara ve küçük etiket kaldırıldı; her adım artık kendi ikonuyla anlatılıyor.
  Üç adım: ön görüşme, planlama, başlangıç.
*/
const surec: { ikon: IconName; baslik: string; metin: string }[] = [
  {
    ikon: "message",
    baslik: "Ön görüşme",
    metin: "İşinizi, seviyenizi ve hedefinizi konuşuruz. Hangi programın uyduğunu birlikte netleştiririz.",
  },
  {
    ikon: "calendar",
    baslik: "Planlama",
    metin: "Modüller sizin sektörünüze göre yeniden düzenlenir, ders takviminiz birlikte belirlenir.",
  },
  {
    ikon: "playCircle",
    baslik: "Başlangıç",
    metin: "Size bildirilen katılım bağlantısı üzerinden, planlanan gün ve saatte eğitime katılım sağlarsınız.",
  },
];

/**
 * Bölüm başlığı — ana sayfadaki TÜM bölümlerin ortak başlık düzeni.
 *
 * Tek bir bileşen: başlıklar eskiden her bölümde ayrı ayrı yazılıyordu ve
 * boyutları, hizaları, altlarındaki metin birbirinden kopuyordu. Standart
 * burada: dar ekranda ORTALI ve büyük (40px), geniş ekranda sola yaslı
 * (46px); başlığın hemen altında iki satırlık bir açıklama. İsteğe bağlı
 * `aksiyon` (geniş ekran düğmesi) başlığın karşısında durur.
 *
 * `koyu`: koyu zeminli bölümlerde (Yöntem) metin renklerini açar.
 */
function BolumBasligi({
  baslik,
  aciklama,
  koyu = false,
  aksiyon,
}: {
  baslik: React.ReactNode;
  aciklama: string;
  koyu?: boolean;
  aksiyon?: React.ReactNode;
}) {
  return (
    <div className="mb-9 flex flex-col gap-6 sm:mb-12 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
      <div className="w-full sm:max-w-[640px]">
        <h2
          className={`text-center font-heading text-[40px] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-left sm:text-[46px] sm:leading-[1.05] ${
            koyu ? "text-white" : "text-ink"
          }`}
        >
          {baslik}
        </h2>
        <p
          className={`mx-auto mt-[14px] max-w-[520px] text-center text-[15.5px] leading-[1.6] text-pretty sm:mx-0 sm:mt-[18px] sm:max-w-[620px] sm:text-left sm:text-[16.5px] ${
            koyu ? "text-white/60" : "text-[#5C6273]"
          }`}
        >
          {aciklama}
        </p>
      </div>
      {aksiyon}
    </div>
  );
}

/*
  Sayfa önbelleğe alınıyor, her istekte yeniden üretilmiyor.

  force-dynamic doğru bir başlangıçtı: içerik panelden düzenleniyor ve
  "kaydettim ama sitede değişmedi" en can sıkıcı hata. Ama bedeli her
  ziyaretçi için bir veritabanı turu ve bu sayfaların içeriği günde bir
  değişmiyor.

  Anında güncelleme kaybolmuyor: yönetim eylemleri kaydettikten sonra
  revalidatePath çağırıyor, yani düzenleme yapıldığı anda sayfa yenileniyor.
  Buradaki süre yalnızca "hiç kimse bir şey düzenlemezse en geç ne zaman
  tazelensin" sorusunun cevabı.
*/
export const revalidate = 3600;

// Paylaşım görseli panelden okunduğu için metadata istek anında üretiliyor.
export function generateMetadata(): Promise<Metadata> {
  return sayfaMeta({
  // Metinler tek kaynakta: src/lib/sayfa-seo.ts. Panel de aynı yerden
  // okuyor — iki yere yazılsaydı biri değiştiğinde diğeri sessizce eskir.
  ...otomatikSeo("/"),
  yol: "/",
});
}

export default async function HomePage() {
  const [courses, logos, siteYorumlari] = await Promise.all([getCourses(), getReferanslar(), getYorumlar()]);
  const yorumlar = siteYorumlari.slice(0, 6).map((y) => ({ metin: y.metin, isim: y.isim, rol: y.rol }));
  const programs = courses.slice(0, 3).map((c) => ({
    slug: c.slug,
    etiket: c.etiket,
    sure: c.sure,
    baslik: c.baslik,
    aciklama: c.aciklama,
    maddeler: c.maddeler.slice(0, 3),
    kapak: c.kapak,
    yeni: c.yeni,
    cokYakinda: c.cokYakinda,
  }));

  return (
    <div className="bg-white">
      <PublicHeader />

      {/*
        Hero.

        Tek sütun ve ORTALI: iki sütunluydu, sağda yörünge animasyonu ve iki
        yüzen kart vardı. O sütun başlığın alanını yarıya indiriyordu ve
        mobilde zaten alta düşüp uzun bir boşluk oluşturuyordu. Tek sütunda
        başlık gerçekten büyüyebiliyor — hero'nun taşıdığı şey o cümle.

        Program listesi hero'da DEĞİL: eğitim adları hem hemen altındaki
        programlar bölümünde hem eğitimler sayfasında duruyor. Hero'da üçüncü
        kez saymak, tek bir cümleye odaklanan bu düzenin kendisini bozuyordu.
      */}
      {/*
        Hero, saydam başlığın ALTINA kayıyor: negatif üst boşlukla kendini
        başlık yüksekliği (--baslik-h) kadar yukarı çekip aynı miktarda üst
        dolgu veriyor. Böylece koyu zemin, ana sayfa üstündeki saydam başlığın
        arkasını dolduruyor; içerik yeri değişmiyor (mt ile pt birbirini götürür).
      */}
      <section className="relative mt-[calc(var(--baslik-h,76px)*-1)] overflow-hidden bg-ink pt-[var(--baslik-h,76px)] text-white">
        {/*
          Tek ışık kaynağı başlığın arkasında.

          Izgara dokusu ve ikinci bir renk lekesi kaldırıldı: üst üste binen
          efektler koyu zemini "ucuz" gösteriyordu. Kalan degrade yukarıdan
          aşağı sönüyor, başlığı öne çıkarıyor.
        */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(90% 70% at 50% -20%, rgba(28,86,243,0.20) 0%, rgba(10,13,24,0) 62%)",
          }}
        />

        {/*
          Alt boşluk burada: hero'nun altında program şeridi vardı ve dip
          payını o veriyordu. Şerit kaldırılınca düğme doğrudan kenara
          yapışıyordu.
        */}
        <div className="relative mx-auto flex max-w-[1240px] flex-col items-center px-5 pt-20 pb-24 text-center sm:px-8 sm:pt-24 sm:pb-28 lg:pt-28 lg:pb-32">
          {/*
            Hero etiketi.

            Önceki hâli mono, tümü büyük harf, çok geniş harf aralıklı bir
            "CANLI · BİREBİR · UYGULAMALI" satırıydı ve yanında ışıklı bir
            nokta duruyordu. Üçü de bugün her yazılım sitesinde aynı yerde
            duran işaretler; birlikte, söyledikleri şeyden çok "şablon"
            hissi veriyorlardı.

            Yerine cümle: rozetin içinde normal harflerle yazılmış, gerçek
            bilgi taşıyan bir satır. Aynı üç kelime kalıyor ama slogan
            olarak değil, cümlenin parçası olarak.
          */}
          <div className="inline-flex max-w-full items-center gap-[9px] rounded-full border border-white/12 bg-white/[0.045] py-[7px] pr-[16px] pl-[13px] text-[13px] text-[#A7B4CC] sm:text-[13.5px]">
            <Icon name="playCircle" size={15} className="flex-none text-[#7FA0FF]" strokeWidth={1.7} />
            <span>
              Canlı, birebir ve <span className="font-semibold text-white">tamamen uygulamalı</span>
            </span>
          </div>

          {/*
            Başlık satırları ELLE kırılıyor (<br />) ama yalnızca geniş
            ekranda: verilen metnin üç satırlık ritmi tasarımın kendisi.
            Dar ekranda aynı kırılma tek kelimelik satırlar üretiyordu, orada
            metin kendi akışına bırakılıyor.
          */}
          {/* Dar ekranda başlık 40 → 46px: hero'nun taşıdığı şey bu cümle,
              alt metin ve rozet ise ona eşlik ediyor. */}
          <h1 className="mt-7 max-w-[1080px] font-heading text-[46px] leading-[1.02] font-semibold tracking-[-0.042em] text-white sm:mt-8 sm:text-[62px] lg:text-[82px] lg:leading-[0.98] xl:text-[92px]">
            Dijital pazarlamayı<span className="hidden lg:inline">
              <br />
            </span>{" "}
            izleyerek değil,<span className="hidden lg:inline">
              <br />
            </span>{" "}
            uygulayarak öğrenin.
          </h1>

          {/* Alt metin dar ekranda küçüldü (16.5 → 15px): büyüyen başlığın
              yanında neredeyse aynı ağırlıkta duruyordu, ikisi birbiriyle
              yarışıyordu. */}
          <p className="mt-6 max-w-[660px] text-[15px] leading-[1.62] text-[#93A0B6] sm:mt-8 sm:text-[18px]">
            Meta Ads, sosyal medya yönetimi ve yapay zekâ eğitimleri; bilgi düzeyinize, hedeflerinize ve kendi
            projelerinize göre birebir planlanır. Canlı derslerde yalnızca öğrenmez, öğrendiklerinizi doğrudan
            uygulamaya geçirirsiniz.
          </p>

          {/*
            İki düğme.

            Sarmalanan satır: iki düğme yan yana sığdığı sürece yan yana
            duruyor, sığmadığı an ikisi de tam genişliğe geçip alt alta
            diziliyor. `grow basis-[190px]` tam olarak bunu yapıyor — sabit
            bir kırılma noktası vermek, 390px'te sığan düğmeleri 400px'te
            gereksizce alt alta atıyordu.

            İkincisi çerçeveli ve ikonlu değil: iki dolu düğme iki eşit
            eylem demek olurdu, oysa asıl istenen tıklama eğitimler.
          */}
          <div className="mt-9 flex w-full max-w-[420px] flex-wrap justify-center gap-[10px] sm:mt-10 sm:max-w-none sm:gap-3">
            <Link
              href="/egitimler"
              className="group/hero inline-flex h-[50px] grow basis-[190px] items-center justify-center gap-[9px] rounded-[10px] bg-brand whitespace-nowrap px-6 text-[15px] font-semibold text-white transition hover:bg-white hover:text-ink sm:grow-0 sm:basis-auto sm:text-[15.5px]"
            >
              Birebir Eğitimler
              <Icon
                name="arrowRight"
                size={17}
                className="transition-transform duration-200 group-hover/hero:translate-x-[3px]"
              />
            </Link>
            <Link
              href="/yorumlar"
              className="inline-flex h-[50px] grow basis-[190px] items-center justify-center gap-[9px] rounded-[10px] border whitespace-nowrap border-white/18 px-6 text-[15px] font-semibold text-white/85 transition hover:border-white hover:bg-white hover:text-ink sm:grow-0 sm:basis-auto sm:text-[15.5px]"
            >
              <Icon name="message" size={17} strokeWidth={1.8} />
              Yorumlar
            </Link>
          </div>
        </div>

      </section>

      <ReferansBulutu referanslar={logos} />

      {/* Programs */}
      <section id="egitimler" className="mx-auto max-w-[1240px] px-5 sm:px-8 pt-26 pb-24">
        {/*
          Başlık standardı BolumBasligi'nde; buradaki tek özel şey geniş
          ekran düğmesi. Düğme dar ekranda gizli — kartların altında ikinci
          bir kopya var (aşağıda), çünkü tek sütuna inen düzende "hepsini
          gör" düğmesi programlardan önce değil sonra anlamlı.
        */}
        <BolumBasligi
          baslik="Birebir Eğitimler"
          aciklama="Meta Ads, sosyal medya ve yapay zekâ programları; her biri canlı, birebir ve doğrudan kendi projeleriniz üzerinden ilerliyor."
          aksiyon={
            <Link
              href="/egitimler"
              className="group/tumu hidden h-[48px] flex-none items-center gap-[9px] rounded-[11px] border border-ink/15 px-[22px] text-[15px] font-semibold text-ink transition hover:border-ink hover:bg-ink hover:text-white sm:inline-flex"
            >
              Tüm eğitimleri keşfet
              <Icon
                name="arrowRight"
                size={16}
                className="transition-transform duration-200 group-hover/tumu:translate-x-[3px]"
              />
            </Link>
          }
        />
        <div className="grid grid-cols-1 gap-[22px] md:grid-cols-3">
          {programs.map((p, i) => (
            /* Vitrin kartı sıradaki ilk program; gerekçesi ProgramKarti'de. */
            <ProgramKarti key={p.slug} p={p} vitrin={i === 0} />
          ))}
        </div>

        {/* Dar ekrandaki kopya; gerekçesi yukarıdaki düğmenin yanında. */}
        <Link
          href="/egitimler"
          className="group/tumu mt-6 flex h-[50px] items-center justify-center gap-[9px] rounded-[11px] border border-ink/15 px-[22px] text-[15px] font-semibold text-ink transition hover:border-ink hover:bg-ink hover:text-white sm:hidden"
        >
          Tüm eğitimleri keşfet
          <Icon
            name="arrowRight"
            size={16}
            className="transition-transform duration-200 group-hover/tumu:translate-x-[3px]"
          />
        </Link>
      </section>

      {/*
        Yöntem ("1A" tasarımı).

        Zemin düz koyu renk değil, sol üstten gelen bir radyal degrade; bölüm
        böylece hero ile aynı aileden ama aynısı değil. Üstündeki ince ışık
        çizgisi bölümü açıyor, nokta dokusu yüzeye derinlik veriyor.

        Nokta dokusu HAREKETSİZ: tasarımda yavaşça kayıyordu, ama bu bölüm
        sayfanın ortasında ve arka planda süren bir hareket, okunan metnin
        arkasında kıpırdayan bir doku olarak dikkat çekiyor.
      */}
      <section
        id="neden"
        className="relative overflow-hidden bg-ink text-white"
        style={{
          backgroundImage:
            "radial-gradient(120% 90% at 8% 0%, #101a3a 0%, #080b16 45%, #05070d 100%)",
        }}
      >
        <div className="bg-nokta-koyu pointer-events-none absolute inset-0 opacity-70" />
        {/* Başlığın arkasındaki tek ışık lekesi. */}
        <div className="pointer-events-none absolute -top-[260px] left-[34%] h-[620px] w-[900px] rounded-full bg-[radial-gradient(closest-side,rgba(61,101,255,0.28),transparent)] blur-[20px]" />

        <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8 py-20 sm:py-26">
          {/*
            Başlık standardı BolumBasligi'nde (koyu sürüm). Başlıktaki degrade
            vurgu bu bölüme özel: cümlenin tamamı degrade olunca koyu zeminde
            okunurluk düşüyordu, o yüzden yalnızca vurgulanan kelime.
          */}
          <BolumBasligi
            koyu
            baslik={
              <>
                Neler{" "}
                <span className="bg-[linear-gradient(100deg,#3d65ff_0%,#7f9bff_60%,#b9c8ff_100%)] bg-clip-text text-transparent">
                  Sunuyoruz?
                </span>
              </>
            }
            aciklama="Aynı içeriği herkese uygulamıyoruz; programı mevcut seviyenize, hedeflerinize ve kendi çalışma alanınıza göre oluşturuyoruz."
          />

          {/* Kart aralıkları dar ekranda daraltıldı; başlıkla aradaki boşluğu
              artık BolumBasligi'nin alt boşluğu veriyor. */}
          <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {farklar.map((f) => (
              <div
                key={f.baslik}
                className="group/fark relative overflow-hidden rounded-[20px] border border-white/12 bg-[linear-gradient(180deg,rgba(19,25,44,0.9),rgba(10,13,24,0.9))] px-6 pt-7 pb-7 transition duration-300 hover:-translate-y-[10px] hover:border-brand/50 hover:shadow-[0_30px_70px_-30px_rgba(61,101,255,0.55)] sm:px-7 sm:pt-8 sm:pb-9"
              >
                {/* Alt köşedeki yumuşak leke; üstteki parlayan çizgi kaldırıldı. */}
                <span className="pointer-events-none absolute -right-[110px] -bottom-[140px] h-[260px] w-[260px] rounded-full bg-[radial-gradient(closest-side,rgba(61,101,255,0.35),transparent)] opacity-50" />

                <span className="relative flex h-[46px] w-[46px] items-center justify-center rounded-[13px] border border-brand/35 bg-brand/15 text-[#9DB3FF] transition group-hover/fark:border-brand/60 group-hover/fark:text-white">
                  <Icon name={f.ikon} size={21} strokeWidth={1.7} />
                </span>
                <h3 className="relative mt-5 text-[19px] leading-[1.3] font-semibold tracking-[-0.02em] sm:mt-7">{f.baslik}</h3>
                <p className="relative mt-[10px] text-[14.5px] leading-[1.65] text-white/60">{f.metin}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Süreç */}
      <section id="surec" className="mx-auto max-w-[1240px] px-5 sm:px-8 pt-26 pb-24">
        <BolumBasligi
          baslik="Süreç Nasıl İlerliyor?"
          aciklama="Eğitimler birebir gerçekleştiği için her katılımcının uygunluk durumu ve hedeflerine uygun bir planlama yapılır. Tüm süreci üye panelinizden yürütebilirsiniz."
        />
        {/* Üç adım: numara/etiket yerine her adımın kendi ikonu (büyük). */}
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 sm:grid-cols-2 lg:grid-cols-3">
          {surec.map((a) => (
            <div key={a.baslik} className="bg-white p-[26px] pt-[30px] pb-[34px] transition hover:bg-[#F5F8FF]">
              <span className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-brand/10 text-brand">
                <Icon name={a.ikon} size={26} strokeWidth={1.8} />
              </span>
              <h3 className="mt-6 text-[19px] leading-[1.3] font-semibold tracking-[-0.02em]">{a.baslik}</h3>
              <p className="mt-[10px] text-[14.5px] leading-[1.65] text-pretty text-[#5C6273]">{a.metin}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="yorumlar" className="mx-auto max-w-[1240px] px-5 sm:px-8 pt-26 pb-24">
        {/*
          Başlık ve alt metin standardı BolumBasligi'nde; /yorumlar sayfasıyla
          aynı başlık ve açıklama (uyumlu olsunlar). Geniş ekran düğmesi
          başlığın karşısında; dar ekranda gizli — mobilde kopyası yorumların
          hemen üstünde ortalı (aşağıda).
        */}
        <BolumBasligi
          baslik="Katılımcı Yorumları"
          aciklama="Eğitime katılan katılımcıların, eğitim sonrası yorumları."
          aksiyon={
            <Link
              href="/yorumlar"
              className="group/tumu hidden h-[48px] flex-none items-center gap-[9px] rounded-[11px] border border-ink/15 px-[22px] text-[15px] font-semibold text-ink transition hover:border-ink hover:bg-ink hover:text-white sm:inline-flex"
            >
              Tüm yorumları gör
              <Icon
                name="arrowRight"
                size={16}
                className="transition-transform duration-200 group-hover/tumu:translate-x-[3px]"
              />
            </Link>
          }
        />

        {/* Dar ekran kopyası: yorumların en üstünde, ortalı. */}
        <Link
          href="/yorumlar"
          className="group/tumu mb-7 flex h-[50px] items-center justify-center gap-[9px] rounded-[11px] border border-ink/15 px-[22px] text-[15px] font-semibold text-ink transition hover:border-ink hover:bg-ink hover:text-white sm:hidden"
        >
          Tüm yorumları gör
          <Icon
            name="arrowRight"
            size={16}
            className="transition-transform duration-200 group-hover/tumu:translate-x-[3px]"
          />
        </Link>

        {/* Izgara değil sütun: satır yüksekliği en uzun karta göre belirlenip
            kısa yorumların altında boşluk bırakıyordu. */}
        <div className="columns-1 gap-[22px] md:columns-2 lg:columns-3">
          {yorumlar.map((y) => (
            <div key={y.isim} className="mb-[22px] break-inside-avoid">
              <TestimonialCard {...y} />
            </div>
          ))}
        </div>
      </section>

      {/*
        Tek kapanış CTA'sı.

        Önceden burada arka arkaya İKİ eğitim çağrısı vardı: mavi "Kurumsal"
        şeridi (/kurumsal) ve hemen altında koyu "Eğitimleri incele"
        (#egitimler). İki blok yan yana yarışıp ziyaretçiyi iki farklı eğitim
        yoluna aynı anda çağırıyordu. Artık tek blok: ASIL eylem bireysel
        eğitim, hemen altında İKİNCİL bir kurumsal bağlantı — hiyerarşi net.
        (Kurumsal erişim menü, footer ve /kurumsal sayfasında sürüyor.)
      */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="absolute -top-45 right-[10%] h-[520px] w-[520px] rounded-full bg-brand opacity-22 blur-[120px]" />
        <div className="relative mx-auto flex max-w-[860px] flex-col items-center gap-8 px-5 sm:px-8 py-24 text-center sm:py-28 sm:gap-9">
          <h2 className="font-heading text-[34px] leading-[1.1] font-semibold tracking-[-0.04em] sm:text-[54px] sm:leading-[1.05]">
            Hangi programın size uyduğunu <span className="text-brand">konuşarak</span> bulalım.
          </h2>
          <div className="flex flex-col items-center gap-5">
            <Link
              href="#egitimler"
              className="group/cta inline-flex h-14 items-center gap-[10px] rounded-[11px] bg-brand px-8 text-[16.5px] font-semibold text-white shadow-[0_12px_32px_rgba(28,86,243,0.4)] transition hover:bg-white hover:text-ink"
            >
              Eğitimleri incele
              <Icon name="arrowRight" size={17} className="transition-transform duration-200 group-hover/cta:translate-x-[3px]" />
            </Link>
            {/* İkincil eylem: ekipler için kurumsal. Düz metin bağlantı —
                asıl düğmeyle yarışmasın. */}
            <Link
              href="/kurumsal"
              className="group/kurumsal inline-flex items-center gap-[7px] text-[14.5px] font-medium text-white/65 transition hover:text-white sm:text-[15px]"
            >
              Ekibiniz için mi? Kurumsal eğitim planı oluşturun
              <Icon
                name="arrowRight"
                size={15}
                className="transition-transform duration-200 group-hover/kurumsal:translate-x-[3px]"
              />
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
