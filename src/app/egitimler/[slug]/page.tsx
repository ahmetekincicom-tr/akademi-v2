import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { FaqAccordion } from "@/components/site/FaqAccordion";
import { SectionKicker } from "@/components/site/SectionKicker";
import { CurriculumAccordion } from "@/components/site/CurriculumAccordion";
import { HeroDegerler } from "@/components/site/HeroDegerler";
import { KalinMetin } from "@/components/site/KalinMetin";
import { ProgramGoruntulendi } from "@/components/site/ProgramGoruntulendi";
import { Icon, type IconName } from "@/components/Icon";
import { getCourseBySlug, egitmenStats, basligiParcala } from "@/lib/courses";
import { getSiteIcerik } from "@/lib/site-icerik";
import { olculenWhatsapp } from "@/lib/iletisim";
import { sayfaMeta, egitimSemasi, kirintiSemasi, sssSemasi } from "@/lib/seo";

// Gerekçe: src/app/page.tsx
export const revalidate = 3600;

/**
 * Yan kutuda listelenen program kapsamı.
 *
 * Yerini aldığı şey künye satırlarıydı (süre, format, yer, ödeme). Onlar
 * programı TARİF ediyordu; buradakiler ne alındığını söylüyor. Süre bilgisi
 * kaybolmuyor — hero'daki değer hapları ve müfredat zaten onu taşıyor.
 */
const PROGRAM_KAPSAMI: { ad: string; ikon: IconName }[] = [
  { ad: "Kişiye Özel Eğitim", ikon: "user" },
  { ad: "Ömür Boyu Destek", ikon: "message" },
  { ad: "Ömür Boyu Güncelleme", ikon: "sparkle" },
  { ad: "Doküman Desteği", ikon: "file" },
  { ad: "Üye Paneline Erişim Hakkı", ikon: "grid" },
  { ad: "WhatsApp Grubuna Katılım Hakkı", ikon: "whatsapp" },
  { ad: "CRM Sistemi Kurulum Desteği", ikon: "plug" },
];

/** Eğitmen adının baş harfleri; portre alanı olmadığı için avatar yerine geçiyor. */
function basHarfler(ad: string) {
  return ad
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toLocaleUpperCase("tr") ?? "")
    .join("");
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return { title: "Eğitim bulunamadı", robots: { index: false, follow: true } };

  return sayfaMeta({
    baslik: course.baslik,
    // Açıklama arama sonucunda tıklanma kararını veren metin; kartlardaki
    // kısa özet yerine kapsamı anlatan hero metnini tercih ediyoruz.
    aciklama: (course.heroAciklama || course.aciklama).slice(0, 300),
    yol: `/egitimler/${course.slug}`,
  });
}

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const icerik = await getSiteIcerik();

  // Hero başlığı eğitimin tam adı; vurgulanan kısım renkli yazılıyor.
  const parca = basligiParcala(course.baslik, course.baslikVurgu);

  // Panelden gelen serbest metin: boş satır paragraf ayırıcı. Yalnızca
  // boşluktan oluşan satırlar da ayırıcı sayılıyor, aksi halde panele
  // yapıştırılan metinde görünmez bir boşluk paragrafları birleştiriyor.
  const tanitimParagraflari = course.tanitimMetni
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  // Yapısal veri: eğitimi "Course" olarak işaretliyor ve arama sonucunda
  // kırıntı yolunu veriyor. İçerik bizim ürettiğimiz nesne.
  const semalar = [
    egitimSemasi({
      slug: course.slug,
      baslik: course.baslik,
      aciklama: course.heroAciklama || course.aciklama,
      sure: course.sure,
      kapak: course.kapak,
    }),
    kirintiSemasi([
      { ad: "Ana sayfa", yol: "/" },
      { ad: "Eğitimler", yol: "/egitimler" },
      { ad: course.baslik, yol: `/egitimler/${course.slug}` },
    ]),
    // Sayfada gösterilen soru-cevapların aynısı; işaretlenmemiş bir SSS
    // bölümü arama sonucunda da yapay zekâ cevaplarında da görünmüyor.
    ...(course.sss.length > 0 ? [sssSemasi(course.sss)] : []),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(semalar) }}
      />
      <ProgramGoruntulendi baslik={course.baslik} />
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
        <div className="absolute -top-45 -right-25 h-[600px] w-[600px] rounded-full bg-brand opacity-18 blur-[120px]" />
        <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8 pt-9 pb-22">
          <div className="flex items-center gap-[10px] font-mono text-[11px] tracking-[0.08em] text-white/45">
            <Link href="/" className="text-white/45 hover:text-white">
              Ana sayfa
            </Link>
            <span>/</span>
            <Link href="/egitimler" className="text-white/45 hover:text-white">
              Eğitimler
            </Link>
            <span>/</span>
            {/* Kırıntı yolu da eğitimin tam adını gösteriyor: vurgu alanı
                yalnızca renklendirme içindi ve zamanla addan kopabiliyor. */}
            <span className="text-white/80">{course.baslik}</span>
          </div>
          <div className="mt-10 grid grid-cols-1 items-start gap-16 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="animate-rise">
              {/* Kayıt duyurusu: beyaz kutu, çerçevesi yavaşça mavi yanıp söner.
                  Metni ve görünürlüğü yönetim panelindeki Duyuru ve eğitmen ekranından yönetilir. */}
              {icerik.kayitDuyurusuAktif && icerik.kayitDuyurusu && (
                <div
                  className={
                    icerik.duyuruStili === "koyu"
                      ? "duyuru-koyu mb-7 inline-block max-w-full"
                      : "duyuru-parlak mb-7 inline-block max-w-full rounded-[13px] px-[18px] py-[13px]"
                  }
                >
                  <span
                    className={
                      icerik.duyuruStili === "koyu"
                        ? ""
                        : "text-[14px] leading-[1.45] font-semibold tracking-[-0.01em] sm:text-[15.5px]"
                    }
                  >
                    {icerik.kayitDuyurusu}
                  </span>
                </div>
              )}
              {/*
                Vurgu artık mavi değil beyaz. Hero zemini neredeyse siyah ve
                marka mavisi orada okunurluğu düşürüyordu: başlığın ortasındaki
                iki kelime geri çekiliyor, göz onları arka planla karıştırıyordu.
                Vurgu görevini punto ve konum zaten yapıyor.
              */}
              <h1 className="font-heading text-[44px] leading-[1.05] font-semibold tracking-[-0.04em] sm:text-[48px] lg:text-[56px] lg:leading-[1.04]">
                {parca.once}
                {parca.vurgu}
                {parca.sonra}
              </h1>
              {/*
                19px hero başlığının hemen altında fazla iriydi: başlıkla
                yarışıyor, ikisi arasındaki hiyerarşi kayboluyordu. 16.5/17.5
                okunurluğu bozmadan başlığa alan bırakıyor.

                `**...**` ile işaretlenen yerler kalın basılıyor; metin panelden
                giriliyor ve satış cümlesinin bir yerini öne çıkarabilmek
                gerekiyor.
              */}
              <p className="mt-5 max-w-[560px] text-[16.5px] leading-[1.62] text-white/65 sm:text-[17.5px]">
                <KalinMetin metin={course.heroAciklama} />
              </p>
              <HeroDegerler />
            </div>
            {/*
              Kapak görseli dar ekranda GİZLİ.

              Mobilde tek sütuna düşüp başlıkla eylem arasına giriyor, ekranın
              tamamına yakınını kaplıyor ve okuyucuyu asıl mesajdan uzaklaştırıyordu.
              Geniş ekranda yanda durduğu için aynı sorun yok.
            */}
            <div
              className={`relative hidden aspect-[4/3] items-end overflow-hidden rounded-2xl p-5 lg:flex ${
                course.kapak ? "bg-cover bg-center" : "placeholder-block-dark"
              }`}
              style={course.kapak ? { backgroundImage: `url(${course.kapak})` } : undefined}
            >
              {!course.kapak && (
                <span className="rounded-[7px] bg-ink/72 px-[11px] py-[7px] font-mono text-[11px] tracking-[0.08em] text-white/60">
                  program kapak görseli 4:3
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-16 px-5 sm:px-8 lg:grid-cols-[1fr_380px]">
        <main className="min-w-0 py-20 pb-24">
          {/*
            Hero'nun hemen altında serbest tanıtım metni.

            Önceden burada doğrudan kazanım maddeleri başlıyordu: sayfa,
            eğitimin ne olduğunu bir cümleyle bile anlatmadan madde listesine
            geçiyordu. Metin panelden giriliyor, boşsa bölüm hiç basılmıyor.
          */}
          {tanitimParagraflari.length > 0 && (
            <section className="mb-22 max-w-[720px]">
              {tanitimParagraflari.map((p, i) => (
                <p
                  key={i}
                  className="mt-[18px] text-[16.5px] leading-[1.75] text-[#3A3F4F] first:mt-0 sm:text-[17px]"
                >
                  <KalinMetin metin={p} kalinSinif="text-ink" />
                </p>
              ))}
            </section>
          )}

          <section id="mufredat">
            <CurriculumAccordion modules={course.modules} />
          </section>



          {/*
            Eğitmen bölümü YALNIZCA dar ekranda.

            Geniş ekranda aynı bilgi sağdaki yapışkan kutuda duruyor; ikisi
            birden açıkken sayfa aynı kişiyi iki kez tanıtıyordu. Mobilde yan
            sütun olmadığı için bölüm burada kalmak zorunda.
          */}
          <section id="egitmen" className="mt-22 lg:hidden">
            <div className="grid grid-cols-1 overflow-hidden rounded-[18px] border border-ink/11 md:grid-cols-[260px_1fr]">
              {icerik.egitmenGorsel ? (
                <div
                  className="min-h-[240px] bg-cover bg-center md:min-h-[280px]"
                  style={{ backgroundImage: `url(${icerik.egitmenGorsel})` }}
                />
              ) : (
                <div className="placeholder-block flex min-h-[200px] items-end p-4 md:min-h-[280px]">
                  <span className="rounded-[5px] bg-white/90 px-2 py-[5px] font-mono text-[10px] text-[#656B7A]">
                    eğitmen portresi
                  </span>
                </div>
              )}
              <div className="p-6 sm:p-9">
                <div className="font-mono text-[10.5px] tracking-[0.16em] text-brand uppercase">Eğitmen</div>
                <h2 className="mt-[14px] font-heading text-[24px] leading-[1.12] font-semibold tracking-[-0.03em] sm:text-[30px]">
                  {icerik.egitmenAd}
                </h2>
                {icerik.egitmenUnvan && <div className="mt-2 text-[15px] text-[#5C6273]">{icerik.egitmenUnvan}</div>}
                {icerik.egitmenBiyografi && (
                  <p className="mt-5 max-w-[560px] text-[15.5px] leading-[1.68] whitespace-pre-line text-[#3A3F4F]">
                    {icerik.egitmenBiyografi}
                  </p>
                )}
                <Link href="/hakkimizda" className="mt-7 inline-flex text-[14.5px] font-semibold">
                  Hakkımızda sayfası →
                </Link>
              </div>
            </div>
          </section>

          {/*
            Kazanımlar artık eğitmen bölümünden SONRA.

            Sayfanın en üstündeyken vaadi, onu kimin verdiği bilinmeden
            okunuyordu. Müfredat ve eğitmen görüldükten sonra aynı liste
            "ne alacağım" sorusunun cevabı olarak duruyor.
          */}
          <section id="kazanimlar" className="mt-22">
            <SectionKicker>Kazanımlar</SectionKicker>
            <h2 className="mt-[18px] mb-8 font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[34px]">
              Hedeflenen Kazanımlar
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

          {/*
            "Bu program değil" sütunu kaldırıldı: satın alma kararının hemen
            öncesinde neden UYGUN OLMADIĞINI sayan bir liste vardı.

            Kalan tek liste açılır bir bölüme alındı. `<details>` seçildi —
            JavaScript'siz çalışıyor, `open` ile açık geliyor ve tarayıcının
            kendi erişilebilirlik davranışını getiriyor; bunun için bir istemci
            bileşeni yazmak gereksizdi.
          */}
          <details id="kimler" className="group mt-22 rounded-[15px] border border-ink/11 open:bg-[#F8FAFF]" open>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-5 p-[26px] [&::-webkit-details-marker]:hidden">
              <h2 className="font-heading text-[24px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[30px]">
                Eğitime kimler katılmalı?
              </h2>
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[9px] bg-[#F2F4FA] font-mono text-[16px] text-brand group-open:bg-white">
                <span className="hidden group-open:inline">–</span>
                <span className="group-open:hidden">+</span>
              </span>
            </summary>
            <div className="flex flex-col gap-[13px] px-[26px] pb-7">
              {course.uygun.map((u) => (
                <div key={u} className="flex items-start gap-[11px] text-[15.5px] leading-[1.6] text-[#2B303D]">
                  <span className="mt-[3px] flex h-[17px] w-[17px] flex-none items-center justify-center rounded-[6px] bg-brand text-[10px] font-bold text-white">
                    ✓
                  </span>
                  <span>{u}</span>
                </div>
              ))}
            </div>
          </details>


          {/* Soru girilmediyse bölüm hiç basılmıyor: boş bir "Bu program
              hakkında" başlığı sayfada eksik iş gibi duruyordu. */}
          {course.sss.length > 0 && (
            <section id="sss" className="mt-22">
              <SectionKicker>SSS</SectionKicker>
              <h2 className="mt-[18px] mb-7 font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[34px]">
                Bu program hakkında
              </h2>
              <FaqAccordion items={course.sss} />
            </section>
          )}
        </main>

        {/*
          Kayıt kutusu dar ekranda GİZLİ.

          Mobilde yan sütun diye bir şey yok: kutu tek sütuna düşüp SSS'nin
          altına, sayfanın en dibine iniyordu — yani kimsenin görmediği bir
          yere. Hero'daki "Eğitim Planı Oluştur" düğmesi mobildeki eylemi
          zaten karşılıyor. Geniş ekranda kutu yerinde ve yapışkan duruyor.
        */}
        <aside id="katil" className="hidden pt-20 lg:sticky lg:top-[106px] lg:block lg:self-start">
          <div className="overflow-hidden rounded-[18px] border border-ink/11 bg-white shadow-[0_26px_60px_rgba(10,13,24,0.1)]">
            <div className="bg-ink px-6 pt-[26px] pb-6 text-white">
              <div className="font-mono text-[10.5px] tracking-[0.14em] text-white/50 uppercase">Kişiye özel program</div>
              {/*
                Başlık artık eğitimin kendi adı. Önceki "Kapsam ve süre size
                göre kurulur" bir slogandı ve altındaki fiyat açıklamasıyla
                birlikte kutuyu bir fiyat kutusu gibi gösteriyordu; oysa kutu
                programın ne içerdiğini anlatıyor.
              */}
              <div className="mt-3 font-heading text-[26px] leading-[1.15] font-semibold tracking-[-0.025em]">
                {course.baslik}
              </div>
            </div>
            <div className="px-6 pt-6 pb-[26px]">
              {/*
                İçerik listesi sabit: süre/format/yer gibi künye bilgileri değil,
                programa dahil olan haklar. Hepsi her eğitimde aynı olduğu için
                veritabanında değil burada duruyor — değişmeyen yedi satırı her
                eğitim için yeniden doldurtmak hataya açık.
              */}
              <div className="flex flex-col gap-[13px]">
                {PROGRAM_KAPSAMI.map((k) => (
                  <div key={k.ad} className="flex items-center gap-[11px] text-[14.5px] leading-[1.35]">
                    <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[9px] bg-brand/10 text-brand">
                      <Icon name={k.ikon} size={15} />
                    </span>
                    <span className="font-medium text-ink">{k.ad}</span>
                  </div>
                ))}
              </div>

              {/*
                Ana eylem hero'daki düğmenin aynısı: sayfayı aşağı okuyan kişi
                yukarı dönmek zorunda kalmasın. Ölçülen uçtan gidiyor, kaynak
                farklı ki hangi düğmenin çalıştığı ayrışsın.
              */}
              <Link
                href={olculenWhatsapp("egitim-yan-kutu")}
                className="mt-6 flex h-13 items-center justify-center gap-[9px] rounded-[11px] bg-brand text-[15.5px] font-semibold text-white shadow-[0_12px_28px_rgba(28,86,243,0.32)] transition hover:bg-ink"
              >
                <Icon name="whatsapp" size={17} />
                Eğitim Planı Oluştur
              </Link>

              {/*
                İkincil iki talep forma gidiyor, WhatsApp'a değil: ikisi de
                planlama gerektiren, yazılı bilgi istenen taleplerdir (tarih,
                yer, kişi sayısı). Konu formda hazır seçili geliyor.
              */}
              <Link
                href="/iletisim?konu=yuz-yuze"
                className="mt-[10px] flex h-12 items-center justify-center gap-[9px] rounded-[11px] border border-ink text-[14.5px] font-semibold text-ink transition hover:bg-ink hover:text-white"
              >
                <Icon name="pin" size={16} />
                Yüz yüze eğitim talebi oluştur
              </Link>
              <Link
                href="/iletisim?konu=kurumsal"
                className="mt-[10px] flex h-12 items-center justify-center gap-[9px] rounded-[11px] border border-ink text-[14.5px] font-semibold text-ink transition hover:bg-ink hover:text-white"
              >
                <Icon name="users" size={16} />
                Kurumsal eğitim talebi
              </Link>
            </div>
          </div>

          {/*
            "Emin değil misiniz?" kutusunun yerinde artık eğitmen kimliği var.
            O kutu üçüncü bir eylem öneriyordu; üst üste dört düğme, hiçbirini
            seçtirmiyor. Kararı zorlaştıran şey seçenek sayısıydı — eksik olan
            şey ise eğitimi kimin verdiğiydi.
          */}
          {/*
            Eğitmen kutusu: geniş ekranda eğitmeni tanıtan TEK yer. Aşağıdaki
            #egitmen bölümü bu genişlikte gizli — aynı kişiyi iki kez tanıtmak
            yerine bilgi, satın alma kararının verildiği yere taşındı.
          */}
          <div className="mt-4 overflow-hidden rounded-[14px] border border-ink/11">
            {icerik.egitmenGorsel ? (
              <div
                className="aspect-[4/3] bg-cover bg-center"
                style={{ backgroundImage: `url(${icerik.egitmenGorsel})` }}
              />
            ) : (
              // Portre yüklenmediyse yer tutucu değil baş harfler: boş bir
              // kutu eksik iş gibi duruyor, harfler bilinçli bir tasarım.
              <div className="flex aspect-[4/3] items-center justify-center bg-ink">
                <span className="font-heading text-[38px] font-semibold tracking-[-0.02em] text-white/85">
                  {basHarfler(icerik.egitmenAd)}
                </span>
              </div>
            )}
            <div className="p-5">
              <div className="font-mono text-[10px] tracking-[0.14em] text-brand uppercase">Eğitmen</div>
              <div className="mt-[10px] font-heading text-[19px] leading-[1.15] font-semibold tracking-[-0.025em]">
                {icerik.egitmenAd}
              </div>
              {icerik.egitmenUnvan && (
                <div className="mt-[5px] text-[13px] leading-[1.45] text-[#5C6273]">{icerik.egitmenUnvan}</div>
              )}
              {icerik.egitmenBiyografi && (
                // line-clamp: biyografi panelden serbestçe yazılıyor ve uzun
                // bir metin yapışkan kutuyu ekrandan taşırıp kaydırmayı
                // kilitliyordu. Tamamı mobil bölümde ve hakkımızda sayfasında.
                <p className="mt-3 line-clamp-5 text-[13.5px] leading-[1.6] text-[#3A3F4F]">
                  {icerik.egitmenBiyografi}
                </p>
              )}
              <div className="mt-4 flex flex-col gap-[9px] border-t border-ink/9 pt-4">
                {egitmenStats.map((s) => (
                  <div key={s.t} className="flex items-baseline justify-between gap-3 text-[13px]">
                    <span className="text-[#5C6273]">{s.t}</span>
                    <span className="font-semibold text-ink">{s.n}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/hakkimizda"
                className="mt-4 inline-flex text-[13.5px] font-semibold text-brand hover:text-ink"
              >
                Eğitmen hakkında →
              </Link>
            </div>
          </div>
        </aside>
      </div>

      <PublicFooter />
    </div>
    </>
  );
}
