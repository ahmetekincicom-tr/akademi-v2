import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { YonlendirmeYonetimi, type YonlendirmeSatir } from "@/components/admin/YonlendirmeYonetimi";

export const dynamic = "force-dynamic";

export default async function YonlendirmelerPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("yonlendirmeler")
    .select("id, kaynak, hedef, kod, aktif, otomatik, notu, updated_at, post:posts(baslik)")
    .order("updated_at", { ascending: false })
    .limit(2000);

  const satirlar: YonlendirmeSatir[] = (data ?? []).map((r) => ({
    id: r.id,
    kaynak: r.kaynak,
    hedef: r.hedef,
    kod: r.kod === 410 ? 410 : 301,
    aktif: r.aktif,
    otomatik: r.otomatik,
    notu: r.notu,
    guncelleme: r.updated_at,
    yazi: (r.post as { baslik: string } | null)?.baslik ?? null,
  }));

  return (
    <main className="p-4 pb-14 sm:p-7">
      <Link href="/kontrol-9f4x2k/blog" className="text-[13px] font-semibold text-brand hover:text-ink">
        ← Blog
      </Link>
      <h1 className="mt-3 font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
        Yönlendirmeler
      </h1>
      <p className="mt-[7px] max-w-[760px] text-[14.5px] leading-[1.6] text-[#5C6273]">
        Adresi değişen, yayından kalkan ya da silinen yazı ve kategorilerin eski adresleri burada. Çoğu kendiliğinden
        yazılır; istersen elle de ekleyebilirsin. Değişiklik en geç bir dakika içinde sitede geçerli olur.
      </p>
      {error && (
        <p className="mt-4 rounded-[12px] border border-danger/30 bg-danger/[0.06] px-4 py-3 text-[14px] text-danger">
          Yönlendirmeler okunamadı: {error.message}
        </p>
      )}
      <div className="mt-6">
        <YonlendirmeYonetimi satirlar={satirlar} />
      </div>
    </main>
  );
}
