import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { CorporateStrip } from "@/components/site/CorporateStrip";
import { SectionKicker } from "@/components/site/SectionKicker";
import { EgitimlerFiltre } from "@/components/site/EgitimlerFiltre";
import { getCourses } from "@/lib/courses";
import type { Metadata } from "next";
import { sayfaMeta } from "@/lib/seo";

// Gerekçe: src/app/page.tsx
export const revalidate = 3600;

// Paylaşım görseli panelden okunduğu için metadata istek anında üretiliyor.
export function generateMetadata(): Promise<Metadata> {
  return sayfaMeta({
  baslik: "Eğitim Programları",
  aciklama:
    "Meta Ads reklam yönetimi, sosyal medya yönetimi ve yapay zekâ araçları eğitimleri. Kapsam ön görüşmede sana göre kurulur.",
  yol: "/egitimler",
});
}

export default async function EgitimlerPage() {
  const courses = await getCourses();

  return (
    <div className="bg-white">
      <PublicHeader />

      <section className="relative overflow-hidden bg-ink text-white">
        <div
          className="bg-grid-dark absolute inset-0"
          style={{
            maskImage: "radial-gradient(120% 90% at 25% 15%, #000 30%, transparent 78%)",
            WebkitMaskImage: "radial-gradient(120% 90% at 25% 15%, #000 30%, transparent 78%)",
          }}
        />
        <div className="absolute -top-40 -right-20 h-[520px] w-[520px] rounded-full bg-brand opacity-18 blur-[120px]" />
        {/*
          Dar ekranda ORTALI, geniş ekranda sola yaslı.

          Mobilde tek sütuna inen hero'da başlık, açıklama ve altındaki
          kategori düğmeleri farklı uzunlukta bitiyor ve sola yaslıyken blok
          dağınık duruyordu. Masaüstünde satırlar zaten yan yana bir düzen
          kuruyor, orada ortalamak gereksiz.
        */}
        <div className="relative mx-auto max-w-[1240px] px-5 pt-20 pb-24 text-center sm:px-8 lg:text-left">
          <div className="flex justify-center lg:justify-start">
            <SectionKicker tone="light">Ahmet Ekinci Akademi</SectionKicker>
          </div>
          <h1 className="mx-auto mt-[18px] max-w-[640px] font-heading text-[38px] leading-[1.06] font-semibold tracking-[-0.035em] sm:text-[48px] lg:mx-0">
            Birebir Eğitimler
          </h1>
          <p className="mx-auto mt-6 max-w-[620px] text-[17px] leading-[1.62] text-white/70 lg:mx-0">
            Sosyal medya, reklamcılık ve dijital pazarlama alanlarında birebir, uygulamalı ve size özel eğitimlerle
            profesyonel gelişiminize yön verin.
          </p>
        </div>
      </section>

      <EgitimlerFiltre courses={courses} />

      <CorporateStrip text="Ekibinize özel, yerinde ya da uzaktan dijital pazarlama eğitimi." />
      <PublicFooter />
    </div>
  );
}
