import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/lib/admin/shared";
import { kapakUrl } from "@/lib/kapak";

const DURUM_ETIKET: Record<string, string> = {
  taslak: "Taslak",
  yayinda: "Yayında",
  arsivlendi: "Arşivlendi",
};

export default async function EgitimlerListePage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("slug, baslik, sure, durum, kapak_gorsel, sitede_gorunur, satisa_acik, fiyat_gorunur, modules(lessons(id))")
    .order("created_at", { ascending: true });

  return (
    <main className="p-4 pb-14 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
            Eğitimler
          </h1>
          <p className="mt-[7px] text-[14.5px] text-[#5C6273]">Program, modül ve ders yapısı; yayın durumu ve fiyat görünürlüğü.</p>
        </div>
        <Link
          href="/admin/egitimler/yeni"
          className="flex h-[42px] items-center rounded-[10px] bg-brand px-[18px] text-sm font-semibold text-white hover:bg-ink"
        >
          + Yeni eğitim ekle
        </Link>
      </div>

      <div className="mt-[22px] flex flex-col gap-[14px]">
        {(courses ?? []).map((e) => {
          const dersSayi = e.modules.reduce((n, m) => n + m.lessons.length, 0);
          const meta = [e.sure, `${e.modules.length} modül`, `${dersSayi} ders`].filter(Boolean).join(" · ");
          return (
            // Kart mobilde tek sütun: yan yana dizilen başlık, durum üçlüsü ve
            // düğme dar ekranda üst üste biniyordu.
            <div
              key={e.slug}
              className="flex flex-col gap-4 rounded-[15px] border border-ink/10 bg-white p-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-[18px] sm:p-5"
            >
              <div className="flex min-w-0 items-center gap-4 sm:flex-1">
                {kapakUrl(e.kapak_gorsel) ? (
                  /* eslint-disable-next-line @next/next/no-img-element -- Supabase
                     Storage konağı next/image için remotePatterns'a eklenmeli. */
                  <img
                    src={kapakUrl(e.kapak_gorsel)!}
                    alt=""
                    className="aspect-[16/10] w-[78px] flex-none rounded-[10px] object-cover sm:w-[112px]"
                  />
                ) : (
                  <div className="placeholder-block aspect-[16/10] w-[78px] flex-none rounded-[10px] sm:w-[112px]" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-[10px]">
                    <span className="text-[15.5px] leading-[1.25] font-semibold tracking-[-0.015em] sm:text-[16.5px]">
                      {e.baslik}
                    </span>
                    <StatusBadge durum={DURUM_ETIKET[e.durum] ?? e.durum} />
                  </div>
                  <div className="mt-[6px] font-mono text-[11px] text-[#656B7A]">{meta}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 border-t border-ink/8 pt-3 sm:flex sm:flex-none sm:gap-[22px] sm:border-t-0 sm:pt-0">
                {[
                  { etiket: "Sitede", deger: e.sitede_gorunur ? "Görünür" : "Gizli" },
                  { etiket: "Satış", deger: e.satisa_acik ? "Açık" : "Kapalı" },
                  { etiket: "Fiyat", deger: e.fiyat_gorunur ? "Görünür" : "Gizli" },
                ].map((s) => (
                  <div key={s.etiket}>
                    <div className="font-mono text-[9.5px] tracking-[0.12em] text-[#656B7A] uppercase">{s.etiket}</div>
                    <div className="mt-[6px] text-[13.5px] font-semibold tracking-[-0.01em]">{s.deger}</div>
                  </div>
                ))}
              </div>

              <Link
                href={`/admin/egitimler/${e.slug}/duzenle`}
                className="flex h-[42px] flex-none items-center justify-center rounded-[9px] border border-ink/13 bg-white px-[15px] text-[13.5px] font-semibold text-ink hover:border-brand hover:bg-brand hover:text-white sm:h-[38px]"
              >
                Düzenle
              </Link>
            </div>
          );
        })}
        {(!courses || courses.length === 0) && (
          <div className="rounded-[15px] border border-dashed border-ink/15 bg-white p-8 text-center text-sm text-[#656B7A]">
            Henüz eğitim eklenmedi.
          </div>
        )}
      </div>
    </main>
  );
}
