import Link from "next/link";
import type { Metadata } from "next";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { CorporateStrip } from "@/components/site/CorporateStrip";
import { SectionKicker } from "@/components/site/SectionKicker";
import { siteNav } from "@/components/site/siteNav";
import { egitmenStats } from "@/lib/courses";

export const metadata: Metadata = { title: "Hakkımızda — Ahmet Ekinci Akademi" };

const degerler = [
  { no: "01", baslik: "Şeffaflık", metin: "Kapsam ve süre önceden netleşir; sürpriz ek ücret veya gizli koşul yoktur." },
  { no: "02", baslik: "Uygulama odaklılık", metin: "Slayt anlatmıyoruz. Her ders katılımcının kendi hesabı üzerinde ilerler." },
  { no: "03", baslik: "Uzun soluklu ilişki", metin: "İlişki dersle bitmiyor; soru-cevap kanalı ve birebir seanslarla sürüyor." },
  { no: "04", baslik: "Güncel kalma", metin: "Meta, sosyal medya ve yapay zekâ araçları hızla değişiyor; müfredat her dönem güncellenir." },
];

const zaman = [
  { yil: "2021", baslik: "Akademi kuruldu", metin: "Ankara merkezli, birebir dijital pazarlama eğitimi vermeye başladık." },
  { yil: "2023", baslik: "100. katılımcı", metin: "Meta Ads eğitimlerinde 100. katılımcıya ulaştık, sosyal medya programı eklendi." },
  { yil: "2025", baslik: "Öğrenci paneli", metin: "Ders kayıtları, dokümanlar ve destek kanalını tek panelde topladık." },
  { yil: "2026", baslik: "Yapay zekâ müfredatı", metin: "Pazarlamada yapay zekâ eğitimini üçüncü program olarak müfredata kattık." },
];

export default function HakkimizdaPage() {
  return (
    <div className="bg-white">
      <AnnouncementBar />
      <PublicHeader nav={siteNav} ctaLabel="Eğitimleri incele" ctaHref="/egitimler" />

      <section className="relative overflow-hidden bg-ink text-white">
        <div
          className="bg-grid-dark absolute inset-0"
          style={{
            maskImage: "radial-gradient(120% 90% at 25% 15%, #000 30%, transparent 78%)",
            WebkitMaskImage: "radial-gradient(120% 90% at 25% 15%, #000 30%, transparent 78%)",
          }}
        />
        <div className="absolute -top-40 -right-20 h-[520px] w-[520px] rounded-full bg-brand opacity-18 blur-[120px]" />
        <div className="relative mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-16 px-8 pt-20 pb-24 lg:grid-cols-[1.1fr_0.9fr]">
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

      <section className="mx-auto max-w-[1240px] px-8 py-20">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {[...egitmenStats, { n: "1:1", t: "her programda tek katılımcı" }].map((s) => (
            <div key={s.t}>
              <div className="font-heading text-[32px] font-semibold tracking-[-0.03em] text-brand">{s.n}</div>
              <div className="mt-2 text-[13.5px] text-[#5C6273]">{s.t}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-ink/8 bg-mist">
        <div className="mx-auto max-w-[1240px] px-8 py-20">
          <SectionKicker>Değerlerimiz</SectionKicker>
          <h2 className="mt-[18px] mb-12 max-w-[620px] font-heading text-[32px] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-[40px]">
            Nasıl çalıştığımızı belirleyen dört ilke
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {degerler.map((d) => (
              <div key={d.no} className="rounded-[15px] border border-ink/11 bg-white p-6 px-6 pt-7 pb-[30px]">
                <div className="font-heading text-[34px] font-semibold tracking-[-0.03em] text-brand">{d.no}</div>
                <h3 className="mt-[22px] text-[19px] leading-[1.3] font-semibold tracking-[-0.02em]">{d.baslik}</h3>
                <p className="mt-[11px] text-[14.5px] leading-[1.65] text-[#5C6273]">{d.metin}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-8 py-20">
        <SectionKicker>Yolculuk</SectionKicker>
        <h2 className="mt-[18px] mb-12 max-w-[620px] font-heading text-[32px] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-[40px]">
          2021&apos;den bugüne
        </h2>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 sm:grid-cols-2 lg:grid-cols-4">
          {zaman.map((z) => (
            <div key={z.yil} className="bg-white p-[26px] px-[26px] pt-[26px] pb-[30px]">
              <div className="font-heading text-2xl font-semibold tracking-[-0.02em] text-brand">{z.yil}</div>
              <h3 className="mt-4 text-[17px] leading-[1.3] font-semibold tracking-[-0.02em]">{z.baslik}</h3>
              <p className="mt-[10px] text-[14px] leading-[1.6] text-[#5C6273]">{z.metin}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-8 pt-4 pb-24">
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
