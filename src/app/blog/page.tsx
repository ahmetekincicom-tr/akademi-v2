import type { Metadata } from "next";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { SectionKicker } from "@/components/site/SectionKicker";
import { getYayindakiYazilar, kategorilerSayili } from "@/lib/yazilar";
import { KategoriCipleri } from "@/components/blog/KategoriCipleri";
import { OneCikanYazi } from "@/components/blog/OneCikanYazi";
import { YaziKarti } from "@/components/blog/YaziKarti";
import { DahaFazla } from "@/components/blog/DahaFazla";
import { sayfaMeta, SITE_URL } from "@/lib/seo";

// Gerekçe: src/app/page.tsx (ISR — saatlik yeniden üretim).
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const meta = await sayfaMeta({
    baslik: "Blog",
    aciklama:
      "Meta (Facebook & Instagram) reklamları, sosyal medya yönetimi ve dijital pazarlama üzerine rehberler, ipuçları ve güncel stratejiler.",
    yol: "/blog",
  });
  // Feed okuyucular için otomatik keşif bağlantısı.
  return {
    ...meta,
    alternates: { ...meta.alternates, types: { "application/rss+xml": `${SITE_URL}/blog/rss.xml` } },
  };
}

export default async function BlogPage() {
  const [yazilar, kategoriler] = await Promise.all([getYayindakiYazilar(), kategorilerSayili()]);
  const [oneCikan, ...digerleri] = yazilar;

  return (
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
        <div className="absolute -top-40 -right-20 h-[520px] w-[520px] rounded-full bg-brand opacity-18 blur-[120px]" />
        <div className="relative mx-auto max-w-[1240px] px-5 pt-20 pb-24 text-center sm:px-8 lg:text-left">
          <div className="flex justify-center lg:justify-start">
            <SectionKicker tone="light">Blog</SectionKicker>
          </div>
          <h1 className="mx-auto mt-[18px] max-w-[640px] font-heading text-[38px] leading-[1.06] font-semibold tracking-[-0.035em] sm:text-[48px] lg:mx-0">
            Dijital pazarlama rehberleri
          </h1>
          <p className="mx-auto mt-6 max-w-[620px] text-[17px] leading-[1.62] text-white/70 lg:mx-0">
            Meta reklamları, sosyal medya yönetimi ve yapay zekâ araçları üzerine uygulanabilir yazılar.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8 sm:py-20">
        <KategoriCipleri kategoriler={kategoriler} etkin={null} />
        {!oneCikan ? (
          <div className="mt-10 rounded-2xl border border-dashed border-ink/15 bg-mist p-12 text-center text-[15px] text-[#5C6273]">
            Yakında ilk yazılar burada olacak.
          </div>
        ) : (
          <>
            <div className="mt-10">
              <OneCikanYazi yazi={oneCikan} />
            </div>
            {digerleri.length > 0 && (
              <div className="mt-12">
                <h2 className="sr-only">Tüm yazılar</h2>
                <DahaFazla>
                  {digerleri.map((y) => (
                    <YaziKarti key={y.id} yazi={y} baslik="h3" />
                  ))}
                </DahaFazla>
              </div>
            )}
          </>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
