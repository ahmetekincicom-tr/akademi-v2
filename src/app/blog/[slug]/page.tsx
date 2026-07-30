import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { CorporateStrip } from "@/components/site/CorporateStrip";
import { siteNav } from "@/components/site/siteNav";
import { blogPosts, getPostBySlug } from "@/lib/blog";

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  return { title: post ? `${post.baslik} — Ahmet Ekinci Akademi Blog` : "Yazı bulunamadı" };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const digerYazilar = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <div className="bg-white">
      <AnnouncementBar />
      <PublicHeader nav={siteNav} ctaLabel="Eğitimleri incele" ctaHref="/egitimler" />

      <article>
        <section className="mx-auto max-w-[760px] px-8 pt-16 pb-10">
          <div className="flex items-center gap-[10px] font-mono text-[11px] tracking-[0.08em] text-[#8A8F9E]">
            <Link href="/blog" className="hover:text-brand">
              Blog
            </Link>
            <span>/</span>
            <span className="text-ink/70">{post.etiket}</span>
          </div>
          <h1 className="mt-5 font-heading text-[32px] leading-[1.12] font-semibold tracking-[-0.035em] sm:text-[42px]">
            {post.baslik}
          </h1>
          <div className="mt-5 flex items-center gap-3 font-mono text-[11px] tracking-[0.06em] text-[#9CA1AE] uppercase">
            <span>Ahmet Ekinci</span>
            <span>·</span>
            <span>{post.tarih}</span>
            <span>·</span>
            <span>{post.okumaSuresi} okuma</span>
          </div>
        </section>

        <section className="mx-auto max-w-[900px] px-8">
          <div className="placeholder-block flex aspect-[16/8] items-end rounded-2xl p-5">
            <span className="rounded-[7px] bg-white/90 px-[11px] py-[7px] font-mono text-[11px] text-[#8A8F9E]">
              yazı görseli 16:8
            </span>
          </div>
        </section>

        <section className="mx-auto max-w-[760px] px-8 py-14">
          {post.govde.map((block, i) => (
            <div key={i} className={i > 0 ? "mt-6" : ""}>
              {block.baslik && (
                <h2 className="mb-3 font-heading text-xl leading-[1.3] font-semibold tracking-[-0.02em]">{block.baslik}</h2>
              )}
              <p className="text-[16.5px] leading-[1.75] text-[#2B303D]">{block.metin}</p>
            </div>
          ))}
        </section>

        <section className="mx-auto max-w-[760px] px-8 pb-16">
          <div className="rounded-2xl border border-ink/11 bg-mist p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div>
              <div className="font-mono text-[10.5px] tracking-[0.14em] text-brand uppercase">Yazan</div>
              <div className="mt-2 text-[16px] font-semibold">Ahmet Ekinci</div>
              <p className="mt-1 max-w-[380px] text-[13.5px] leading-[1.6] text-[#5C6273]">
                2021&apos;den beri birebir dijital pazarlama eğitimi veriyor.
              </p>
            </div>
            <Link
              href="/hakkimizda"
              className="mt-4 inline-flex h-11 items-center rounded-[10px] border border-ink/13 bg-white px-5 text-sm font-semibold text-ink hover:border-brand hover:text-brand sm:mt-0"
            >
              Hakkımızda →
            </Link>
          </div>
        </section>
      </article>

      {digerYazilar.length > 0 && (
        <section className="mx-auto max-w-[1240px] border-t border-ink/8 px-8 py-16">
          <h2 className="mb-8 font-heading text-2xl font-semibold tracking-[-0.025em]">Diğer yazılar</h2>
          <div className="grid grid-cols-1 gap-[22px] sm:grid-cols-2">
            {digerYazilar.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="rounded-2xl border border-ink/11 p-6 transition hover:-translate-y-1 hover:border-brand/45 hover:shadow-[0_20px_44px_rgba(10,13,24,0.1)]"
              >
                <div className="font-mono text-[10.5px] tracking-[0.08em] text-[#8A8F9E] uppercase">
                  {p.etiket} · {p.okumaSuresi}
                </div>
                <div className="mt-2 font-heading text-lg leading-[1.28] font-semibold tracking-[-0.02em]">{p.baslik}</div>
                <p className="mt-2 text-[14px] leading-[1.55] text-[#5C6273]">{p.ozet}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <CorporateStrip text="Ekibinize özel, yerinde ya da uzaktan dijital pazarlama eğitimi." />
      <PublicFooter />
    </div>
  );
}
