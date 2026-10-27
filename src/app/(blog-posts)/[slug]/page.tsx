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
  kategorilerSayili,
  type Yazi,
  type Kategori,
} from "@/lib/yazilar";
import { iceriktenIcindekiler, type IcindekiSatir } from "@/lib/blog-icerik";
import { blogHtmlTemizle } from "@/lib/blog-temizle";
import { grupla } from "@/lib/blog-toc";
import { egitimCtaHtml } from "@/lib/blog-cta";
import { getSiteIcerik } from "@/lib/site-icerik";
import { yazariCoz } from "@/lib/yazar";
import { okumaSuresi, kelimeSayisi, dateModifiedDegeri } from "@/lib/blog-meta";
import { YazarMeta } from "@/components/blog/YazarMeta";
import { YazarKutusu } from "@/components/blog/YazarKutusu";
import { IcindekilerYan } from "@/components/blog/IcindekilerYan";
import { IcindekilerAccordion } from "@/components/blog/IcindekilerAccordion";
import { EgitimCta } from "@/components/blog/EgitimCta";
import { BlogKapak } from "@/components/blog/BlogKapak";
import { YaziKarti } from "@/components/blog/YaziKarti";
import { DahaFazla } from "@/components/blog/DahaFazla";
import { KategoriCipleri } from "@/components/blog/KategoriCipleri";
import { PaylasimDugmeleri } from "@/components/blog/PaylasimDugmeleri";
import { getCourses } from "@/lib/courses";
import { ilgiliEgitim, type IlgiliEgitim } from "@/lib/blog-egitim";
import { etiketAdresi } from "@/lib/blog-etiket";
import { blogBaglantiCozucu } from "@/lib/blog-baglanti-sunucu";
import { PromptKopyala } from "@/components/blog/PromptKopyala";
import { GorselLightbox } from "@/components/blog/GorselLightbox";
import { BlogAnalitik } from "@/components/blog/BlogAnalitik";
import { OkumaIlerleme } from "@/components/blog/OkumaIlerleme";
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
function araCtaEkle(html: string, h2ler: IcindekiSatir[], egitim: IlgiliEgitim): string {
  if (h2ler.length < 3) return html;
  const idx = Math.min(h2ler.length - 1, Math.max(1, Math.round(h2ler.length * 0.4)));
  const idIsaret = `id="${h2ler[idx].id}"`;
  const idPos = html.indexOf(idIsaret);
  if (idPos === -1) return html;
  const h2Pos = html.lastIndexOf("<h2", idPos);
  if (h2Pos === -1) return html;
  return html.slice(0, h2Pos) + egitimCtaHtml("ara", egitim) + html.slice(h2Pos);
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
    // Yazısı olmayan kategori ince bir sayfa: site haritasında da yok
    // (sitemap.ts), dizine de girmesin. Yazı eklenince kendiliğinden açılır.
    const yazilar = await getYazilarByKategori(kategori.slug);
    return sayfaMeta({
      baslik: `${kategori.ad} yazıları`,
      // Panelden yazılan kategori açıklaması varsa o; yoksa kalıp cümle.
      aciklama: kategori.aciklama || `${kategori.ad} kategorisindeki dijital pazarlama yazıları, rehberler ve ipuçları.`,
      yol: `/${kategori.slug}`,
      indeksleme: yazilar.length > 0,
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
  const [baglanti, ilgili, site, egitimler] = await Promise.all([
    blogBaglantiCozucu(),
    ilgiliYazilar(yazi.id, yazi.kategoriId),
    getSiteIcerik(),
    getCourses(),
  ]);
  // Önce temizlik (izin listesi, iç bağlantılar son adrese), sonra
  // başlıklara kimlik: TOC'nin saydığı başlıklar sayfada basılanlar olsun.
  const { html: icerikHam, icindekiler } = iceriktenIcindekiler(blogHtmlTemizle(yazi.icerikHtml, { baglanti }));
  // Yazının kategorisinin eğitimi (CTA'lar ve kayıt kartı): lib/blog-egitim.
  const egitim = ilgiliEgitim(yazi.kategori?.slug, egitimler);

  // Yazar bilgisi merkezî kaynaktan (site_icerik → egitmen_*); okuma süresi
  // içerikten hesaplanıyor.
  const yazar = yazariCoz(yazi.yazar, site);
  const okuma = okumaSuresi(yazi.icerikHtml);

  // İçindekiler yapısı (yalnızca sunum): H2 grupları + düz H2 listesi.
  const gruplar = grupla(icindekiler);
  const h2ler = icindekiler.filter((i) => i.seviye === 2);
  // Mobil/tablet ara CTA'sını gövdeye ekle (masaüstünde CSS ile gizli).
  const icerikHtml = araCtaEkle(icerikHam, h2ler, egitim);

  const kapakMutlak = mutlakDepoUrl(yazi.kapak, SITE_URL);

  const semalar = [
    makaleSemasi({
      slug: yazi.slug,
      bolum: yazi.kategori?.ad ?? null,
      anahtarKelimeler: yazi.etiketler,
      kelimeSayisi: kelimeSayisi(yazi.icerikHtml),
      okumaDakika: okuma,
      baslik: yazi.baslik,
      aciklama: yazi.seoAciklama || yazi.ozet,
      gorsel: kapakMutlak,
      yayinTarihi: yazi.yayinTarihi,
      // dateModified: teknik updated_at değil, gerçek içerik güncellemesi
      // (yoksa yayın tarihine düşer).
      dateModified: dateModifiedDegeri(yazi.yayinTarihi, yazi.icerikGuncelleme, yazi.guncelleme),
      yazar: yazar.name,
      yazarUrl: yazar.profileUrl,
    }),
    kirintiSemasi([
      { ad: "Ana sayfa", yol: "/" },
      { ad: "Blog", yol: "/blog" },
      ...(yazi.kategori ? [{ ad: yazi.kategori.ad, yol: `/${yazi.kategori.slug}` }] : []),
      { ad: yazi.baslik, yol: `/${yazi.slug}` },
    ]),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(semalar) }} />
      <div className="bg-white">
        <PublicHeader />
        {/* Okuma ilerlemesi: yapışkan başlığın hemen altında ince çizgi. */}
        <OkumaIlerleme />

        {/*
          Masaüstü (≥1024px): iki kolon — içerik (≤760px) + sticky sidebar
          (296px). Altında tek kolon; sidebar tamamen kalkıyor, İçindekiler
          accordion'a, CTA içerik akışına dönüyor.
        */}
        <div className="mx-auto max-w-[1200px] px-5 pt-14 pb-20 sm:px-8 sm:pt-20 lg:grid lg:grid-cols-[minmax(0,1fr)_296px] lg:gap-12 xl:gap-16">
          <article
            className="mx-auto w-full min-w-0 max-w-[760px] lg:mx-0"
            data-blog-post
            data-post-id={yazi.id}
            data-post-slug={yazi.slug}
          >
            {/* Davranış ölçümü (blog_view, scroll, CTA, benzer yazı). Ölçümleme
                kapalıysa sessiz; public bundle'a yalnız minimum kod giriyor. */}
            <BlogAnalitik
              postId={yazi.id}
              slug={yazi.slug}
              title={yazi.baslik}
              category={yazi.kategori?.ad}
              author={yazar.name}
              published={yazi.yayinTarihi ?? undefined}
            />
            <nav aria-label="Kırıntı yolu" className="font-mono text-[11px] tracking-[0.06em] text-[#8A90A0]">
              <Link href="/blog" className="inline-flex items-center gap-[6px] hover:text-brand">
                <Icon name="arrowLeft" size={14} />
                Blog
              </Link>
            </nav>

            <header className="mt-6">
            {yazi.kategori && (
              <div className="font-mono text-[11px] tracking-[0.08em]">
                <Link
                  href={`/${yazi.kategori.slug}`}
                  className="rounded-full bg-brand/10 px-[11px] py-[5px] font-semibold text-brand uppercase hover:bg-brand hover:text-white"
                >
                  {yazi.kategori.ad}
                </Link>
              </div>
            )}
            <h1 className="mt-3 font-heading text-[34px] leading-[1.1] font-semibold tracking-[-0.035em] text-balance sm:text-[44px] sm:leading-[1.06]">
              {yazi.baslik}
            </h1>
            {yazi.ozet && <p className="mt-5 text-[18px] leading-[1.6] text-pretty text-[#5C6273]">{yazi.ozet}</p>}
            {/* Kompakt yazar/meta alanı: H1 ve açıklamanın altında. */}
            <YazarMeta
              yazar={yazar}
              yayinTarihi={yazi.yayinTarihi}
              icerikGuncelleme={yazi.icerikGuncelleme}
              okuma={okuma}
            />
          </header>

            {/* Görsel yoksa kategorinin renk ve simgesiyle çizilen kapak. */}
            <div className="mt-8 overflow-hidden rounded-2xl">
              <BlogKapak
                gorsel={yazi.kapak}
                alt={yazi.kapakAlt || yazi.baslik}
                kategoriSlug={yazi.kategori?.slug}
                ozel={{ ton: yazi.kapakTon, simge: yazi.kapakSimge }}
                cesit="hero"
                oncelikli
              />
            </div>

            {/* Mobil/tablet İçindekiler: kapak sonrası, içerik öncesi accordion
                (bileşen kendini lg:hidden ile masaüstünde gizliyor). */}
            <IcindekilerAccordion h2ler={h2ler} />

            {/* İçerik editörde/WordPress'ten gelen HTML, izin listesiyle
                temizlenmiş hâli (lib/blog-temizle.ts). Başlıklara TOC için id
                eklendi. Mobil ara CTA gövdeye enjekte edildi (masaüstünde CSS
                ile gizli). */}
            <div className="blog-icerik mt-10" data-blog-icerik dangerouslySetInnerHTML={{ __html: icerikHtml }} />
            {/* Prompt kopyala + görsel lightbox: statik HTML üzerine bağlanan
                küçük client adaları (içerik bunlarsız da doğru render olur). */}
            <PromptKopyala />
            <GorselLightbox />

            <div className="mt-10 flex flex-col gap-5 border-t border-ink/10 pt-6">
              {yazi.etiketler.length > 0 && (
                <ul className="flex flex-wrap items-center gap-2" aria-label="Etiketler">
                  {yazi.etiketler.map((e) => (
                    <li key={e}>
                      <Link
                        href={etiketAdresi(e)}
                        className="inline-flex min-h-9 items-center rounded-full bg-ink/[0.05] px-3 text-[13px] text-[#4A4F5E] transition hover:bg-brand/10 hover:text-brand"
                      >
                        #{e}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <PaylasimDugmeleri url={`${SITE_URL}/${yazi.slug}/`} baslik={yazi.baslik} />
            </div>

            {/* Mobil/tablet yazı sonu güçlü CTA (masaüstünde CSS ile gizli;
                orada sidebar CTA'sı devrede). */}
            <EgitimCta varyant="son" egitim={egitim} />

            {/* Yazı sonu yazar kutusu (ilgili yazılardan önce). Satış CTA'sı
                değil; güven odaklı, CTA kartlarından görsel olarak ayrışır. */}
            <YazarKutusu yazar={yazar} />
          </article>

          {/* Masaüstü sticky sidebar: İçindekiler (scroll-spy) + eğitim CTA.
              1024px altında tamamen gizli. */}
          <aside className="hidden lg:block">
            <div
              className="flex flex-col gap-5"
              style={{ position: "sticky", top: "calc(var(--baslik-h, 84px) + 24px)" }}
            >
              {gruplar.length > 0 && <IcindekilerYan gruplar={gruplar} />}
              <EgitimCta varyant="yan" egitim={egitim} />
            </div>
          </aside>
        </div>

        {ilgili.length > 0 && (
          <section className="border-t border-ink/10 bg-mist/40" aria-labelledby="ilgili-yazilar">
            <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8">
              <h2 id="ilgili-yazilar" className="font-heading text-[24px] leading-[1.15] font-semibold tracking-[-0.02em]">
                İlgili yazılar
              </h2>
              <div className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {ilgili.map((y, i) => (
                  <YaziKarti key={y.id} yazi={y} baslik="h3" konum={i + 1} />
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
  const [yazilar, kategoriler] = await Promise.all([getYazilarByKategori(kategori.slug), kategorilerSayili()]);

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
            {kategori.aciklama && (
              <p className="mx-auto mt-5 max-w-[640px] text-[16.5px] leading-[1.65] whitespace-pre-line text-white/72 lg:mx-0">
                {kategori.aciklama}
              </p>
            )}
          </div>
        </section>

        <main className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8 sm:py-20">
          <KategoriCipleri kategoriler={kategoriler} etkin={kategori.slug} />
          {yazilar.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-ink/15 bg-mist p-12 text-center text-[15px] text-[#5C6273]">
              Bu kategoride henüz yazı yok.{" "}
              <Link href="/blog/" className="font-semibold text-brand hover:text-ink">
                Tüm yazılara göz atın
              </Link>
              .
            </div>
          ) : (
            <div className="mt-10">
              <DahaFazla>
                {yazilar.map((y) => (
                  <YaziKarti key={y.id} yazi={y} />
                ))}
              </DahaFazla>
            </div>
          )}
        </main>

        <PublicFooter />
      </div>
    </>
  );
}
