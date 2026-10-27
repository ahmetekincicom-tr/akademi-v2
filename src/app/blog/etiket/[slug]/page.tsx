import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { SectionKicker } from "@/components/site/SectionKicker";
import { YaziKarti } from "@/components/blog/YaziKarti";
import { DahaFazla } from "@/components/blog/DahaFazla";
import { getEtiketler, getYazilarByEtiket } from "@/lib/yazilar";
import { ETIKET_ESIGI } from "@/lib/blog-etiket";
import { kirintiSemasi, sayfaMeta } from "@/lib/seo";

/**
 * Etiket arşivi: /blog/etiket/{slug}/.
 *
 * Yalnız /blog/ altında: kökte yazılar ve kategoriler var, etiket oraya
 * konsaydı aynı ad alanında üçüncü bir tür olurdu. Eski WordPress /tag/*
 * adresleri 410 dönmeye devam ediyor (lib/kaldirilan-yollar).
 *
 * 3'ten az yazısı olan etiket açık ama noindex (ince sayfa).
 */

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    return (await getEtiketler()).map((e) => ({ slug: e.slug }));
  } catch {
    return [];
  }
}

async function etiketiBul(slug: string) {
  return (await getEtiketler()).find((e) => e.slug === slug) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const etiket = await etiketiBul(slug);
  if (!etiket) return { title: "Sayfa bulunamadı", robots: { index: false, follow: true } };
  return sayfaMeta({
    baslik: `${etiket.ad} yazıları`,
    aciklama: `“${etiket.ad}” etiketli blog yazıları: rehberler, ipuçları ve uygulamalı anlatımlar.`,
    yol: `/blog/etiket/${etiket.slug}`,
    indeksleme: etiket.adet >= ETIKET_ESIGI,
  });
}

export default async function EtiketSayfasi({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [etiket, yazilar] = await Promise.all([etiketiBul(slug), getYazilarByEtiket(slug)]);
  if (!etiket || yazilar.length === 0) notFound();

  const sema = kirintiSemasi([
    { ad: "Ana sayfa", yol: "/" },
    { ad: "Blog", yol: "/blog" },
    { ad: etiket.ad, yol: `/blog/etiket/${etiket.slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(sema) }} />
      <div className="bg-white">
        <PublicHeader />
        <section className="relative overflow-hidden bg-ink text-white">
          <div className="absolute -top-40 -right-20 h-[520px] w-[520px] rounded-full bg-brand opacity-18 blur-[120px]" />
          <div className="relative mx-auto max-w-[1240px] px-5 pt-20 pb-20 text-center sm:px-8 lg:text-left">
            <div className="flex justify-center lg:justify-start">
              <SectionKicker tone="light">Blog · Etiket</SectionKicker>
            </div>
            <h1 className="mx-auto mt-[18px] max-w-[760px] font-heading text-[34px] leading-[1.08] font-semibold tracking-[-0.035em] break-words sm:text-[46px] lg:mx-0">
              #{etiket.ad}
            </h1>
            <p className="mx-auto mt-5 max-w-[640px] text-[16.5px] leading-[1.65] text-white/72 lg:mx-0">
              Bu etiketle işaretlenmiş {yazilar.length} yazı.
            </p>
          </div>
        </section>

        <main className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8 sm:py-20">
          <Link
            href="/blog/"
            className="inline-flex min-h-11 items-center text-[14px] font-semibold text-brand hover:text-ink"
          >
            ← Tüm yazılar
          </Link>
          <div className="mt-6">
            <DahaFazla>
              {yazilar.map((y) => (
                <YaziKarti key={y.id} yazi={y} />
              ))}
            </DahaFazla>
          </div>
        </main>
        <PublicFooter />
      </div>
    </>
  );
}
