import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { CorporateStrip } from "@/components/site/CorporateStrip";
import { SectionKicker } from "@/components/site/SectionKicker";
import { KayanSerit } from "@/components/site/KayanSerit";
import { ReferansBulutu } from "@/components/site/ReferansBulutu";
import { Icon } from "@/components/Icon";
import { getHakkimizda, paragraflar } from "@/lib/hakkimizda";
import { kapakUrl } from "@/lib/kapak";
import { getReferanslar } from "@/lib/icerik";
import { sayfaMeta, kisiSemasi } from "@/lib/seo";

// Gerekçe: src/app/page.tsx
export const revalidate = 3600;

// Paylaşım görseli panelden okunduğu için metadata istek anında üretiliyor.
export function generateMetadata(): Promise<Metadata> {
  return sayfaMeta({
  baslik: "Hakkımızda",
  aciklama:
    "Ahmet Ekinci ve Ahmet Ekinci Akademi: yeni medya temelleri üzerine kurulmuş, birebir yürüyen dijital pazarlama eğitimi.",
  yol: "/hakkimizda",
});
}

const SERIT_UST = [
  "Dijital Pazarlama",
  "Meta Ads",
  "Sosyal Medya",
  "Kişisel Marka",
  "İçerik Üretimi",
  "Markalaşma",
  "Yapay Zekâ",
];

const SERIT_ALT = [
  "Birebir Eğitim",
  "Kişiye Özel Müfredat",
  "Ömür Boyu Destek",
  "Online veya Yüz Yüze",
  "Uygulamalı Ders",
];

/**
 * Misyon ve vizyon.
 *
 * Yerini aldığı şey akademinin çalışma biçimini anlatan dört kartlık numaralı
 * bir akıştı ("işi uzmanından öğren", "kendi hesabın üzerinde"…). O metinler
 * yukarıdaki akademi paragraflarıyla aynı şeyi ikinci kez söylüyordu; iki
 * kart, tekrar etmeyen iki şey anlatıyor.
 */
const MISYON_VIZYON = [
  {
    baslik: "Misyonumuz",
    metin:
      "Yeni medya, dijital pazarlama ve reklamcılık alanlarında güncel, anlaşılır ve uygulamaya dönük eğitimler sunmak; her katılımcının kendi hedeflerine uygun bilgi ve yetkinlikler kazanmasını sağlamak.",
  },
  {
    baslik: "Vizyonumuz",
    metin:
      "Dijital dünyanın değişen ihtiyaçlarını yakından takip eden, kişiselleştirilmiş eğitim yaklaşımıyla sektöre nitelikli profesyoneller kazandıran ve Türkiye'de dijital eğitim alanında güven duyulan öncü akademilerden biri olmak.",
  },
];

export default async function HakkimizdaPage() {
  const [icerik, referanslar] = await Promise.all([getHakkimizda(), getReferanslar()]);

  // Uzun metin panelden geliyor; paragraflara bölünüyor ki tek blok halinde
  // okunmasın.
  const metin = paragraflar(icerik.kisiMetin);
  const fotograf = kapakUrl(icerik.kisiGorsel);

  return (
    <div className="bg-white">
      {/* Eğitmen bir varlık olarak işaretleniyor; içerik sayfada görünenin
          aynısı, panelden yönetiliyor. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            kisiSemasi({
              ad: icerik.kisiBaslik.replace(/\s*kimdir\?*\s*$/i, "").trim(),
              unvan: icerik.kisiUnvan,
              aciklama: metin[0] ?? icerik.heroMetin,
              gorsel: fotograf,
            }),
          ),
        }}
      />
      <PublicHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div
          className="bg-grid-dark absolute inset-0"
          style={{
            maskImage: "radial-gradient(110% 90% at 50% 0%, #000 30%, transparent 78%)",
            WebkitMaskImage: "radial-gradient(110% 90% at 50% 0%, #000 30%, transparent 78%)",
          }}
        />
        <div className="absolute -top-52 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-brand opacity-20 blur-[130px]" />
        <div className="relative mx-auto max-w-[820px] px-5 pt-24 pb-24 text-center sm:px-8">
          {icerik.heroEtiket && (
            <div className="flex justify-center">
              <SectionKicker tone="light">{icerik.heroEtiket}</SectionKicker>
            </div>
          )}
          <h1 className="mt-[20px] font-heading text-[38px] leading-[1.06] font-semibold tracking-[-0.04em] sm:text-[54px]">
            {icerik.heroBaslik}
            {icerik.heroVurgu && (
              <>
                <br />
                <span className="text-brand">{icerik.heroVurgu}</span>
              </>
            )}
          </h1>
          {icerik.heroMetin && (
            <p className="mx-auto mt-7 max-w-[620px] text-[17.5px] leading-[1.62] text-white/68">
              {icerik.heroMetin}
            </p>
          )}
        </div>
      </section>

      <KayanSerit kelimeler={SERIT_UST} tema="koyu" />

      {/* Kimdir */}
      <section className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[1fr_0.78fr] lg:items-start lg:gap-20">
          <div>
            {icerik.kisiEtiket && <SectionKicker>{icerik.kisiEtiket}</SectionKicker>}
            <h2 className="mt-[18px] font-heading text-[32px] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-[42px]">
              {icerik.kisiBaslik}
            </h2>
            {icerik.kisiUnvan && (
              <div className="mt-3 font-mono text-[11.5px] tracking-[0.1em] text-brand uppercase">
                {icerik.kisiUnvan}
              </div>
            )}
            <div className="mt-7 flex flex-col gap-[18px]">
              {metin.map((p, i) => (
                <p key={i} className="text-[16.5px] leading-[1.72] text-[#3A3F4F]">
                  {p}
                </p>
              ))}
            </div>
            <Link
              href="/egitimler"
              className="mt-9 inline-flex h-[50px] items-center gap-[9px] rounded-[11px] bg-ink px-6 text-[15px] font-semibold text-white transition hover:bg-brand"
            >
              Eğitimleri incele
              <Icon name="arrowRight" size={16} />
            </Link>
          </div>

          {/*
            Tek fotoğraf. Metin uzadıkça sütunlardan biri diğerinden çok uzun
            kalıyor; sticky sayesinde fotoğraf okuma boyunca ekranda duruyor.
          */}
          <div className="lg:sticky lg:top-24">
            <div className="relative aspect-[3/4] overflow-hidden rounded-[18px]">
              {fotograf ? (
                /*
                  fill + sizes: fotoğraf sabit oranlı bir kutuyu dolduruyor ve
                  gerçek genişliği ekrana göre değişiyor. sizes olmadan Next
                  görselin ekran genişliğinde çizildiğini varsayıp gereğinden
                  büyük dosya gönderiyor.
                */
                <Image
                  src={fotograf}
                  alt={icerik.kisiBaslik}
                  fill
                  sizes="(min-width: 1024px) 420px, 100vw"
                  className="object-cover"
                />
              ) : (
                <div className="placeholder-block absolute inset-0 flex items-end p-3">
                  <span className="rounded-[6px] bg-white/90 px-[8px] py-[4px] font-mono text-[9.5px] text-[#656B7A]">
                    fotoğraf
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Kayan referans logoları */}
      <ReferansBulutu referanslar={referanslar} />

      {/* Akademi */}
      <section className="border-b border-ink/8 bg-mist">
        <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8">
          <div className="max-w-[720px]">
            {icerik.akademiEtiket && <SectionKicker>{icerik.akademiEtiket}</SectionKicker>}
            <h2 className="mt-[18px] font-heading text-[32px] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-[42px]">
              {icerik.akademiBaslik}
            </h2>
            {paragraflar(icerik.akademiMetin).map((p, i) => (
              <p key={i} className="mt-7 text-[16.5px] leading-[1.72] text-[#3A3F4F]">
                {p}
              </p>
            ))}
          </div>

          {/* İki kart yan yana. Numara kaldırıldı: misyon ve vizyon bir sıra
              değil, aynı anda geçerli iki cümle. */}
          <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 md:grid-cols-2">
            {MISYON_VIZYON.map((c) => (
              <div key={c.baslik} className="bg-white p-7 sm:p-9">
                <h3 className="font-heading text-[21px] leading-[1.25] font-semibold tracking-[-0.025em] text-ink">
                  {c.baslik}
                </h3>
                <p className="mt-[14px] text-[15.5px] leading-[1.72] text-[#5C6273]">{c.metin}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ters yönde ikinci şerit: ilkiyle aynı yöne aksaydı sayfa tek yöne
          kayıyormuş gibi duruyordu. */}
      <KayanSerit kelimeler={SERIT_ALT} tema="acik" ters hiz="yavas" />

      <CorporateStrip text="Ekibinize özel, yerinde ya da uzaktan dijital pazarlama eğitimi." />
      <PublicFooter />
    </div>
  );
}
