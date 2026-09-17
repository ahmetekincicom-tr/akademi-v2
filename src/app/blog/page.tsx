import Link from "next/link";
import type { Metadata } from "next";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { SectionKicker } from "@/components/site/SectionKicker";
import { getYayindakiYazilar } from "@/lib/yazilar";
import { sayfaMeta } from "@/lib/seo";

// Gerekçe: src/app/page.tsx (ISR — saatlik yeniden üretim).
export const revalidate = 3600;

export function generateMetadata(): Promise<Metadata> {
  return sayfaMeta({
    baslik: "Blog",
    aciklama:
      "Meta (Facebook & Instagram) reklamları, sosyal medya yönetimi ve dijital pazarlama üzerine rehberler, ipuçları ve güncel stratejiler.",
    yol: "/blog",
  });
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

export default async function BlogPage() {
  const yazilar = await getYayindakiYazilar();

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

      <main className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8">
        {yazilar.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink/15 bg-mist p-12 text-center text-[15px] text-[#5C6273]">
            Yakında ilk yazılar burada olacak.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {yazilar.map((y) => (
              <Link
                key={y.id}
                href={`/blog/${y.slug}`}
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
  );
}
