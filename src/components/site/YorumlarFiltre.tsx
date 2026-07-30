"use client";

import { useMemo, useState } from "react";
import { TestimonialCard } from "@/components/site/TestimonialCard";
import type { Course, Testimonial } from "@/lib/courses";

const genel: Testimonial[] = [
  {
    metin:
      "Her soruma anında ve detaylı geri bildirim aldığım akıcı bir eğitimdi. Birebir olması “sıkılır mıyız?” endişesi yaratmıştı ama hiç bitmesin istedim.",
    isim: "Selame Hopurcuoğlu Yorulmaz",
    rol: "Oyunlaştırma Tasarımcısı",
  },
  { metin: "Eğitim sonrasında da her zaman destek vereceğini garanti etmesi insanı güvende hissettiriyor.", isim: "Seren Aker", rol: "Lojistik" },
  {
    metin: "Çalıştığım firmanın detaylarına hâkim olması ve önceden araştırma yaparak hazırlanması eğitimi çok daha verimli kıldı.",
    isim: "Yasemin Turan",
    rol: "Marketing Communication Specialist",
  },
];

export function YorumlarFiltre({ courses }: { courses: Course[] }) {
  const gruplar: { etiket: string; yorumlar: Testimonial[] }[] = [
    { etiket: "Genel", yorumlar: genel },
    ...courses.map((c) => ({ etiket: c.baslikVurgu, yorumlar: c.yorumlar })),
  ];

  const [tab, setTab] = useState("Tümü");
  const tabs = ["Tümü", ...gruplar.map((g) => g.etiket)];

  const gosterilecek = useMemo(() => {
    if (tab === "Tümü") return gruplar.flatMap((g) => g.yorumlar);
    return gruplar.find((g) => g.etiket === tab)?.yorumlar ?? [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, courses]);

  return (
    <section className="mx-auto max-w-[1240px] px-8 pb-24">
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
