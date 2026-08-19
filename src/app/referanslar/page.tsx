import type { Metadata } from "next";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { CorporateStrip } from "@/components/site/CorporateStrip";
import { SectionKicker } from "@/components/site/SectionKicker";
import { getReferanslar } from "@/lib/icerik";
import { ReferansLogo } from "@/components/site/ReferansLogo";
import { sayfaMeta } from "@/lib/seo";

// Paylaşım görseli panelden okunduğu için metadata istek anında üretiliyor.
export function generateMetadata(): Promise<Metadata> {
  return sayfaMeta({
  baslik: "Referanslar",
  aciklama:
    "Ahmet Ekinci Akademi eğitimlerini tercih eden kurumlar ve markalar. Birebir dijital pazarlama eğitimi alan ekiplerin listesi.",
  yol: "/referanslar",
});
}

// Referanslar admin panelinden yönetiliyor.
export const dynamic = "force-dynamic";

export default async function ReferanslarPage() {
  const referanslar = await getReferanslar();

  return (
    <div className="bg-white">
      <PublicHeader />

      <section className="mx-auto max-w-[1240px] px-5 pt-16 pb-12 sm:px-8">
        <SectionKicker>Referanslar</SectionKicker>
        <h1 className="mt-[18px] font-heading text-[36px] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-[46px]">
          Referanslar
        </h1>
        <p className="mt-6 max-w-[560px] text-[16.5px] leading-[1.62] text-[#5C6273]">
          Eğitimlerimizi tercih eden kuruluşlar &amp; referanslar
        </p>
      </section>

      {/*
        Üç sütun ve gri: logolar farklı renklerde ve farklı yoğunluklarda
        olduğu için renkli bir ızgara alacalı görünüyor. Gri hepsini aynı ağırlığa
        indiriyor; üzerine gelince kendi rengine dönüyor.
      */}
      <section className="mx-auto max-w-[1240px] px-5 pb-24 sm:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {referanslar.map((r) => (
            <ReferansLogo
              key={r.id}
              referans={r}
              gri
              className="h-[104px] rounded-[14px] border border-ink/10 bg-white px-6 transition hover:border-brand/35"
            />
          ))}
        </div>
      </section>

      <CorporateStrip text="Ekibinize özel, yerinde ya da uzaktan dijital pazarlama eğitimi." />
      <PublicFooter />
    </div>
  );
}
