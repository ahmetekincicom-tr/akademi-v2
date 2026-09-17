import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { YaziEditoru } from "@/components/admin/YaziEditoru";
import { yaziGetirAdmin } from "@/lib/yazilar";

export default async function YaziDuzenlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const yazi = await yaziGetirAdmin(slug, supabase);
  if (!yazi) notFound();

  return (
    <main className="p-4 pb-14 sm:p-7">
      <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
        Yazıyı düzenle
      </h1>
      <div className="mt-6">
        <YaziEditoru mevcut={yazi} />
      </div>
    </main>
  );
}
