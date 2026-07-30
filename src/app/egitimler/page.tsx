"use client";

import { useState } from "react";
import Link from "next/link";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { CorporateStrip } from "@/components/site/CorporateStrip";
import { SectionKicker } from "@/components/site/SectionKicker";
import { siteNav } from "@/components/site/siteNav";
import { courses } from "@/lib/courses";

const tabs = ["Tümü", "Online", "Yüz yüze", "Kurumsal"] as const;
type Tab = (typeof tabs)[number];

export default function EgitimlerPage() {
  const [tab, setTab] = useState<Tab>("Tümü");

  const gosterilecek =
    tab === "Kurumsal"
      ? []
      : courses.filter((c) => (tab === "Online" ? c.online : tab === "Yüz yüze" ? c.yuzYuze : true));

  return (
    <div className="bg-white">
      <AnnouncementBar />
      <PublicHeader nav={siteNav} ctaLabel="İletişime geç" ctaHref="/iletisim" />

      <section className="relative overflow-hidden bg-ink text-white">
        <div
          className="bg-grid-dark absolute inset-0"
          style={{
            maskImage: "radial-gradient(120% 90% at 25% 15%, #000 30%, transparent 78%)",
            WebkitMaskImage: "radial-gradient(120% 90% at 25% 15%, #000 30%, transparent 78%)",
          }}
        />
        <div className="absolute -top-40 -right-20 h-[520px] w-[520px] rounded-full bg-brand opacity-18 blur-[120px]" />
        <div className="relative mx-auto max-w-[1240px] px-8 pt-20 pb-24">
          <SectionKicker tone="light">Eğitimler</SectionKicker>
          <h1 className="mt-[18px] max-w-[640px] font-heading text-[38px] leading-[1.06] font-semibold tracking-[-0.035em] sm:text-[48px]">
            Üç program. <span className="text-brand">Aynı yöntem:</span> birebir.
          </h1>
          <p className="mt-6 max-w-[540px] text-[17px] leading-[1.62] text-white/68">
            Her program online veya Ankara&apos;da yüz yüze ilerler. Müfredat, ön görüşmede işinize göre yeniden
            kurulur — fiyat yerine kapsam konuşulur.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-8 py-16 pb-24">
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

        {tab !== "Kurumsal" && (
          <div className="mt-9 grid grid-cols-1 gap-[22px] md:grid-cols-3">
            {gosterilecek.map((p) => (
              <div
                key={p.slug}
                className="flex flex-col overflow-hidden rounded-2xl border border-ink/11 bg-white transition hover:-translate-y-[5px] hover:border-brand/45 hover:shadow-[0_22px_46px_rgba(10,13,24,0.12)]"
              >
                <div className="placeholder-block relative flex aspect-video items-end border-b border-ink/8 p-[14px]">
                  <span className="rounded-[5px] bg-white/90 px-2 py-[5px] font-mono text-[10px] text-[#8A8F9E]">
                    program görseli 16:9
                  </span>
                  <span className="absolute top-[14px] left-[14px] rounded-[6px] bg-ink px-[10px] py-[6px] font-mono text-[10px] tracking-[0.1em] text-white uppercase">
                    {p.etiket}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-[26px] pt-[26px] pb-7">
                  <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.06em] text-[#6B7080]">
                    <span>{p.sure}</span>
                    <span className="text-ink/20">•</span>
                    <span>{p.modul}</span>
                  </div>
                  <h3 className="mt-[14px] font-heading text-[23px] leading-[1.2] font-semibold tracking-[-0.025em]">
                    {p.baslik}
                  </h3>
                  <p className="mt-[11px] mb-[22px] text-[15px] leading-[1.6] text-[#5C6273]">{p.aciklama}</p>
                  <div className="mt-auto flex flex-col gap-[11px] border-t border-ink/8 pt-5">
                    {p.maddeler.map((m) => (
                      <div key={m} className="flex items-start gap-[10px] text-[14.5px] leading-[1.5] text-[#3A3F4F]">
                        <span className="mt-[2px] flex h-4 w-4 flex-none items-center justify-center rounded-[5px] bg-brand/12 text-[10px] font-bold text-brand">
                          ✓
                        </span>
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    href={`/egitimler/${p.slug}`}
                    className="mt-[26px] flex h-[46px] items-center justify-between rounded-[10px] bg-[#F2F4FA] px-[18px] text-[14.5px] font-semibold text-ink hover:bg-brand hover:text-white"
                  >
                    <span>Program detayını incele</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "Kurumsal" && (
          <div className="mt-9 flex flex-col gap-6 rounded-2xl border border-ink/11 bg-mist p-10 md:flex-row md:items-center md:justify-between">
            <div className="max-w-[520px]">
              <div className="font-mono text-[10.5px] tracking-[0.16em] text-brand uppercase">Kurumsal eğitim</div>
              <h3 className="mt-3 font-heading text-2xl leading-[1.2] font-semibold tracking-[-0.025em]">
                Ekibinize özel, yerinde ya da uzaktan program kuralım.
              </h3>
              <p className="mt-3 text-[15px] leading-[1.6] text-[#5C6273]">
                Meta Ads, sosyal medya veya yapay zekâ eğitimlerinin herhangi biri ekip formatına uyarlanır; kapsam ve
                takvim birlikte belirlenir.
              </p>
            </div>
            <Link
              href="/kurumsal"
              className="inline-flex h-[50px] flex-none items-center gap-[9px] rounded-[10px] bg-brand px-6 text-[15px] font-semibold text-white hover:bg-ink"
            >
              Kurumsal sayfasına git →
            </Link>
          </div>
        )}
      </section>

      <CorporateStrip text="Ekibinize özel, yerinde ya da uzaktan dijital pazarlama eğitimi." />
      <PublicFooter />
    </div>
  );
}
