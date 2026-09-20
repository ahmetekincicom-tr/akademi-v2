import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { yaziGetirAdmin } from "@/lib/yazilar";
import { blogDetayMetrikleri, type DetaySonuc } from "@/lib/google/ga4-rapor";
import { gscDetayMetrikleri, type GscDetaySonuc } from "@/lib/google/gsc-rapor";
import { BlogSekmeler } from "@/components/admin/BlogSekmeler";
import { BlogPerformans } from "@/components/admin/BlogPerformans";

export const dynamic = "force-dynamic";

export default async function YaziPerformansPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const yazi = await yaziGetirAdmin(slug, supabase);
  if (!yazi) notFound();

  // GA4 ve Search Console raporlaması CMS'ten bağımsız ve birbirinden bağımsız:
  // biri hata verse de sayfa açılır, diğeri gösterilir.
  let sonuc: DetaySonuc | null = null;
  let hata = false;
  let gscSonuc: GscDetaySonuc | null = null;
  let gscHata = false;
  const [ga4Sonuc, gscYanit] = await Promise.allSettled([
    blogDetayMetrikleri(slug),
    gscDetayMetrikleri(slug),
  ]);
  if (ga4Sonuc.status === "fulfilled") sonuc = ga4Sonuc.value;
  else {
    console.error("[blog-performans] GA4 alınamadı:", ga4Sonuc.reason);
    hata = true;
  }
  if (gscYanit.status === "fulfilled") gscSonuc = gscYanit.value;
  else {
    console.error("[blog-performans] Search Console alınamadı:", gscYanit.reason);
    gscHata = true;
  }

  return (
    <main className="p-4 pb-14 sm:p-7">
      <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
        {yazi.baslik}
      </h1>
      <BlogSekmeler slug={slug} aktif="performans" />
      <div className="mt-6">
        <BlogPerformans sonuc={sonuc} hata={hata} gscSonuc={gscSonuc} gscHata={gscHata} />
      </div>
    </main>
  );
}
