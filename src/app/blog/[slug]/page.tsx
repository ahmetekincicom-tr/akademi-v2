import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { Icon } from "@/components/Icon";
import { getYaziBySlug, ilgiliYazilar } from "@/lib/yazilar";
import { iceriktenIcindekiler } from "@/lib/blog-icerik";
import { mutlakDepoUrl } from "@/lib/depo";
import { sayfaMeta, makaleSemasi, kirintiSemasi, SITE_URL } from "@/lib/seo";

export const revalidate = 3600;

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
  const yazi = await getYaziBySlug(slug);
  if (!yazi) return { title: "Yazı bulunamadı", robots: { index: false, follow: true } };

  const kapakMutlak = mutlakDepoUrl(yazi.kapak, SITE_URL);

  return sayfaMeta({
    baslik: yazi.seoBaslik || yazi.baslik,
    aciklama: yazi.seoAciklama || yazi.ozet,
    yol: `/blog/${yazi.slug}`,
    tip: "article",
    ...(yazi.yayinTarihi ? { yayinTarihi: yazi.yayinTarihi } : {}),
    ...(kapakMutlak ? { paylasimGorseli: { url: kapakMutlak, width: 1600, height: 1000 } } : {}),
  });
}

export default async function BlogYaziPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const yazi = await getYaziBySlug(slug);
  if (!yazi) notFound();

  const [{ html: icerikHtml, icindekiler }, ilgili] = await Promise.all([
    Promise.resolve(iceriktenIcindekiler(yazi.icerikHtml)),
    ilgiliYazilar(yazi.id, yazi.kategoriId),
  ]);
  const tocGoster = icindekiler.length >= 3;

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
      { ad: yazi.baslik, yol: `/blog/${yazi.slug}` },
    ]),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(semalar) }} />
      <div className="bg-white">
        <PublicHeader />

        <article className="mx-auto max-w-[760px] px-5 pt-14 pb-20 sm:px-8 sm:pt-20">
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
                  href={`/blog/kategori/${yazi.kategori.slug}`}
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

          {tocGoster && (
            <nav
              aria-label="İçindekiler"
              className="mt-10 rounded-2xl border border-ink/10 bg-mist/60 p-5"
            >
              <div className="font-mono text-[10.5px] tracking-[0.16em] text-[#656B7A] uppercase">İçindekiler</div>
              <ul className="mt-3 flex flex-col gap-[7px]">
                {icindekiler.map((i) => (
                  <li key={i.id} className={i.seviye === 3 ? "pl-4" : ""}>
                    <a href={`#${i.id}`} className="text-[14.5px] leading-[1.4] text-[#3A3F4F] hover:text-brand hover:underline">
                      {i.metin}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/* İçerik editörde üretilen HTML; yazarlar yönetici olduğu için
              güvenilir kaynak. Başlıklara TOC için id eklendi. */}
          <div className="blog-icerik mt-10" dangerouslySetInnerHTML={{ __html: icerikHtml }} />

          {yazi.etiketler.length > 0 && (
            <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-ink/10 pt-6">
              {yazi.etiketler.map((e) => (
                <span key={e} className="rounded-full bg-ink/[0.05] px-[11px] py-[5px] text-[12.5px] text-[#5C6273]">
                  #{e}
                </span>
              ))}
            </div>
          )}
        </article>

        {ilgili.length > 0 && (
          <section className="border-t border-ink/10 bg-mist/40">
            <div className="mx-auto max-w-[1080px] px-5 py-16 sm:px-8">
              <h2 className="font-heading text-[24px] leading-[1.15] font-semibold tracking-[-0.02em]">İlgili yazılar</h2>
              <div className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {ilgili.map((y) => (
                  <Link
                    key={y.id}
                    href={`/blog/${y.slug}`}
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
