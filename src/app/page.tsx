import Link from "next/link";
import { Icon } from "@/components/Icon";
import { getCourses } from "@/lib/courses";
import { getYorumlar, getReferanslar } from "@/lib/icerik";
import { ReferansBulutu } from "@/components/site/ReferansBulutu";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { CorporateStrip } from "@/components/site/CorporateStrip";
import { TestimonialCard } from "@/components/site/TestimonialCard";
import type { Metadata } from "next";
import { sayfaMeta } from "@/lib/seo";

const farklar = [
  {
    no: "01",
    baslik: "Gerçek zamanlı birebir",
    metin: "Kalabalık sınıf yok. Ekranınızı paylaşır, kendi hesabınız üzerinde birlikte çalışırız.",
  },
  {
    no: "02",
    baslik: "Ömür boyu destek",
    metin: "Program bittiğinde bağlantı kopmaz. Sonraki kampanyalarınızda da sorularınızı yanıtlıyoruz.",
  },
  {
    no: "03",
    baslik: "Doküman & video desteği",
    metin: "Her ders sonrası şablonlar, kontrol listeleri ve ders kaydı üye alanınıza eklenir.",
  },
  {
    no: "04",
    baslik: "Kişiye özel müfredat",
    metin: "Ön görüşmede işinizi dinleriz; program sektörünüze, seviyenize ve hedefinize göre yazılır.",
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
    etiket: c.etiket,
    sure: c.sure,
    modul: c.modul,
    baslik: c.baslik,
    aciklama: c.aciklama,
    maddeler: c.maddeler.slice(0, 3),
    kapak: c.kapak,
    href: `/egitimler/${c.slug}`,
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

        Alttaki program şeridi hero'nun işini doğrudan yapıyor: ziyaretçi
        "hangi eğitimler var" sorusunu sayfayı kaydırmadan görüyor.
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

        <div className="relative mx-auto flex max-w-[1240px] flex-col items-center px-5 pt-20 text-center sm:px-8 sm:pt-24 lg:pt-28">
          <div className="flex items-center gap-3">
            <span className="h-[5px] w-[5px] flex-none rounded-full bg-[#4D7BFF] shadow-[0_0_0_4px_rgba(77,123,255,0.16)]" />
            <span className="font-mono text-[10.5px] tracking-[0.22em] text-[#8B9AC2] uppercase sm:text-[11px] sm:tracking-[0.26em]">
              Canlı · Birebir · Uygulamalı
            </span>
          </div>

          {/*
            Başlık satırları ELLE kırılıyor (<br />) ama yalnızca geniş
            ekranda: verilen metnin üç satırlık ritmi tasarımın kendisi.
            Dar ekranda aynı kırılma tek kelimelik satırlar üretiyordu, orada
            metin kendi akışına bırakılıyor.
          */}
          <h1 className="mt-8 max-w-[1080px] font-heading text-[40px] leading-[1.03] font-semibold tracking-[-0.042em] text-white sm:text-[62px] lg:text-[82px] lg:leading-[0.98] xl:text-[92px]">
            Dijital pazarlamayı<span className="hidden lg:inline">
              <br />
            </span>{" "}
            izleyerek değil,<span className="hidden lg:inline">
              <br />
            </span>{" "}
            uygulayarak öğrenin.
          </h1>

          <p className="mt-8 max-w-[660px] text-[16.5px] leading-[1.66] text-[#93A0B6] sm:text-[18px] sm:leading-[1.62]">
            Meta Ads, sosyal medya yönetimi ve yapay zekâ eğitimleri; bilgi düzeyinize, hedeflerinize ve kendi
            projelerinize göre birebir planlanır. Canlı derslerde yalnızca öğrenmez, öğrendiklerinizi doğrudan
            uygulamaya geçirirsiniz.
          </p>

          <Link
            href="/egitimler"
            className="group/hero mt-10 inline-flex h-14 items-center gap-[11px] rounded-[10px] bg-brand px-8 text-[16px] font-semibold text-white transition hover:bg-white hover:text-ink"
          >
            Birebir Eğitimleri İnceleyin
            <span className="transition-transform duration-200 group-hover/hero:translate-x-[3px]">→</span>
          </Link>
        </div>

        {/*
          Program şeridi.

          Kart değil şerit: kartlar hero'nun altında ikinci bir bölüm gibi
          duruyordu, ince çizgilerle ayrılmış sütunlar ise hero'nun parçası
          olarak okunuyor. Liste veritabanından geliyor ve sırası panelden
          yönetilen sırayla aynı — vitrin iki yerde ayrı ayrı tanımlanmıyor.
        */}
        <div className="relative mt-24 border-t border-white/[0.07] sm:mt-28">
          <div className="mx-auto flex max-w-[1240px] items-center justify-end px-5 py-[18px] sm:px-8">
            <Link
              href="/egitimler"
              className="font-mono text-[10px] tracking-[0.2em] text-[#7F9BFF] uppercase transition hover:text-white"
            >
              Tümü →
            </Link>
          </div>
          <div className="border-t border-white/[0.07]">
            <div className="mx-auto grid max-w-[1240px] grid-cols-1 sm:grid-cols-3">
              {programs.map((p, i) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className="flex flex-col gap-[10px] border-t border-white/[0.07] px-5 py-7 transition hover:bg-white/[0.03] sm:border-t-0 sm:border-l sm:px-8 sm:first:border-l-0"
                >
                  <span className="font-mono text-[10px] tracking-[0.18em] text-[#5B657B]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-heading text-[19px] leading-[1.25] font-semibold tracking-[-0.02em] text-white sm:text-[20px]">
                    {p.baslik}
                  </span>
                  <span className="text-[13px] leading-[1.5] text-[#7D879C]">{p.etiket}</span>
                </Link>
              ))}
            </div>
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
          <div className="text-left lg:text-right">
            <p className="mb-[14px] max-w-[380px] text-[15.5px] leading-[1.6] text-[#5C6273]">
              Her program online veya Ankara&apos;da yüz yüze ilerler. Müfredat, ön görüşmede işinize göre yeniden
              düzenlenir.
            </p>
            <Link href="/egitimler" className="text-[14.5px] font-semibold">
              Tüm eğitimleri keşfet →
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-[22px] md:grid-cols-3">
          {programs.map((p) => (
            <div
              key={p.baslik}
              className="flex flex-col overflow-hidden rounded-2xl border border-ink/11 bg-white transition hover:-translate-y-[5px] hover:border-brand/45 hover:shadow-[0_22px_46px_rgba(10,13,24,0.12)]"
            >
              {/* Görsel ve başlık da detaya gidiyor; /egitimler kartlarıyla aynı. */}
              <Link
                href={p.href}
                aria-label={`${p.baslik} detayına git`}
                className={`relative flex aspect-video items-end border-b border-ink/8 p-[14px] ${
                  p.kapak ? "bg-cover bg-center" : "placeholder-block"
                }`}
                style={p.kapak ? { backgroundImage: `url(${p.kapak})` } : undefined}
              >
                {!p.kapak && (
                  <span className="rounded-[5px] bg-white/90 px-2 py-[5px] font-mono text-[10px] text-[#656B7A]">
                    program görseli 16:9
                  </span>
                )}
                <span className="absolute top-[14px] left-[14px] rounded-[6px] bg-ink px-[10px] py-[6px] font-mono text-[10px] tracking-[0.1em] text-white uppercase">
                  {p.etiket}
                </span>
              </Link>
              <div className="flex flex-1 flex-col p-[26px] pt-[26px] pb-7">
                {/* Modül sayısı kaldırıldı; gerekçesi EgitimlerFiltre'de. */}
                <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.06em] text-[#6B7080]">
                  <span>{p.sure}</span>
                </div>
                <h3 className="mt-[14px] font-heading text-[23px] leading-[1.2] font-semibold tracking-[-0.025em]">
                  <Link href={p.href} className="transition-colors hover:text-brand">
                    {p.baslik}
                  </Link>
                </h3>
                <p className="mt-[11px] mb-[22px] text-[15px] leading-[1.6] text-[#5C6273]">{p.aciklama}</p>
                <div className="mt-auto flex flex-col gap-[11px] border-t border-ink/8 pt-5">
                  {p.maddeler.map((m) => (
                    <div key={m} className="flex items-start gap-[10px] text-[14.5px] leading-[1.5] text-[#3A3F4F]">
                      <span className="mt-[2px] flex h-4 w-4 flex-none items-center justify-center rounded-[5px] bg-brand/12 text-brand">
                        <Icon name="check" size={11} strokeWidth={3} />
                      </span>
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href={p.href}
                  className="mt-[26px] flex h-[46px] items-center justify-between rounded-[10px] bg-[#F2F4FA] px-[18px] text-[14.5px] font-semibold text-ink hover:bg-brand hover:text-white"
                >
                  <span>Program detayını incele</span>
                  <Icon name="arrowRight" size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Neden birebir */}
      <section id="neden" className="relative overflow-hidden bg-ink text-white">
        <div className="absolute -bottom-55 -left-35 h-[560px] w-[560px] rounded-full bg-brand opacity-16 blur-[130px]" />
        <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8 py-26">
          <div className="flex flex-wrap items-end justify-between gap-12">
            <div className="max-w-[620px]">
              <div className="flex items-center gap-[10px] font-mono text-[11px] tracking-[0.16em] text-[#7FA0FF] uppercase">
                <span className="h-px w-[22px] bg-brand" />
                Fark
              </div>
              <h2 className="mt-[18px] font-heading text-[32px] font-semibold tracking-[-0.035em] sm:text-[46px]">
                Kurs satmıyoruz.
                <br />
                <span className="text-brand">Birlikte çalışıyoruz.</span>
              </h2>
            </div>
            <p className="max-w-[360px] text-[15.5px] leading-[1.65] text-white/60">
              Aynı içeriği herkese anlatan bir platform değiliz. Program, sizin hesabınız ve sizin hedefiniz üzerine
              kurulur.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {farklar.map((f) => (
              <div
                key={f.no}
                className="rounded-[15px] border border-white/12 bg-white/3 p-6 px-6 pt-7 pb-[30px] transition hover:-translate-y-1 hover:border-brand/50 hover:bg-brand/12"
              >
                <div className="font-heading text-[34px] font-semibold tracking-[-0.03em] text-brand">{f.no}</div>
                <h3 className="mt-[22px] text-[19px] leading-[1.3] font-semibold tracking-[-0.02em]">{f.baslik}</h3>
                <p className="mt-[11px] text-[14.5px] leading-[1.65] text-white/60">{f.metin}</p>
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
