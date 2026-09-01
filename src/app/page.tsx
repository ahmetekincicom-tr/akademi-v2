import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { getCourses } from "@/lib/courses";
import { getYorumlar, getReferanslar } from "@/lib/icerik";
import { ReferansBulutu } from "@/components/site/ReferansBulutu";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { CorporateStrip } from "@/components/site/CorporateStrip";
import { ProgramKarti } from "@/components/site/ProgramKarti";
import { TestimonialCard } from "@/components/site/TestimonialCard";
import type { Metadata } from "next";
import { sayfaMeta } from "@/lib/seo";

/*
  Yöntem kartları.

  Sıra numarası (01–04) yerine ikon: numara bir SIRA vaat ediyordu — sanki
  önce birebir ders, sonra destek, sonra kayıt geliyormuş gibi. Oysa bunlar
  aynı anda geçerli dört özellik; sıralanan süreç bir alttaki "Süreç"
  bölümünde zaten var ve numarayı orası kullanıyor.
*/
const farklar: { ikon: IconName; baslik: string; metin: string }[] = [
  {
    ikon: "playCircle",
    baslik: "Canlı ve birebir eğitim",
    metin:
      "Her oturumu yalnızca sizinle gerçekleştiriyor; sorularınızı anında yanıtlıyor, uygulamaları kendi hesabınız üzerinden birlikte yapıyoruz.",
  },
  {
    ikon: "message",
    baslik: "Eğitim sonrası destek",
    metin:
      "Program tamamlandıktan sonra da iletişim devam eder; uygulama sürecinde karşılaştığınız sorularda yalnız kalmazsınız.",
  },
  {
    ikon: "folder",
    baslik: "Ders kayıtları ve kaynaklar",
    metin: "Ders kayıtları, şablonlar, kontrol listeleri ve yardımcı dokümanlar kişisel panelinize eklenir.",
  },
  {
    ikon: "sliders",
    baslik: "Size özel eğitim planı",
    metin:
      "Eğitim içeriği; seviyenize, hedeflerinize, sektörünüze ve geliştirmek istediğiniz yetkinliklere göre hazırlanır.",
  },
];

const surec = [
  {
    no: "1",
    etiket: "Ücretsiz",
    baslik: "Ön görüşme",
    metin: "İşinizi, seviyenizi ve hedefinizi konuşuruz. Hangi programın uyduğunu birlikte netleştiririz.",
  },
  {
    no: "2",
    etiket: "Planlama",
    baslik: "Müfredat kurulumu",
    metin: "Modüller sizin sektörünüze göre yeniden düzenlenir, ders takvimi birlikte belirlenir.",
  },
  {
    no: "3",
    etiket: "Uygulama",
    baslik: "Canlı dersler",
    metin: "Her ders kendi hesabınız üzerinde uygulamayla ilerler; kayıt ve dokümanlar panele düşer.",
  },
  {
    no: "4",
    etiket: "Süresiz",
    baslik: "Ders sonrası destek",
    metin: "Soru-cevap kanalı ve birebir seans takvimiyle uygulama sürecinde yanınızda kalırız.",
  },
];

const panelOzellik = [
  "Ders videoları ve ilerleme takibi",
  "Şablon ve doküman kütüphanesi",
  "Birebir seans randevu takvimi",
  "Soru-cevap destek kanalı",
  "Ödeme ve fatura geçmişi",
  "Yeni eğitim satın alma",
];

const panelKart = [
  { etiket: "Meta Business", deger: "%72 tamamlandı", yuzde: "72%" },
  { etiket: "Sosyal Medya", deger: "%38 tamamlandı", yuzde: "38%" },
  { etiket: "Dokümanlar", deger: "24 dosya", yuzde: "100%" },
  { etiket: "Sonraki seans", deger: "12 Ağustos, 14:00", yuzde: "50%" },
];


function SectionKicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-[10px] font-mono text-[11px] tracking-[0.16em] text-brand uppercase">
      <span className="h-px w-[22px] bg-brand" />
      {children}
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
  baslik: "Birebir Dijital Pazarlama Eğitimleri",
  aciklama:
    "Meta Ads, sosyal medya yönetimi ve yapay zekâ araçlarını birebir öğren. Ankara merkezli, kuruma ve kişiye özel program; eğitim sonrası destek dahil.",
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
      <section className="relative overflow-hidden bg-ink text-white">
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
        <div className="mb-12 flex flex-wrap items-end justify-between gap-10">
          <div>
            <SectionKicker>Programlar</SectionKicker>
            <h2 className="mt-[18px] font-heading text-[32px] font-semibold tracking-[-0.035em] sm:text-[44px]">
              Üç program, tek yöntem
            </h2>
          </div>
          {/*
            Açıklama paragrafı kaldırıldı: format ve müfredat bilgisi hemen
            altındaki kartlarda ve eğitim sayfalarında zaten duruyor. Bölüm
            başlığının karşısına konan üçüncü bir metin, oradaki tek eylemi
            — tüm eğitimlere gitmek — bastırıyordu.

            Bağlantı da düğme oldu: düz mavi bir metin olarak kart
            ızgarasının üstünde kayboluyordu.
          */}
          <Link
            href="/egitimler"
            className="group/tumu inline-flex h-[48px] flex-none items-center gap-[9px] rounded-[11px] border border-ink/15 px-[22px] text-[15px] font-semibold text-ink transition hover:border-ink hover:bg-ink hover:text-white"
          >
            Tüm eğitimleri keşfet
            <Icon
              name="arrowRight"
              size={16}
              className="transition-transform duration-200 group-hover/tumu:translate-x-[3px]"
            />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-[22px] md:grid-cols-3">
          {programs.map((p, i) => (
            /* Vitrin kartı sıradaki ilk program; gerekçesi ProgramKarti'de. */
            <ProgramKarti key={p.slug} p={p} vitrin={i === 0} />
          ))}
        </div>
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
        {/* Üst kenardaki ışık çizgisi: bölümün başladığı yeri işaretliyor. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(103,142,255,0.7)_30%,rgba(103,142,255,0.15)_70%,transparent)]" />
        <div className="bg-nokta-koyu pointer-events-none absolute inset-0 opacity-70" />
        {/* Başlığın arkasındaki tek ışık lekesi. */}
        <div className="pointer-events-none absolute -top-[260px] left-[34%] h-[620px] w-[900px] rounded-full bg-[radial-gradient(closest-side,rgba(61,101,255,0.28),transparent)] blur-[20px]" />

        <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8 py-26">
          <div className="flex flex-wrap items-end justify-between gap-12">
            <div className="max-w-[620px]">
              {/*
                Etiketin yanındaki yanıp sönen nokta kaldırıldı: bölüm
                başlığında sürekli çalışan bir animasyon, "canlı yayın"
                işareti gibi okunuyordu.
              */}
              <div className="flex items-center gap-[14px] font-mono text-[11px] tracking-[0.26em] text-[#7F9BFF] uppercase">
                <span className="h-px w-[44px] bg-brand" />
                Yöntem
              </div>
              {/*
                Başlık iki renkte: tasarımda ikinci satır degrade dolguydu.
                Tek cümlelik başlıkta aynı etkiyi vurgulanan kelimeye
                taşıyoruz — cümlenin tamamı degrade olduğunda koyu zeminde
                okunurluk düşüyor.
              */}
              <h2 className="mt-[30px] font-heading text-[36px] leading-[1.04] font-semibold tracking-[-0.035em] sm:text-[52px]">
                Size özel{" "}
                <span className="bg-[linear-gradient(100deg,#3d65ff_0%,#7f9bff_60%,#b9c8ff_100%)] bg-clip-text text-transparent">
                  bir süreç.
                </span>
              </h2>
            </div>
            <p className="max-w-[420px] text-[16px] leading-[1.68] text-white/60 sm:text-[17px]">
              Aynı içeriği herkese uygulamıyoruz. Eğitim programını mevcut seviyenize, hedeflerinize ve kendi çalışma
              alanınıza göre oluşturuyoruz.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {farklar.map((f) => (
              <div
                key={f.baslik}
                className="group/fark relative overflow-hidden rounded-[20px] border border-white/12 bg-[linear-gradient(180deg,rgba(19,25,44,0.9),rgba(10,13,24,0.9))] px-7 pt-8 pb-9 transition duration-300 hover:-translate-y-[10px] hover:border-brand/50 hover:shadow-[0_30px_70px_-30px_rgba(61,101,255,0.55)]"
              >
                {/* Kart üstündeki ince ışık ve alt köşedeki leke: tasarımın
                    ::before / ::after katmanları. */}
                <span className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-[linear-gradient(90deg,transparent,#3d65ff,transparent)] opacity-35 transition-opacity duration-300 group-hover/fark:opacity-100" />
                <span className="pointer-events-none absolute -right-[110px] -bottom-[140px] h-[260px] w-[260px] rounded-full bg-[radial-gradient(closest-side,rgba(61,101,255,0.35),transparent)] opacity-50" />

                <span className="relative flex h-[46px] w-[46px] items-center justify-center rounded-[13px] border border-brand/35 bg-brand/15 text-[#9DB3FF] transition group-hover/fark:border-brand/60 group-hover/fark:text-white">
                  <Icon name={f.ikon} size={21} strokeWidth={1.7} />
                </span>
                <h3 className="relative mt-7 text-[19px] leading-[1.3] font-semibold tracking-[-0.02em]">{f.baslik}</h3>
                <p className="relative mt-[11px] text-[14.5px] leading-[1.65] text-white/60">{f.metin}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Süreç */}
      <section id="surec" className="mx-auto max-w-[1240px] px-5 sm:px-8 pt-26 pb-24">
        <SectionKicker>Süreç</SectionKicker>
        <h2 className="mt-[18px] mb-12 max-w-[620px] font-heading text-[32px] font-semibold tracking-[-0.035em] sm:text-[44px]">
          Kayıttan sonra nasıl ilerliyoruz
        </h2>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 sm:grid-cols-2 lg:grid-cols-4">
          {surec.map((a) => (
            <div key={a.no} className="bg-white p-[26px] px-[26px] pt-[30px] pb-[34px] transition hover:bg-[#F5F8FF]">
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
      </section>

      {/* Üye alanı preview */}
      <section id="panel" className="border-y border-ink/8 bg-mist">
        <div className="mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-16 px-5 sm:px-8 py-24 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <SectionKicker>Üye alanı</SectionKicker>
            <h2 className="mt-[18px] font-heading text-[32px] leading-[1.1] font-semibold tracking-[-0.035em] sm:text-[42px]">
              Eğitim bittiğinde
              <br />
              erişiminiz bitmiyor.
            </h2>
            <p className="mt-[22px] max-w-[480px] text-[16.5px] leading-[1.62] text-[#5C6273]">
              Katılımcı panelinde ders kayıtlarınız, şablonlar ve kontrol listeleri, birebir seans takviminiz,
              faturalarınız ve soru-cevap kanalı tek yerde toplanır.
            </p>
            <div className="mt-[30px] grid grid-cols-1 gap-x-[26px] gap-y-3 sm:grid-cols-2">
              {panelOzellik.map((o) => (
                <div key={o} className="flex items-start gap-[10px] text-[14.5px] leading-[1.5] text-[#3A3F4F]">
                  <span className="mt-[2px] flex h-4 w-4 flex-none items-center justify-center rounded-[5px] bg-brand/12 text-[10px] font-bold text-brand">
                    ✓
                  </span>
                  <span>{o}</span>
                </div>
              ))}
            </div>
            <div className="mt-[34px] flex items-center gap-[18px]">
              <Link
                href="/giris"
                className="inline-flex h-[50px] items-center gap-[9px] rounded-[10px] bg-ink px-[22px] text-[15.5px] font-semibold text-white hover:bg-brand"
              >
                Panele giriş yap <span>→</span>
              </Link>
              <span className="font-mono text-xs text-[#656B7A]">Katılımcılara özel</span>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-[0_26px_60px_rgba(10,13,24,0.1)]">
            <div className="flex h-10 items-center gap-2 border-b border-ink/8 px-4">
              <span className="h-[9px] w-[9px] rounded-full bg-ink/14" />
              <span className="h-[9px] w-[9px] rounded-full bg-ink/14" />
              <span className="h-[9px] w-[9px] rounded-full bg-ink/14" />
              <span className="ml-3 font-mono text-[10.5px] text-[#656B7A]">panel.ahmetekinciakademi.com</span>
            </div>
            <div className="p-[22px]">
              <div className="flex items-center justify-between gap-5 rounded-xl bg-ink px-[22px] py-5 text-white">
                <div>
                  <div className="font-mono text-[10px] tracking-[0.14em] text-white/50 uppercase">
                    Kaldığın yerden devam et
                  </div>
                  <div className="mt-2 text-[16px] font-semibold">Modül 4 · Kampanya bütçe ölçekleme</div>
                </div>
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-brand text-sm">
                  ▶
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {panelKart.map((k) => (
                  <div key={k.etiket} className="rounded-[11px] border border-ink/10 p-4">
                    <div className="font-mono text-[10px] tracking-[0.1em] text-[#656B7A] uppercase">{k.etiket}</div>
                    <div className="mt-2 text-[15px] font-semibold">{k.deger}</div>
                    <div className="mt-3 h-[5px] overflow-hidden rounded-full bg-ink/8">
                      <div className="h-full rounded-full bg-brand" style={{ width: k.yuzde }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="yorumlar" className="mx-auto max-w-[1240px] px-5 sm:px-8 pt-26 pb-24">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-10">
          <div>
            <SectionKicker>Katılımcı yorumları</SectionKicker>
            <h2 className="mt-[18px] font-heading text-[32px] font-semibold tracking-[-0.035em] sm:text-[44px]">
              Eğitimden sonra ne değişti
            </h2>
          </div>
          <Link href="/yorumlar" className="text-[14.5px] font-semibold whitespace-nowrap">
            Tüm yorumlar →
          </Link>
        </div>
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

      <CorporateStrip text="Ekibinize özel, yerinde ya da uzaktan dijital pazarlama eğitimi." />


      {/* Closing CTA */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="absolute -top-45 right-[10%] h-[520px] w-[520px] rounded-full bg-brand opacity-22 blur-[120px]" />
        <div className="relative mx-auto flex max-w-[1240px] flex-wrap items-end justify-between gap-14 px-5 sm:px-8 py-26">
          <h2 className="max-w-[660px] font-heading text-[32px] leading-[1.05] font-semibold tracking-[-0.04em] sm:text-[48px]">
            Hangi programın size uyduğunu <span className="text-brand">konuşarak</span> bulalım.
          </h2>
          <Link
            href="#egitimler"
            className="inline-flex h-14 items-center gap-[10px] rounded-[11px] bg-brand px-7 text-[16.5px] font-semibold text-white shadow-[0_12px_32px_rgba(28,86,243,0.4)] hover:bg-white hover:text-ink"
          >
            Eğitimleri incele <span>→</span>
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
