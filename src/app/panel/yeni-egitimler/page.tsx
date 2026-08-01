import Link from "next/link";
import { getOnerilenCourses } from "@/lib/panel";

export default async function YeniEgitimlerPage() {
  const urunler = await getOnerilenCourses();

  return (
    <main className="p-4 pb-14 sm:p-[34px]">
      <h1 className="font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[32px]">
        Yeni eğitimler
      </h1>
      <p className="mt-2 max-w-[620px] text-[15px] text-[#5C6273]">
        Henüz kayıtlı olmadığın programlar. Kapsam ön görüşmede sana göre kurulur; buradan doğrudan başvurabilirsin.
      </p>

      {urunler.length === 0 ? (
        <div className="mt-[26px] rounded-2xl border border-ink/10 bg-white px-8 py-14 text-center">
          <h2 className="font-heading text-xl font-semibold tracking-[-0.02em]">Şu an başvurabileceğin yeni program yok</h2>
          <p className="mx-auto mt-[10px] max-w-[440px] text-[14.5px] leading-[1.6] text-[#5C6273]">
            Yayındaki tüm eğitimlere zaten kayıtlısın. Yeni bir program açıldığında burada görünecek.
          </p>
        </div>
      ) : (
        <div className="mt-[26px] grid grid-cols-1 gap-5 md:grid-cols-2">
          {urunler.map((u) => (
            <div
              key={u.slug}
              className="flex gap-[18px] rounded-2xl border border-ink/10 bg-white p-6 transition hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(10,13,24,0.1)]"
            >
              <div className="placeholder-block aspect-[4/3] w-[120px] flex-none rounded-[11px]" />
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="font-mono text-[10.5px] tracking-[0.08em] text-[#656B7A]">
                  {[u.sure, u.etiket].filter(Boolean).join(" · ")}
                </div>
                <div className="mt-[9px] font-heading text-[19px] leading-[1.22] font-semibold tracking-[-0.02em]">
                  {u.baslik}
                </div>
                <p className="mt-2 mb-[18px] text-[14.5px] leading-[1.55] text-[#5C6273]">{u.aciklama}</p>
                <Link
                  href={`/egitimler/${u.slug}`}
                  className="mt-auto inline-flex h-[42px] w-fit items-center rounded-[9px] bg-brand px-[18px] text-[14.5px] font-semibold text-white hover:bg-ink"
                >
                  Programı incele →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
