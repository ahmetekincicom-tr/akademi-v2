import Link from "next/link";
import type { Metadata } from "next";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { CorporateStrip } from "@/components/site/CorporateStrip";
import { SectionKicker } from "@/components/site/SectionKicker";

export const metadata: Metadata = { title: "Hakkımızda — Ahmet Ekinci Akademi" };

export default function HakkimizdaPage() {
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
        <div className="relative mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-16 px-5 sm:px-8 pt-20 pb-24 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <SectionKicker tone="light">Hakkımızda</SectionKicker>
            <h1 className="mt-[18px] font-heading text-[36px] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-[48px]">
              Kurs satmıyoruz. <span className="text-brand">Birlikte çalışıyoruz.</span>
            </h1>
            <p className="mt-6 max-w-[520px] text-[17px] leading-[1.62] text-white/68">
              Ahmet Ekinci Akademi, 2021&apos;den beri Ankara merkezli, tamamen birebir yürüyen bir dijital pazarlama
              eğitimi. Meta Ads, sosyal medya yönetimi ve yapay zekâ araçlarında işletme sahiplerinin, e-ticaret
              satıcılarının ve ajans çalışanlarının kendi hesapları üzerinde ilerlemesini sağlıyoruz.
            </p>
          </div>
          <div className="placeholder-block-dark relative flex aspect-[4/5] items-end overflow-hidden rounded-2xl p-5">
            <span className="rounded-[7px] bg-ink/72 px-[11px] py-[7px] font-mono text-[11px] tracking-[0.08em] text-white/60">
              ahmet ekinci — portre
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 sm:px-8 pt-4 pb-24">
        <div className="grid grid-cols-1 overflow-hidden rounded-[18px] border border-ink/11 md:grid-cols-[300px_1fr]">
          <div className="placeholder-block flex min-h-[280px] items-end p-4">
            <span className="rounded-[5px] bg-white/90 px-2 py-[5px] font-mono text-[10px] text-[#656B7A]">eğitmen portresi</span>
          </div>
          <div className="p-9 pt-9 pb-[38px]">
            <div className="font-mono text-[10.5px] tracking-[0.16em] text-brand uppercase">Eğitmen</div>
            <h2 className="mt-[14px] font-heading text-[26px] leading-[1.12] font-semibold tracking-[-0.03em] sm:text-[30px]">
              Ahmet Ekinci
            </h2>
            <div className="mt-2 text-[15px] text-[#5C6273]">Dijital pazarlama eğitmeni · Ankara</div>
            <p className="mt-5 max-w-[620px] text-[15.5px] leading-[1.68] text-[#3A3F4F]">
              2021&apos;den bu yana yalnızca birebir eğitim veriyor. Derslerde teori anlatmak yerine katılımcının
              kendi hesabı üzerinde çalışıyor; eğitim bittikten sonra da soru-cevap kanalından desteği sürdürüyor.
              400&apos;den fazla katılımcıyla çalıştıktan sonra vardığı sonuç basit: herkese aynı içeriği anlatan bir
              platform değil, kişiye özel kurulan bir müfredat işe yarıyor.
            </p>
            <Link href="/egitimler" className="mt-7 inline-flex text-[14.5px] font-semibold">
              Eğitimleri incele →
            </Link>
          </div>
        </div>
      </section>

      <CorporateStrip text="Ekibinize özel, yerinde ya da uzaktan dijital pazarlama eğitimi." />
      <PublicFooter />
    </div>
  );
}
