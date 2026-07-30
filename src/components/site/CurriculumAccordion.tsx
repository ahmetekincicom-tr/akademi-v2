"use client";

import { useState } from "react";

export type CurriculumModule = {
  baslik: string;
  meta: string;
  dersler: { ad: string; sure: string }[];
};

export function CurriculumAccordion({ modules }: { modules: CurriculumModule[] }) {
  const [open, setOpen] = useState<number[]>([0]);

  const toggle = (i: number) => {
    setOpen((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : prev.concat(i)));
  };

  const allOpen = open.length === modules.length;
  const toggleAll = () => setOpen(allOpen ? [] : modules.map((_, i) => i));

  return (
    <>
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-[10px] font-mono text-[11px] tracking-[0.16em] text-brand uppercase">
            <span className="h-px w-[22px] bg-brand" />
            Müfredat
          </div>
          <h2 className="mt-[18px] font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[34px]">
            6 modül · 24 ders · 15 saat
          </h2>
        </div>
        <button
          type="button"
          onClick={toggleAll}
          className="py-[6px] font-mono text-[11px] tracking-[0.1em] text-brand uppercase hover:text-ink"
        >
          {allOpen ? "Tümünü kapat" : "Tümünü aç"}
        </button>
      </div>
      <p className="mt-[18px] mb-7 max-w-[620px] text-[15.5px] leading-[1.65] text-[#5C6273]">
        Bu akış standart müfredattır. Ön görüşmeden sonra sektörünüze ve mevcut seviyenize göre modüllerin ağırlığı
        yeniden düzenlenir.
      </p>
      <div className="overflow-hidden rounded-2xl border border-ink/11">
        {modules.map((m, i) => {
          const isOpen = open.includes(i);
          return (
            <div key={m.baslik} className="border-b border-ink/9 bg-white last:border-b-0">
              <button
                type="button"
                onClick={() => toggle(i)}
                className="flex w-full items-center gap-[18px] px-6 py-[22px] text-left transition hover:bg-[#F5F8FF]"
              >
                <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[9px] bg-[#F2F4FA] font-mono text-[12px] font-medium text-brand">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[17.5px] font-semibold tracking-[-0.015em]">{m.baslik}</span>
                  <span className="mt-1 block font-mono text-[11px] tracking-[0.06em] text-[#8A8F9E]">{m.meta}</span>
                </span>
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-[8px] bg-[#F2F4FA] font-mono text-[15px] text-brand">
                  {isOpen ? "–" : "+"}
                </span>
              </button>
              {isOpen && (
                <div className="flex flex-col gap-px py-0 pr-6 pb-[22px] pl-[76px]">
                  {m.dersler.map((d) => (
                    <div
                      key={d.ad}
                      className="flex items-center gap-3 border-t border-ink/7 py-[11px] text-[15px] text-[#3A3F4F]"
                    >
                      <span className="h-[5px] w-[5px] flex-none rounded-full bg-brand" />
                      <span className="flex-1">{d.ad}</span>
                      <span className="font-mono text-[11px] text-[#9CA1AE]">{d.sure}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
