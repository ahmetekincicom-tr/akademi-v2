"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";

export type CurriculumModule = {
  baslik: string;
  meta: string;
  dersler: { ad: string; sure: string }[];
};

/**
 * Eğitimler birebir kurulduğu için ders ve modül süresi gösterilmiyor — süre
 * kişiye göre değişiyor, sabit bir rakam yazmak yanıltıcı oluyor.
 */
export function CurriculumAccordion({ modules }: { modules: CurriculumModule[] }) {
  /*
    YALNIZCA İLK modül açık başlıyor.

    İki uç da yanlıştı. Hepsi kapalıyken ziyaretçi içeriği görmek için tıklamak
    zorunda kalıyor, oysa satın alma kararını en çok etkileyen şey tam olarak o
    içerik — tıklamayan hiç görmüyor. Hepsi açıkken ise Meta Ads eğitiminde 9
    modül ve 51 ders aynı anda listeleniyor: sayfa üç metre uzuyor, eğitmen
    tanıtımı, kazanımlar ve SSS o yığının altına gömülüyor.

    Açık ilk modül üçünü birden çözüyor: derinlik hemen görünüyor (ilk modülün
    ders başlıkları kapsamı zaten anlatıyor), kalan modüller taranabilir bir
    liste olarak duruyor ve açık olan bir tanesi, diğerlerinin de
    açılabildiğini öğretiyor.
  */
  const [open, setOpen] = useState<number[]>([0]);

  const toggle = (i: number) => {
    setOpen((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : prev.concat(i)));
  };

  const allOpen = modules.length > 0 && open.length === modules.length;
  const toggleAll = () => setOpen(allOpen ? [] : modules.map((_, i) => i));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <div className="flex items-center gap-[10px] font-mono text-[11px] tracking-[0.16em] text-brand uppercase">
            <span className="h-px w-[22px] bg-brand" />
            Müfredat
          </div>
          {/*
            Başlık eskiden "9 modül · 51 ders" idi. Sayı saymak eğitimi
            uzunluğuyla tarif ediyor, oysa satılan şey kapsam — ve birebir
            kurulan bir programda o sayı zaten kişiye göre değişiyor.
          */}
          <h2 className="mt-[18px] font-heading text-[30px] leading-[1.08] font-semibold tracking-[-0.03em] sm:text-[40px]">
            Eğitim içeriği
          </h2>
        </div>
        {/*
          Düğme artık düz bir yazı değil.

          Mono, büyük harf, altı çizgisiz bir metin olarak başlığın sağında
          duruyordu; tıklanabilir olduğu ancak deneyerek anlaşılıyordu ve
          bölüm başlığının yanında bir etiket gibi okunuyordu. Çerçeve,
          dolgu ve durumu gösteren bir işaret onu düğme yapıyor.

          İşaret dönüyor, değişmiyor: aynı ok aşağı bakarken "aç", yukarı
          bakarken "kapat" demek. İki farklı ikon arasında geçiş yapmak, aynı
          düğmenin iki farklı düğme gibi görünmesine yol açıyordu.
        */}
        <button
          type="button"
          onClick={toggleAll}
          aria-expanded={allOpen}
          className="inline-flex h-[38px] flex-none items-center gap-[8px] rounded-full border border-ink/13 bg-white pr-[14px] pl-[16px] text-[13.5px] font-semibold text-[#3A3F4F] transition hover:border-brand/45 hover:text-brand"
        >
          {allOpen ? "Tümünü kapat" : "Tümünü aç"}
          <Icon
            name="chevronDown"
            size={15}
            className={`transition-transform duration-200 ${allOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      <p className="mt-[18px] mb-7 max-w-[620px] text-[15.5px] leading-[1.65] text-[#5C6273]">
        Bu akış standart içeriktir. Ön görüşmeden sonra sektörünüze ve mevcut seviyenize göre modüllerin ağırlığı
        yeniden düzenlenir.
      </p>

      <div className="overflow-hidden rounded-2xl border border-ink/11">
        {modules.map((m, i) => {
          const isOpen = open.includes(i);
          return (
            <div key={m.baslik} className="border-b border-ink/9 bg-white last:border-b-0">
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-[#F5F8FF] sm:gap-[18px] sm:px-6 sm:py-[22px]"
              >
                <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[9px] bg-[#F2F4FA] font-mono text-[11.5px] font-medium text-brand sm:h-[34px] sm:w-[34px] sm:text-[12px]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  {/* Ders sayısı kaldırıldı: modül başlığının altında rakam
                      saymak içeriği değil hacmi anlatıyordu. */}
                  <span className="block text-[16.5px] leading-[1.3] font-semibold tracking-[-0.015em] sm:text-[18.5px]">
                    {m.baslik}
                  </span>
                </span>
                {/*
                  Modül işareti de dönen ok: üstteki "Tümünü aç" düğmesi
                  chevron kullanınca aynı bloktaki +/- kutusu ikinci bir dil
                  oluyordu. Aynı hareket, aynı anlam.
                */}
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-[8px] bg-[#F2F4FA] text-brand">
                  <Icon
                    name="chevronDown"
                    size={15}
                    className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                </span>
              </button>

              {isOpen && (
                <ul className="flex flex-col gap-px px-4 pb-4 pl-[18px] sm:pr-6 sm:pb-[22px] sm:pl-[76px]">
                  {m.dersler.map((d) => (
                    <li
                      key={d.ad}
                      className="flex items-start gap-3 border-t border-ink/7 py-[12px] text-[15.5px] leading-[1.5] text-[#3A3F4F] sm:text-[16.5px]"
                    >
                      <span className="mt-[7px] h-[5px] w-[5px] flex-none rounded-full bg-brand" />
                      <span>{d.ad}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
