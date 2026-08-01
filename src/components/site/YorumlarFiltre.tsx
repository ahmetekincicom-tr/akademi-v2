"use client";

import { useMemo, useState } from "react";
import { TestimonialCard } from "@/components/site/TestimonialCard";
import type { Testimonial } from "@/lib/courses";
import type { Yorum } from "@/lib/icerik";


export function YorumlarFiltre({
  yorumlar,
  kurslar,
}: {
  yorumlar: Yorum[];
  kurslar: { id: string; etiket: string }[];
}) {
  const cevir = (y: Yorum): Testimonial => ({ metin: y.metin, isim: y.isim, rol: y.rol });

  const gruplar: { etiket: string; yorumlar: Testimonial[] }[] = [
    { etiket: "Genel", yorumlar: yorumlar.filter((y) => !y.courseId).map(cevir) },
    ...kurslar.map((k) => ({
      etiket: k.etiket,
      yorumlar: yorumlar.filter((y) => y.courseId === k.id).map(cevir),
    })),
  ];

  const [tab, setTab] = useState("Tümü");
  const tabs = ["Tümü", ...gruplar.map((g) => g.etiket)];

  const gosterilecek = useMemo(() => {
    if (tab === "Tümü") return gruplar.flatMap((g) => g.yorumlar);
    return gruplar.find((g) => g.etiket === tab)?.yorumlar ?? [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, yorumlar, kurslar]);

  return (
    <section className="mx-auto max-w-[1240px] px-5 sm:px-8 pb-24">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const secili = tab === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className="h-11 rounded-[10px] border px-5 text-sm font-semibold hover:border-brand"
              style={{
                background: secili ? "#0A0D18" : "#FFFFFF",
                color: secili ? "#FFFFFF" : "#3A3F4F",
                borderColor: secili ? "#0A0D18" : "rgba(10,13,24,0.13)",
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      <div className="mt-9 grid grid-cols-1 gap-[22px] md:grid-cols-2 lg:grid-cols-3">
        {gosterilecek.map((y) => (
          <TestimonialCard key={y.isim + y.metin.slice(0, 12)} {...y} />
        ))}
      </div>
    </section>
  );
}
