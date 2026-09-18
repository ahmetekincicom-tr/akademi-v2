import { cache } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { SectionKicker } from "@/components/site/SectionKicker";
import { Icon } from "@/components/Icon";
import {
  getYaziBySlug,
  getKategoriBySlug,
  getYazilarByKategori,
  getYayindakiYazilar,
  getKategoriler,
  ilgiliYazilar,
  type Yazi,
  type Kategori,
} from "@/lib/yazilar";
import { iceriktenIcindekiler, type IcindekiSatir } from "@/lib/blog-icerik";
import { grupla } from "@/lib/blog-toc";
import { egitimCtaHtml } from "@/lib/blog-cta";
import { IcindekilerYan } from "@/components/blog/IcindekilerYan";
import { IcindekilerAccordion } from "@/components/blog/IcindekilerAccordion";
import { EgitimCta } from "@/components/blog/EgitimCta";
import { PromptKopyala } from "@/components/blog/PromptKopyala";
import { GorselLightbox } from "@/components/blog/GorselLightbox";
import { mutlakDepoUrl } from "@/lib/depo";
import { sayfaMeta, makaleSemasi, kirintiSemasi, SITE_URL } from "@/lib/seo";

/**
 * Mobil/tablet için içerik içi (~%40) kompakt CTA'yı gövdeye enjekte eder.
 *
 * Bileşen yerine HTML string enjeksiyonu: CTA tek `.blog-icerik` kabının
 * İÇİNDE, blok sınırında (bir H2'den hemen önce) duruyor — böylece içerik ikiye
 * bölünüp iki ayrı kaba düşmüyor (kenar boşluğu/masaüstü görünümü bozulmuyor).
 * Yalnızca yeterince uzun yazılarda (≥3 H2) ekleniyor; kısa yazıda reklam
 * hissi yaratmasın.
 */
function araCtaEkle(html: string, h2ler: IcindekiSatir[]): string {
  if (h2ler.length < 3) return html;
  const idx = Math.min(h2ler.length - 1, Math.max(1, Math.round(h2ler.length * 0.4)));
  const idIsaret = `id="${h2ler[idx].id}"`;
  const idPos = html.indexOf(idIsaret);
  if (idPos === -1) return html;
  const h2Pos = html.lastIndexOf("<h2", idPos);
  if (h2Pos === -1) return html;
  return html.slice(0, h2Pos) + egitimCtaHtml("ara") + html.slice(h2Pos);
}

/**
 * Kök slug rotası — WordPress'ten taşınan blog yazıları ve kategori arşivleri.
 *
 * WordPress'te yazılar ve kategoriler KÖKTE duruyordu (/meta-capi-nedir/,
 * /sosyal-medya/). SEO değerini korumak için bu yapı BİREBİR taşındı: yazılar
 * /blog/… altına DEĞİL, doğrudan köke sunuluyor. `/blog` yalnızca dizin sayfası.
 *
 * Tek dinamik segment hem yazıyı hem kategoriyi çözüyor: önce yazı slug'ı
 * aranıyor, yoksa kategori slug'ı, o da yoksa 404. Statik rotalar (/hakkimizda
 * vb.) Next tarafından bu dinamik segmentten önce eşleştiği için çakışma yok.
 */

// İçerik panelden değişiyor; saatlik ISR. Yayınlanan yeni yazı, yeniden derleme
// beklemeden dynamicParams ile ilk istekte üretiliyor.
export const revalidate = 3600;
export const dynamicParams = true;

type CozumSonuc =
  | { tip: "yazi"; yazi: Yazi }
  | { tip: "kategori"; kategori: Kategori }
  | { tip: "yok" };

/**
 * Slug'ı yazıya ya da kategoriye çözer. react cache: generateMetadata ile sayfa
 * gövdesi aynı istekte iki kez çağırdığında tek sorgu çalışsın diye.
 */
const cozumle = cache(async (slug: string): Promise<CozumSonuc> => {
  const yazi = await getYaziBySlug(slug);
  if (yazi) return { tip: "yazi", yazi };
  const kategori = await getKategoriBySlug(slug);
  if (kategori) return { tip: "kategori", kategori };
  return { tip: "yok" };
});

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  // Derleme, veritabanı/env erişilebilirliğine bağlı olmamalı: sorun olursa boş
  // dön, sayfalar dynamicParams + ISR ile çalışma anında üretilir (build kırılmaz).
  try {
    const [yazilar, kategoriler] = await Promise.all([getYayindakiYazilar(), getKategoriler()]);
    return [...yazilar.map((y) => ({ slug: y.slug })), ...kategoriler.map((k) => ({ slug: k.slug }))];
  } catch {
    return [];
  }
}

function tarih(deger: string | null): string {
  if (!deger) return "";
  try {
    return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(
      new Date(deger),
    );
  } catch {
    return "";
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const sonuc = await cozumle(slug);

  if (sonuc.tip === "yazi") {
    const yazi = sonuc.yazi;
    const kapakMutlak = mutlakDepoUrl(yazi.kapak, SITE_URL);
    return sayfaMeta({
      baslik: yazi.seoBaslik || yazi.baslik,
      aciklama: yazi.seoAciklama || yazi.ozet,
      yol: `/${yazi.slug}`,
      tip: "article",
      ...(yazi.yayinTarihi ? { yayinTarihi: yazi.yayinTarihi } : {}),
      ...(kapakMutlak ? { paylasimGorseli: { url: kapakMutlak, width: 1600, height: 1000 } } : {}),
    });
  }

  if (sonuc.tip === "kategori") {
    const kategori = sonuc.kategori;
    return sayfaMeta({
      baslik: `${kategori.ad} yazıları`,
      aciklama: `${kategori.ad} kategorisindeki dijital pazarlama yazıları, rehberler ve ipuçları.`,
      yol: `/${kategori.slug}`,
    });
  }

  return { title: "Sayfa bulunamadı", robots: { index: false, follow: true } };
}

export default async function KokSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sonuc = await cozumle(slug);
  if (sonuc.tip === "yazi") return <YaziDetay yazi={sonuc.yazi} />;
  if (sonuc.tip === "kategori") return <KategoriArsiv kategori={sonuc.kategori} />;
  notFound();
}

/* ------------------------------------------------------------- yazı --- */

async function YaziDetay({ yazi }: { yazi: Yazi }) {
  const [{ html: icerikHam, icindekiler }, ilgili] = await Promise.all([
    Promise.resolve(iceriktenIcindekiler(yazi.icerikHtml)),
    ilgiliYazilar(yazi.id, yazi.kategoriId),
  ]);

  // İçindekiler yapısı (yalnızca sunum): H2 grupları + düz H2 listesi.
  const gruplar = grupla(icindekiler);
  const h2ler = icindekiler.filter((i) => i.seviye === 2);
  // Mobil/tablet ara CTA'sını gövdeye ekle (masaüstünde CSS ile gizli).
  const icerikHtml = araCtaEkle(icerikHam, h2ler);

  const kapakMutlak = mutlakDepoUrl(yazi.kapak, SITE_URL);

  const semalar = [
    makaleSemasi({
      slug: yazi.slug,
      baslik: yazi.baslik,
      aciklama: yazi.seoAciklama || yazi.ozet,
      gorsel: kapakMutlak,
      yayinTarihi: yazi.yayinTarihi,
      guncelleme: yazi.guncelleme,
      yazar: yazi.yazar,
    }),
    kirintiSemasi([
      { ad: "Ana sayfa", yol: "/" },
      { ad: "Blog", yol: "/blog" },
      { ad: yazi.baslik, yol: `/${yazi.slug}` },
    ]),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(semalar) }} />
      <div className="bg-white">
        <PublicHeader />

        {/*
          Masaüstü (≥1024px): iki kolon — içerik (≤760px) + sticky sidebar
          (296px). Altında tek kolon; sidebar tamamen kalkıyor, İçindekiler
          accordion'a, CTA içerik akışına dönüyor.
        */}
        <div className="mx-auto max-w-[1200px] px-5 pt-14 pb-20 sm:px-8 sm:pt-20 lg:grid lg:grid-cols-[minmax(0,1fr)_296px] lg:gap-12 xl:gap-16">
          <article className="mx-auto w-full min-w-0 max-w-[760px] lg:mx-0">
            <nav aria-label="Kırıntı yolu" className="font-mono text-[11px] tracking-[0.06em] text-[#8A90A0]">
              <Link href="/blog" className="inline-flex items-center gap-[6px] hover:text-brand">
                <Icon name="arrowLeft" size={14} />
                Blog
              </Link>
            </nav>

            <header className="mt-6">
            <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] tracking-[0.08em] text-[#6B7080]">
              {yazi.kategori && (
                <Link
                  href={`/${yazi.kategori.slug}`}
                  className="rounded-full bg-brand/10 px-[11px] py-[5px] font-semibold text-brand uppercase hover:bg-brand hover:text-white"
                >
                  {yazi.kategori.ad}
                </Link>
              )}
              {yazi.yayinTarihi && (
                <span>
                  {tarih(yazi.yayinTarihi)}
                  {yazi.yazar ? ` · ${yazi.yazar}` : ""}
                </span>
              )}
            </div>
            <h1 className="mt-3 font-heading text-[34px] leading-[1.1] font-semibold tracking-[-0.035em] text-balance sm:text-[44px] sm:leading-[1.06]">
              {yazi.baslik}
            </h1>
            {yazi.ozet && <p className="mt-5 text-[18px] leading-[1.6] text-pretty text-[#5C6273]">{yazi.ozet}</p>}
          </header>

            {yazi.kapak && (
              <div
                className="mt-8 aspect-[16/9] overflow-hidden rounded-2xl bg-cover bg-center"
                style={{ backgroundImage: `url(${yazi.kapak})` }}
                role="img"
                aria-label={yazi.baslik}
              />
            )}

            {/* Mobil/tablet İçindekiler: kapak sonrası, içerik öncesi accordion
                (bileşen kendini lg:hidden ile masaüstünde gizliyor). */}
            <IcindekilerAccordion h2ler={h2ler} />

            {/* İçerik editörde/WordPress'ten gelen HTML; yazarlar yönetici
                olduğu için güvenilir kaynak. Başlıklara TOC için id eklendi.
                Mobil ara CTA gövdeye enjekte edildi (masaüstünde CSS ile gizli). */}
            <div className="blog-icerik mt-10" dangerouslySetInnerHTML={{ __html: icerikHtml }} />
            {/* Prompt kopyala + görsel lightbox: statik HTML üzerine bağlanan
                küçük client adaları (içerik bunlarsız da doğru render olur). */}
            <PromptKopyala />
            <GorselLightbox />

            {yazi.etiketler.length > 0 && (
              <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-ink/10 pt-6">
                {yazi.etiketler.map((e) => (
                  <span key={e} className="rounded-full bg-ink/[0.05] px-[11px] py-[5px] text-[12.5px] text-[#5C6273]">
                    #{e}
                  </span>
                ))}
              </div>
            )}

            {/* Mobil/tablet yazı sonu güçlü CTA (masaüstünde CSS ile gizli;
                orada sidebar CTA'sı devrede). */}
            <EgitimCta varyant="son" />
          </article>

          {/* Masaüstü sticky sidebar: İçindekiler (scroll-spy) + eğitim CTA.
              1024px altında tamamen gizli. */}
          <aside className="hidden lg:block">
            <div
              className="flex flex-col gap-5"
              style={{ position: "sticky", top: "calc(var(--baslik-h, 84px) + 24px)" }}
            >
              {gruplar.length > 0 && <IcindekilerYan gruplar={gruplar} />}
              <EgitimCta varyant="yan" />
            </div>
          </aside>
        </div>

        {ilgili.length > 0 && (
          <section className="border-t border-ink/10 bg-mist/40">
            <div className="mx-auto max-w-[1080px] px-5 py-16 sm:px-8">
              <h2 className="font-heading text-[24px] leading-[1.15] font-semibold tracking-[-0.02em]">İlgili yazılar</h2>
              <div className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {ilgili.map((y) => (
                  <Link
                    key={y.id}
                    href={`/${y.slug}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-ink/11 bg-white transition hover:-translate-y-[3px] hover:border-brand/45 hover:shadow-[0_18px_40px_rgba(10,13,24,0.1)]"
                  >
                    <div
                      className={`aspect-[16/10] bg-cover bg-center ${y.kapak ? "" : "placeholder-block"}`}
                      style={y.kapak ? { backgroundImage: `url(${y.kapak})` } : undefined}
                    />
                    <div className="p-5">
                      <h3 className="font-heading text-[17px] leading-[1.28] font-semibold tracking-[-0.02em] text-ink transition-colors group-hover:text-brand">
                        {y.baslik}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <PublicFooter />
      </div>
    </>
  );
}

/* -------------------------------------------------------- kategori --- */

async function KategoriArsiv({ kategori }: { kategori: Kategori }) {
  const yazilar = await getYazilarByKategori(kategori.slug);

  const semalar = [
    kirintiSemasi([
      { ad: "Ana sayfa", yol: "/" },
      { ad: "Blog", yol: "/blog" },
      { ad: kategori.ad, yol: `/${kategori.slug}` },
    ]),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(semalar) }} />
      <div className="bg-white">
        <PublicHeader />

        <section className="relative overflow-hidden bg-ink text-white">
          <div className="absolute -top-40 -right-20 h-[520px] w-[520px] rounded-full bg-brand opacity-18 blur-[120px]" />
          <div className="relative mx-auto max-w-[1240px] px-5 pt-20 pb-20 text-center sm:px-8 lg:text-left">
            <div className="flex justify-center lg:justify-start">
              <SectionKicker tone="light">Blog · Kategori</SectionKicker>
            </div>
            <h1 className="mx-auto mt-[18px] max-w-[640px] font-heading text-[36px] leading-[1.06] font-semibold tracking-[-0.035em] sm:text-[46px] lg:mx-0">
              {kategori.ad}
            </h1>
          </div>
        </section>

        <main className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8">
          <Link href="/blog" className="text-[14px] font-semibold text-brand hover:text-ink">
            ← Tüm yazılar
          </Link>
          {yazilar.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-ink/15 bg-mist p-12 text-center text-[15px] text-[#5C6273]">
              Bu kategoride henüz yazı yok.
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {yazilar.map((y) => (
                <Link
                  key={y.id}
                  href={`/${y.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-ink/11 bg-white transition hover:-translate-y-[4px] hover:border-brand/45 hover:shadow-[0_22px_46px_rgba(10,13,24,0.12)]"
                >
                  <div
                    className={`aspect-[16/10] bg-cover bg-center ${y.kapak ? "" : "placeholder-block"}`}
                    style={y.kapak ? { backgroundImage: `url(${y.kapak})` } : undefined}
                  />
                  <div className="flex flex-1 flex-col p-6">
                    {y.yayinTarihi && (
                      <div className="font-mono text-[11px] tracking-[0.06em] text-[#6B7080]">{tarih(y.yayinTarihi)}</div>
                    )}
                    <h2 className="mt-[10px] font-heading text-[21px] leading-[1.25] font-semibold tracking-[-0.025em] text-ink transition-colors group-hover:text-brand">
                      {y.baslik}
                    </h2>
                    {y.ozet && <p className="mt-[10px] line-clamp-3 text-[15px] leading-[1.6] text-[#5C6273]">{y.ozet}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>

        <PublicFooter />
      </div>
    </>
  );
}
