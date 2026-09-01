"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { ProgramKarti } from "@/components/site/ProgramKarti";
import type { Course } from "@/lib/courses";

/*
  "Yüz yüze" sekmesi kaldırıldı.

  Üç eğitimin üçü de hem online hem yüz yüze veriliyor; sekme her seferinde
  aynı üç kartı gösteriyor, yani hiçbir şeyi süzmüyordu. Format bilgisi
  eğitim sayfasındaki kapsam listesinde zaten duruyor.
*/
const tabs = ["Tümü", "Online", "Kurumsal"] as const;
type Tab = (typeof tabs)[number];

export function EgitimlerFiltre({ courses }: { courses: Course[] }) {
  const [tab, setTab] = useState<Tab>("Tümü");

  const gosterilecek = tab === "Kurumsal" ? [] : courses.filter((c) => (tab === "Online" ? c.online : true));

  return (
    <section className="mx-auto max-w-[1240px] px-5 sm:px-8 py-16 pb-24">
      {/* Kategoriler dar ekranda ortalı; hero ile aynı eksende dursunlar. */}
      <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
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
          {gosterilecek.map((p, i) => (
            /*
              Sıradaki İLK program vitrinde öne çıkıyor.

              Vurgu için ayrı bir "öne çıkan" alanı açılmadı: sıra zaten
              panelden yönetilen bir tercih ve iki ayrı yerden yönetilen bir
              vitrin, ikisi çeliştiğinde hangisinin kazandığı belirsiz kalırdı.
              Sırayı değiştiren, vitrini de değiştirmiş oluyor.
            */
            <ProgramKarti
              key={p.slug}
              p={{
                slug: p.slug,
                etiket: p.etiket,
                sure: p.sure,
                baslik: p.baslik,
                aciklama: p.aciklama,
                maddeler: p.maddeler.slice(0, 3),
                kapak: p.kapak,
              }}
              vitrin={i === 0 && tab === "Tümü"}
              baslikSeviyesi="h2"
            />
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
