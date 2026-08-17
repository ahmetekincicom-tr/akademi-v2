"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import type { Course } from "@/lib/courses";

const tabs = ["Tümü", "Online", "Yüz yüze", "Kurumsal"] as const;
type Tab = (typeof tabs)[number];

export function EgitimlerFiltre({ courses }: { courses: Course[] }) {
  const [tab, setTab] = useState<Tab>("Tümü");

  const gosterilecek =
    tab === "Kurumsal"
      ? []
      : courses.filter((c) => (tab === "Online" ? c.online : tab === "Yüz yüze" ? c.yuzYuze : true));

  return (
    <section className="mx-auto max-w-[1240px] px-5 sm:px-8 py-16 pb-24">
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
              {/*
                Görsel ve başlık de detaya gidiyor: kart bir bağlantı gibi
                görünüyordu ama yalnızca alttaki düğme tıklanabiliyordu.
                Kartın tamamını tek bir <a> yapmak seçenek değil — içindeki
                düğme de bağlantı ve iç içe <a> geçersiz.
              */}
              <Link
                href={`/egitimler/${p.slug}`}
                aria-label={`${p.baslik} detayına git`}
                className={`relative flex aspect-video items-end border-b border-ink/8 p-[14px] ${
                  p.kapak ? "bg-cover bg-center" : "placeholder-block"
                }`}
                style={p.kapak ? { backgroundImage: `url(${p.kapak})` } : undefined}
              >
                {!p.kapak && (
                  <span className="rounded-[5px] bg-white/90 px-2 py-[5px] font-mono text-[10px] text-[#656B7A]">
                    program görseli 16:9
                  </span>
                )}
                <span className="absolute top-[14px] left-[14px] rounded-[6px] bg-ink px-[10px] py-[6px] font-mono text-[10px] tracking-[0.1em] text-white uppercase">
                  {p.etiket}
                </span>
              </Link>
              <div className="flex flex-1 flex-col p-[26px] pt-[26px] pb-7">
                <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.06em] text-[#6B7080]">
                  <span>{p.sure}</span>
                  <span className="text-ink/20">•</span>
                  <span>{p.modul}</span>
                </div>
                {/* h2: sayfanın h1'inden sonraki ilk seviye. Önce h3'tü ve
                    başlık hiyerarşisinde h2 atlanıyordu. */}
                <h2 className="mt-[14px] font-heading text-[23px] leading-[1.2] font-semibold tracking-[-0.025em]">
                  <Link href={`/egitimler/${p.slug}`} className="transition-colors hover:text-brand">
                    {p.baslik}
                  </Link>
                </h2>
                <p className="mt-[11px] mb-[22px] text-[15px] leading-[1.6] text-[#5C6273]">{p.aciklama}</p>
                <div className="mt-auto flex flex-col gap-[11px] border-t border-ink/8 pt-5">
                  {p.maddeler.map((m) => (
                    <div key={m} className="flex items-start gap-[10px] text-[14.5px] leading-[1.5] text-[#3A3F4F]">
                      <span className="mt-[2px] flex h-4 w-4 flex-none items-center justify-center rounded-[5px] bg-brand/12 text-brand">
                        <Icon name="check" size={11} strokeWidth={3} />
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
                  <Icon name="arrowRight" size={16} />
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
            <h2 className="mt-3 font-heading text-2xl leading-[1.2] font-semibold tracking-[-0.025em]">
              Ekibinize özel, yerinde ya da uzaktan program kuralım.
            </h2>
            <p className="mt-3 text-[15px] leading-[1.6] text-[#5C6273]">
              Meta Ads, sosyal medya veya yapay zekâ eğitimlerinin herhangi biri ekip formatına uyarlanır; kapsam ve
              takvim birlikte belirlenir.
            </p>
          </div>
          <Link
            href="/kurumsal"
            className="inline-flex h-[50px] flex-none items-center gap-[9px] rounded-[10px] bg-brand px-6 text-[15px] font-semibold text-white hover:bg-ink"
          >
            Kurumsal sayfasına git
            <Icon name="arrowRight" size={16} />
          </Link>
        </div>
      )}
    </section>
  );
}
