import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { Icon } from "@/components/Icon";
import { getYaziBySlug } from "@/lib/yazilar";
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

        <article className="mx-auto max-w-[760px] px-5 pt-14 pb-24 sm:px-8 sm:pt-20">
          <nav aria-label="Kırıntı yolu" className="font-mono text-[11px] tracking-[0.06em] text-[#8A90A0]">
            <Link href="/blog" className="inline-flex items-center gap-[6px] hover:text-brand">
              <Icon name="arrowLeft" size={14} />
              Blog
            </Link>
          </nav>

          <header className="mt-6">
            {yazi.yayinTarihi && (
              <div className="font-mono text-[11px] tracking-[0.08em] text-[#6B7080]">
                {tarih(yazi.yayinTarihi)}
                {yazi.yazar ? ` · ${yazi.yazar}` : ""}
              </div>
            )}
            <h1 className="mt-3 font-heading text-[34px] leading-[1.1] font-semibold tracking-[-0.035em] text-balance sm:text-[44px] sm:leading-[1.06]">
              {yazi.baslik}
            </h1>
            {yazi.ozet && (
              <p className="mt-5 text-[18px] leading-[1.6] text-[#5C6273] text-pretty">{yazi.ozet}</p>
            )}
          </header>

          {yazi.kapak && (
            <div
              className="mt-8 aspect-[16/9] overflow-hidden rounded-2xl bg-cover bg-center"
              style={{ backgroundImage: `url(${yazi.kapak})` }}
              role="img"
              aria-label={yazi.baslik}
            />
          )}

          {/* İçerik editörde üretilen HTML; yazarlar yönetici olduğu için
              güvenilir kaynak. Stil globals.css .blog-icerik içinde. */}
          <div className="blog-icerik mt-10" dangerouslySetInnerHTML={{ __html: yazi.icerikHtml }} />
        </article>

        <PublicFooter />
      </div>
    </>
  );
}
