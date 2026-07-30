import Link from "next/link";
import { adminOzetCourses } from "@/lib/admin/data";
import { StatusBadge } from "@/lib/admin/shared";

export default function EgitimlerListePage() {
  return (
    <main className="p-7 pb-14">
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
        {adminOzetCourses.map((e) => (
          <div key={e.ad} className="flex flex-wrap items-center gap-[18px] rounded-[15px] border border-ink/10 bg-white p-5 px-5">
            <div className="placeholder-block aspect-[16/10] w-[112px] flex-none rounded-[10px]" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-[10px]">
                <span className="text-[16.5px] font-semibold tracking-[-0.015em]">{e.ad}</span>
                <StatusBadge durum={e.durum} />
              </div>
              <div className="mt-[6px] font-mono text-[11px] text-[#8A8F9E]">{e.meta}</div>
            </div>
            <div className="flex flex-none gap-[34px]">
              {[
                { etiket: "Öğrenci", deger: e.ogrenci },
                { etiket: "Tamamlanma", deger: e.tamamlanma },
                { etiket: "Gelir", deger: e.gelir },
              ].map((s) => (
                <div key={s.etiket}>
                  <div className="font-mono text-[9.5px] tracking-[0.12em] text-[#8A8F9E] uppercase">{s.etiket}</div>
                  <div className="mt-[6px] font-heading text-[17px] font-semibold tracking-[-0.02em]">{s.deger}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-none gap-[9px]">
              <Link
                href={e.slug ? `/admin/egitimler/${e.slug}/duzenle` : "/admin/egitimler/yeni"}
                className="flex h-[38px] items-center rounded-[9px] border border-ink/13 bg-white px-[15px] text-[13.5px] font-semibold text-ink hover:border-brand hover:bg-brand hover:text-white"
              >
                Düzenle
              </Link>
              <button
                type="button"
                className="flex h-[38px] w-[38px] items-center justify-center rounded-[9px] border border-ink/13 bg-white text-sm text-[#5C6273] hover:border-ink hover:text-ink"
              >
                ⋯
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
