import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { KategoriYonetimi } from "@/components/admin/KategoriYonetimi";
import { getKategoriler } from "@/lib/yazilar";

export default async function KategorilerPage() {
  const supabase = await createClient();
  const [kategoriler, { data: sayimlar }] = await Promise.all([
    getKategoriler(supabase),
    supabase.from("posts").select("kategori_id"),
  ]);

  const say = new Map<string, number>();
  for (const r of sayimlar ?? []) {
    if (r.kategori_id) say.set(r.kategori_id, (say.get(r.kategori_id) ?? 0) + 1);
  }
  const liste = kategoriler.map((k) => ({ ...k, adet: say.get(k.id) ?? 0 }));

  return (
    <main className="p-4 pb-14 sm:p-7">
      <Link href="/kontrol-9f4x2k/blog" className="text-[13px] font-semibold text-brand hover:text-ink">
        ← Blog
      </Link>
      <h1 className="mt-3 font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
        Kategoriler
      </h1>
      <p className="mt-[7px] text-[14.5px] text-[#5C6273]">
        Kategoriler yazıları gruplar ve her biri kendi arşiv sayfasına (/blog/kategori/…) sahiptir.
      </p>
      <div className="mt-6">
        <KategoriYonetimi kategoriler={liste} />
      </div>
    </main>
  );
}
