import Link from "next/link";
import type { Metadata } from "next";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { CorporateStrip } from "@/components/site/CorporateStrip";
import { TestimonialCard } from "@/components/site/TestimonialCard";
import { SectionKicker } from "@/components/site/SectionKicker";
import { siteNav } from "@/components/site/siteNav";

export const metadata: Metadata = { title: "Referanslar — Ahmet Ekinci Akademi" };

const logos = Array.from({ length: 12 }, (_, i) => `referans ${String(i + 1).padStart(2, "0")}`);

const segmentler = [
  { yuzde: "38%", baslik: "İşletme sahipleri", metin: "Kendi reklam hesabını ajansa bırakmadan yönetmeyi öğrenen kobi sahipleri." },
  { yuzde: "27%", baslik: "e-Ticaret satıcıları", metin: "Reklam ve sosyal medya performansını kendi mağazasında büyüten satıcılar." },
  { yuzde: "21%", baslik: "Ajans çalışanları", metin: "Meta, sosyal medya veya yapay zekâ tarafını derinleştiren pazarlama uzmanları." },
  { yuzde: "14%", baslik: "Kariyer değiştirenler", metin: "Dijital pazarlama alanına yeni geçiş yapan profesyoneller." },
];

const yorumlar = [
  { metin: "Her soruma anında ve detaylı geri bildirim aldığım akıcı bir eğitimdi. Birebir olması “sıkılır mıyız?” endişesi yaratmıştı ama hiç bitmesin istedim.", isim: "Selame Hopurcuoğlu Yorulmaz", rol: "Oyunlaştırma Tasarımcısı" },
  { metin: "Piyasadaki eğitimlerin çoğunu almış biri olarak söyleyebilirim: öğrendiklerimi uygulamaya döktüm ve sonuçlarını almaya başladım bile.", isim: "Sema Şengün", rol: "Sosyal Medya Yöneticisi" },
  { metin: "Reklam eğitimi desteği almaya başladıktan sonra satışlarımda ve takipçi sayımda gözle görülür bir artış oldu.", isim: "Ahmet Bahçeci", rol: "e-Ticaret Satıcısı" },
  { metin: "Karmaşık görünen konuları sade ve anlaşılır aktarması konuyu hızlı kavramamı sağladı. Teoride kalmadı, pratikte nasıl uygulanacağını da gösterdi.", isim: "Burçin Uğur", rol: "e-Ticaret Satıcısı" },
  { metin: "Eğitim sonrasında da her zaman destek vereceğini garanti etmesi insanı güvende hissettiriyor.", isim: "Seren Aker", rol: "Lojistik" },
  { metin: "Çalıştığım firmanın detaylarına hâkim olması ve önceden araştırma yaparak hazırlanması eğitimi çok daha verimli kıldı.", isim: "Yasemin Turan", rol: "Marketing Communication Specialist" },
];

export default function ReferanslarPage() {
  return (
    <div className="bg-white">
      <AnnouncementBar />
      <PublicHeader nav={siteNav} ctaLabel="Eğitimleri incele" ctaHref="/egitimler" />

      <section className="mx-auto max-w-[1240px] px-8 pt-16 pb-14">
        <SectionKicker>Referanslar</SectionKicker>
        <h1 className="mt-[18px] max-w-[640px] font-heading text-[36px] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-[46px]">
          400&apos;den fazla katılımcı, tek katılımcılık ilkesiyle eğitildi.
        </h1>
        <p className="mt-6 max-w-[560px] text-[16.5px] leading-[1.62] text-[#5C6273]">
          Eğitimlerimizi tercih eden işletmeler ve profesyoneller — 2021&apos;den beri kurduğumuz birebir çalışma
          ilişkisinin izleri.
        </p>
      </section>

      <section className="border-y border-ink/8 bg-mist">
        <div className="mx-auto max-w-[1240px] px-8 py-14">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {logos.map((l) => (
              <div
                key={l}
                className="placeholder-block flex h-[64px] items-center justify-center rounded-[9px] font-mono text-[10px] tracking-[0.06em] text-[#9CA1AE]"
              >
                {l}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-8 py-20">
        <SectionKicker>Kimlerle çalıştık</SectionKicker>
        <h2 className="mt-[18px] mb-12 max-w-[620px] font-heading text-[32px] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-[40px]">
          Katılımcı profili
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {segmentler.map((s) => (
            <div key={s.baslik} className="rounded-[15px] border border-ink/11 p-6 px-6 pt-7 pb-[30px]">
              <div className="font-heading text-[34px] font-semibold tracking-[-0.03em] text-brand">{s.yuzde}</div>
              <h3 className="mt-[22px] text-[19px] leading-[1.3] font-semibold tracking-[-0.02em]">{s.baslik}</h3>
              <p className="mt-[11px] text-[14.5px] leading-[1.65] text-[#5C6273]">{s.metin}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-ink/8 bg-mist">
        <div className="mx-auto max-w-[1240px] px-8 py-20">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <SectionKicker>Katılımcı yorumları</SectionKicker>
              <h2 className="mt-[18px] font-heading text-[32px] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-[40px]">
                Eğitimden sonra ne değişti
              </h2>
            </div>
            <Link href="/yorumlar" className="text-[14.5px] font-semibold whitespace-nowrap">
              Tüm yorumlar →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-[22px] md:grid-cols-2 lg:grid-cols-3">
            {yorumlar.map((y) => (
              <TestimonialCard key={y.isim} {...y} />
            ))}
          </div>
        </div>
      </section>

      <CorporateStrip text="Ekibinize özel, yerinde ya da uzaktan dijital pazarlama eğitimi." />
      <PublicFooter />
    </div>
  );
}
