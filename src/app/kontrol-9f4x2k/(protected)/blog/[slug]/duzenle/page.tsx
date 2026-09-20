import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { YaziEditoru } from "@/components/admin/YaziEditoru";
import { BlogSekmeler } from "@/components/admin/BlogSekmeler";
import { yaziGetirAdmin, getKategoriler, icLinkHedefleri } from "@/lib/yazilar";

export default async function YaziDuzenlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const [yazi, kategoriler, icHedefler] = await Promise.all([
    yaziGetirAdmin(slug, supabase),
    getKategoriler(),
    icLinkHedefleri(),
  ]);
  if (!yazi) notFound();

  return (
    <main className="p-4 pb-14 sm:p-7">
      <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
        {yazi.baslik}
      </h1>
      <BlogSekmeler slug={slug} aktif="icerik" />
      <div className="mt-6">
        <YaziEditoru mevcut={yazi} kategoriler={kategoriler} icHedefler={icHedefler} />
      </div>
    </main>
  );
}
