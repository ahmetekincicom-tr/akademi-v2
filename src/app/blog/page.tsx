import Link from "next/link";
import type { Metadata } from "next";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { SectionKicker } from "@/components/site/SectionKicker";
import { siteNav } from "@/components/site/siteNav";
import { blogPosts } from "@/lib/blog";

export const metadata: Metadata = { title: "Blog — Ahmet Ekinci Akademi" };

export default function BlogListingPage() {
  return (
    <div className="bg-white">
      <AnnouncementBar />
      <PublicHeader nav={siteNav} ctaLabel="Eğitimleri incele" ctaHref="/egitimler" />

      <section className="mx-auto max-w-[1240px] px-8 pt-16 pb-14">
        <SectionKicker>Blog</SectionKicker>
        <h1 className="mt-[18px] max-w-[620px] font-heading text-[36px] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-[46px]">
          Meta Ads, sosyal medya ve yapay zekâ üzerine notlar
        </h1>
        <p className="mt-6 max-w-[540px] text-[16.5px] leading-[1.62] text-[#5C6273]">
          Derslerde en çok karşılaştığımız sorulardan ve katılımcı hesaplarında gördüğümüz kalıplardan çıkan pratik
          yazılar.
        </p>
      </section>

      <section className="mx-auto max-w-[1240px] px-8 pb-24">
        <div className="grid grid-cols-1 gap-[22px] md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="flex flex-col overflow-hidden rounded-2xl border border-ink/11 bg-white transition hover:-translate-y-1 hover:border-brand/45 hover:shadow-[0_20px_44px_rgba(10,13,24,0.1)]"
            >
              <div className="placeholder-block flex aspect-video items-end p-[14px]">
                <span className="rounded-[5px] bg-white/90 px-2 py-[5px] font-mono text-[10px] text-[#8A8F9E]">
                  kapak görseli 16:9
                </span>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center gap-2 font-mono text-[10.5px] tracking-[0.08em] text-[#8A8F9E] uppercase">
                  <span>{p.etiket}</span>
                  <span className="text-ink/20">•</span>
                  <span>{p.okumaSuresi}</span>
                </div>
                <h2 className="mt-3 font-heading text-lg leading-[1.28] font-semibold tracking-[-0.02em]">{p.baslik}</h2>
                <p className="mt-2 flex-1 text-[14px] leading-[1.55] text-[#5C6273]">{p.ozet}</p>
                <div className="mt-4 font-mono text-[10.5px] text-[#9CA1AE]">{p.tarih}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
