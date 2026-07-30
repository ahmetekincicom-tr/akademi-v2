"use client";

import { useMemo, useState } from "react";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { CorporateStrip } from "@/components/site/CorporateStrip";
import { TestimonialCard } from "@/components/site/TestimonialCard";
import { SectionKicker } from "@/components/site/SectionKicker";
import { siteNav } from "@/components/site/siteNav";
import { courses, type Testimonial } from "@/lib/courses";

const genel: Testimonial[] = [
  { metin: "Her soruma anında ve detaylı geri bildirim aldığım akıcı bir eğitimdi. Birebir olması “sıkılır mıyız?” endişesi yaratmıştı ama hiç bitmesin istedim.", isim: "Selame Hopurcuoğlu Yorulmaz", rol: "Oyunlaştırma Tasarımcısı" },
  { metin: "Eğitim sonrasında da her zaman destek vereceğini garanti etmesi insanı güvende hissettiriyor.", isim: "Seren Aker", rol: "Lojistik" },
  { metin: "Çalıştığım firmanın detaylarına hâkim olması ve önceden araştırma yaparak hazırlanması eğitimi çok daha verimli kıldı.", isim: "Yasemin Turan", rol: "Marketing Communication Specialist" },
];

const gruplar: { etiket: string; yorumlar: Testimonial[] }[] = [
  { etiket: "Genel", yorumlar: genel },
  ...courses.map((c) => ({ etiket: c.baslikVurgu, yorumlar: c.yorumlar })),
];

export default function YorumlarPage() {
  const [tab, setTab] = useState("Tümü");
  const tabs = ["Tümü", ...gruplar.map((g) => g.etiket)];

  const gosterilecek = useMemo(() => {
    if (tab === "Tümü") return gruplar.flatMap((g) => g.yorumlar);
    return gruplar.find((g) => g.etiket === tab)?.yorumlar ?? [];
  }, [tab]);

  return (
    <div className="bg-white">
      <AnnouncementBar />
      <PublicHeader nav={siteNav} ctaLabel="Eğitimleri incele" ctaHref="/egitimler" />

      <section className="mx-auto max-w-[1240px] px-8 pt-16 pb-10">
        <SectionKicker>Katılımcı yorumları</SectionKicker>
        <h1 className="mt-[18px] max-w-[640px] font-heading text-[36px] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-[46px]">
          Eğitimden sonra ne değişti
        </h1>
        <p className="mt-6 max-w-[560px] text-[16.5px] leading-[1.62] text-[#5C6273]">
          Programa göre filtreleyip katılımcıların kendi cümleleriyle ne değiştiğini okuyabilirsiniz.
        </p>
      </section>

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

      <CorporateStrip text="Ekibinize özel, yerinde ya da uzaktan dijital pazarlama eğitimi." />
      <PublicFooter />
    </div>
  );
}
