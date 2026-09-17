import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/lib/admin/shared";
import { tumYazilarAdmin } from "@/lib/yazilar";

const DURUM_ETIKET: Record<string, string> = { taslak: "Taslak", yayin: "Yayında" };

function tarih(deger: string | null): string {
  if (!deger) return "—";
  try {
    return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" }).format(
      new Date(deger),
    );
  } catch {
    return "—";
  }
}

export default async function BlogListePage() {
  const supabase = await createClient();
  const yazilar = await tumYazilarAdmin(supabase);

  return (
    <main className="p-4 pb-14 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
            Blog
          </h1>
          <p className="mt-[7px] text-[14.5px] text-[#5C6273]">Yazıları oluştur, düzenle ve yayınla.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/kontrol-9f4x2k/blog/kategoriler"
            className="flex h-[42px] items-center rounded-[10px] border border-ink/13 bg-white px-[16px] text-sm font-semibold text-[#5C6273] hover:border-brand hover:text-brand"
          >
            Kategoriler
          </Link>
          <Link
            href="/kontrol-9f4x2k/blog/yeni"
            className="flex h-[42px] items-center rounded-[10px] bg-brand px-[18px] text-sm font-semibold text-white hover:bg-ink"
          >
            + Yeni yazı
          </Link>
        </div>
      </div>

      <div className="mt-[22px] flex flex-col gap-[14px]">
        {yazilar.map((y) => (
          <div
            key={y.id}
            className="flex flex-col gap-4 rounded-[15px] border border-ink/10 bg-white p-4 sm:flex-row sm:items-center sm:gap-[18px] sm:p-5"
          >
            <div className="flex min-w-0 items-center gap-4 sm:flex-1">
              {y.kapak ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={y.kapak} alt="" className="aspect-[16/10] w-[78px] flex-none rounded-[10px] object-cover sm:w-[112px]" />
              ) : (
                <div className="placeholder-block aspect-[16/10] w-[78px] flex-none rounded-[10px] sm:w-[112px]" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-[10px]">
                  <span className="text-[15.5px] leading-[1.25] font-semibold tracking-[-0.015em] sm:text-[16.5px]">
                    {y.baslik}
                  </span>
                  <StatusBadge durum={DURUM_ETIKET[y.durum] ?? y.durum} />
                </div>
                <div className="mt-[6px] font-mono text-[11px] text-[#656B7A]">
                  /blog/{y.slug} · {y.durum === "yayin" ? `Yayın: ${tarih(y.yayinTarihi)}` : `Güncellendi: ${tarih(y.guncelleme)}`}
                </div>
              </div>
            </div>

            <div className="flex flex-none gap-2">
              {y.durum === "yayin" && (
                <Link
                  href={`/blog/${y.slug}`}
                  target="_blank"
                  className="flex h-[42px] items-center justify-center rounded-[9px] border border-ink/13 bg-white px-[15px] text-[13.5px] font-semibold text-[#5C6273] hover:border-brand hover:text-brand sm:h-[38px]"
                >
                  Gör
                </Link>
              )}
              <Link
                href={`/kontrol-9f4x2k/blog/${y.slug}/duzenle`}
                className="flex h-[42px] items-center justify-center rounded-[9px] border border-ink/13 bg-white px-[15px] text-[13.5px] font-semibold text-ink hover:border-brand hover:bg-brand hover:text-white sm:h-[38px]"
              >
                Düzenle
              </Link>
            </div>
          </div>
        ))}
        {yazilar.length === 0 && (
          <div className="rounded-[15px] border border-dashed border-ink/15 bg-white p-8 text-center text-sm text-[#656B7A]">
            Henüz yazı eklenmedi.
          </div>
        )}
      </div>
    </main>
  );
}
