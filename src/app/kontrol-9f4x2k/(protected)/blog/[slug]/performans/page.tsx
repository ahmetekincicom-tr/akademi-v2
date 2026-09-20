import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { yaziGetirAdmin } from "@/lib/yazilar";
import { blogDetayMetrikleri, type DetaySonuc } from "@/lib/google/ga4-rapor";
import { BlogSekmeler } from "@/components/admin/BlogSekmeler";
import { BlogPerformans } from "@/components/admin/BlogPerformans";

export const dynamic = "force-dynamic";

export default async function YaziPerformansPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const yazi = await yaziGetirAdmin(slug, supabase);
  if (!yazi) notFound();

  // GA4 raporlaması CMS'ten bağımsız: hata olsa da sayfa açılır.
  let sonuc: DetaySonuc | null = null;
  let hata = false;
  try {
    sonuc = await blogDetayMetrikleri(slug);
  } catch (e) {
    console.error("[blog-performans] GA4 alınamadı:", e);
    hata = true;
  }

  return (
    <main className="p-4 pb-14 sm:p-7">
      <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
        {yazi.baslik}
      </h1>
      <BlogSekmeler slug={slug} aktif="performans" />
      <div className="mt-6">
        <BlogPerformans sonuc={sonuc} hata={hata} />
      </div>
    </main>
  );
}
