"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
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
          {gosterilecek.map((p, i) => {
            /*
              Sıradaki İLK program vitrinde öne çıkıyor.

              Vurgu için ayrı bir "öne çıkan" alanı açılmadı: sıra zaten
              panelden yönetilen bir tercih ve iki ayrı yerden yönetilen bir
              vitrin, ikisi çeliştiğinde hangisinin kazandığı belirsiz kalırdı.
              Sırayı değiştiren, vitrini de değiştirmiş oluyor.

              Vurgu yalnızca gölge ve çerçeve: kartı büyütmek ızgarayı
              bozuyor, rengini değiştirmek diğer ikisini pasif gösteriyordu.
            */
            const vitrin = i === 0 && tab === "Tümü";
            return (
            <div
              key={p.slug}
              className={`relative flex flex-col overflow-hidden rounded-2xl bg-white transition hover:-translate-y-[5px] hover:border-brand/45 hover:shadow-[0_22px_46px_rgba(10,13,24,0.12)] ${
                vitrin
                  ? "border-2 border-brand/35 shadow-[0_18px_44px_rgba(28,86,243,0.18)]"
                  : "border border-ink/11"
              }`}
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
              {/*
                Süre satırı ve madde listesi kaldırıldı.

                İkisi de birebir kurulan bir programda kişiye göre değişiyor;
                karttaki sabit "15 saat" ve üç madde, ön görüşmede yeniden
                yazılan bir kapsamı sabitmiş gibi gösteriyordu. Kart artık tek
                iş yapıyor: hangi program olduğunu söyleyip detaya götürmek.
              */}
              <div className="flex flex-1 flex-col p-[26px] pt-[26px] pb-7">
                {/* h2: sayfanın h1'inden sonraki ilk seviye. Önce h3'tü ve
                    başlık hiyerarşisinde h2 atlanıyordu. */}
                <h2 className="font-heading text-[23px] leading-[1.2] font-semibold tracking-[-0.025em]">
                  <Link href={`/egitimler/${p.slug}`} className="transition-colors hover:text-brand">
                    {p.baslik}
                  </Link>
                </h2>
                <p className="mt-[11px] mb-7 text-[15px] leading-[1.6] text-[#5C6273]">{p.aciklama}</p>
                {/*
                  Düğme dolu mavi ve tam genişlikte: gri zeminli hâli kartın
                  içinde bir bilgi satırı gibi duruyordu, tıklanabilir olduğu
                  ancak üzerine gelince belli oluyordu. Ok işareti üzerine
                  gelince ilerliyor.
                */}
                <Link
                  href={`/egitimler/${p.slug}`}
                  className="group/dugme mt-auto flex h-[50px] items-center justify-center gap-[9px] rounded-[11px] bg-brand text-[15px] font-semibold text-white shadow-[0_10px_24px_rgba(28,86,243,0.25)] transition hover:bg-ink"
                >
                  <span>Program detayını incele</span>
                  <Icon
                    name="arrowRight"
                    size={16}
                    className="transition-transform duration-200 group-hover/dugme:translate-x-[3px]"
                  />
                </Link>
              </div>
            </div>
            );
          })}
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
