import Link from "next/link";
import type { PanelCourse } from "@/lib/panel";

/**
 * Panel özetindeki eğitim listesi. Eğitim adı sarıyor, kesilmiyor: telefonda
 * "Birebir Meta Business Eğitimi" → "Birebir Meta Busi…" oluyordu ve iki kurs
 * birbirinden ayırt edilemiyordu. İlerleme çubuğu da sol sütuna sıkışmak yerine
 * satırın tamamını kullanıyor.
 */
export function EgitimlerimKarti({ courses }: { courses: PanelCourse[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
      <div className="border-b border-ink/8 px-5 py-4 sm:px-6 sm:py-5">
        <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Eğitimlerim</h2>
      </div>
      {courses.map((c) => (
        <div key={c.id} className="border-b border-ink/8 px-5 py-5 last:border-b-0 sm:px-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="min-w-0 flex-1 text-[15px] leading-[1.35] font-semibold text-ink">{c.baslik}</div>
            <div className="flex flex-none items-center gap-[10px] sm:gap-4">
              <span className="font-mono text-[13px] font-medium text-brand">{c.yuzde}%</span>
              <Link
                href={`/panel/dersler?kurs=${c.slug}`}
                className="inline-flex h-9 items-center rounded-[9px] border border-ink/13 bg-white px-3 text-[13px] font-semibold whitespace-nowrap text-ink hover:border-brand hover:text-brand sm:px-[15px] sm:text-[13.5px]"
              >
                {c.yuzde === 100 ? "Tekrar izle" : "Devam et"}
              </Link>
            </div>
          </div>
          {/* Künye satırın tamamını alıyor: dar sol sütunda "22 / saat" diye
              ikiye bölünüyordu. */}
          <div className="mt-[7px] font-mono text-[11.5px] leading-[1.5] text-[#656B7A]">
            {c.modules.length} modül · {c.dersSayisi} ders{c.sure ? ` · ${c.sure}` : ""}
          </div>
          <div className="mt-[11px] h-[6px] w-full overflow-hidden rounded-full bg-mist">
            <div className="h-full rounded-full bg-brand" style={{ width: `${c.yuzde}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
