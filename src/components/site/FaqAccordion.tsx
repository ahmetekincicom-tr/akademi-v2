"use client";

import { useState } from "react";

export type FaqItem = { soru: string; cevap: string };

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="border-t border-ink/11">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.soru} className="border-b border-ink/11">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-6 py-6 pr-0.5 pl-0.5 text-left font-sans text-ink hover:text-brand"
            >
              <span className="text-[17.5px] font-semibold tracking-[-0.015em]">{item.soru}</span>
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-[8px] bg-[#F2F4FA] font-mono text-[15px] text-brand">
                {isOpen ? "–" : "+"}
              </span>
            </button>
            {isOpen && (
              <p className="m-0 pr-16 pb-[26px] pl-0.5 text-[15.5px] leading-[1.7] text-[#5C6273]">{item.cevap}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
