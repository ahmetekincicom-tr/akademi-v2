"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { SectionKicker } from "@/components/site/SectionKicker";

type Yorum = { id: string; metin: string; isim: string; rol: string };

/**
 * Eğitim detay sayfasındaki katılımcı yorumları.
 *
 * Izgara değil YATAY KAYDIRICI. Sayfa zaten uzun (müfredat, eğitmen,
 * kazanımlar, SSS); yorumlar alt alta dizilince program içeriğini aşağı
 * itiyor ve ziyaretçi kazanımlara ulaşmadan yorum yığınının içinde
 * kayboluyordu. Kaydırıcıda bölüm tek bir kart boyu yer kaplıyor, okumak
 * isteyen yana kaydırıyor.
 *
 * Dar ekranda bir sonraki kartın kenarı görünüyor: kaydırılabildiğini ok
 * olmadan da anlatıyor. Oklar yalnızca geniş ekranda — orada parmak yok,
 * fareyle yatay kaydırmak zahmetli.
 */
export function EgitimYorumlari({ yorumlar }: { yorumlar: Yorum[] }) {
  const serit = useRef<HTMLDivElement>(null);
  const [basta, setBasta] = useState(true);
  const [sonda, setSonda] = useState(false);

  const konumuGuncelle = useCallback(() => {
    const el = serit.current;
    if (!el) return;
    // 2px pay: kesirli kaydırma değerleri uçta tam sıfıra/eşitliğe inmiyor.
    setBasta(el.scrollLeft <= 2);
    setSonda(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    konumuGuncelle();
    const el = serit.current;
    if (!el) return;
    const gozlemci = new ResizeObserver(konumuGuncelle);
    gozlemci.observe(el);
    return () => gozlemci.disconnect();
  }, [konumuGuncelle]);

  const kaydir = (yon: 1 | -1) => {
    const el = serit.current;
    const kart = el?.querySelector<HTMLElement>("[data-yorum]");
    if (!el || !kart) return;
    // Bir kart + aradaki boşluk kadar; snap gerisini hizalıyor.
    const adim = kart.offsetWidth + 22;
    const azHareket = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: yon * adim, behavior: azHareket ? "auto" : "smooth" });
  };

  if (yorumlar.length === 0) return null;

  const okSinif =
    "flex h-[42px] w-[42px] items-center justify-center rounded-full border border-ink/15 text-ink transition hover:border-ink hover:bg-ink hover:text-white disabled:pointer-events-none disabled:opacity-35";

  return (
    <section id="yorumlar" className="mt-22">
      <SectionKicker>Yorumlar</SectionKicker>
      <div className="mt-[18px] mb-7 flex items-end justify-between gap-6">
        <h2 className="font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[34px]">
          Katılımcı Yorumları
        </h2>
        {yorumlar.length > 1 && (
          <div className="hidden flex-none gap-[10px] sm:flex">
            <button type="button" onClick={() => kaydir(-1)} disabled={basta} aria-label="Önceki yorum" className={okSinif}>
              <Icon name="arrowLeft" size={16} />
            </button>
            <button type="button" onClick={() => kaydir(1)} disabled={sonda} aria-label="Sonraki yorum" className={okSinif}>
              <Icon name="arrowRight" size={16} />
            </button>
          </div>
        )}
      </div>

      <div
        ref={serit}
        onScroll={konumuGuncelle}
        role="region"
        aria-label="Katılımcı yorumları"
        tabIndex={0}
        className="flex snap-x snap-mandatory gap-[22px] overflow-x-auto outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {yorumlar.map((y) => (
          <div key={y.id} data-yorum className="w-[86%] flex-none snap-start sm:w-[calc(50%-11px)]">
            <YorumKarti yorum={y} />
          </div>
        ))}
      </div>

      <Link
        href="/yorumlar"
        className="group/tumu mt-7 inline-flex items-center gap-[6px] text-[14.5px] font-semibold text-brand hover:text-ink"
      >
        Tüm yorumları gör
        <Icon name="arrowRight" size={15} className="transition-transform duration-200 group-hover/tumu:translate-x-[3px]" />
      </Link>
    </section>
  );
}

/**
 * TestimonialCard'ın görünümü, uzun metin 6 satırda kısaltılmış hâli.
 *
 * Kısaltma şart: kaydırıcıdaki kartlar aynı satırda ve satırın boyu en uzun
 * yoruma göre belirleniyor — ekranda görünmeyen bir kart bile. Kesilmeden
 * bırakıldığında iki satırlık yorumların altında, ya da kartları kendi
 * boyuna bırakınca kaydırıcının altında, yarım ekran boşluk kalıyordu.
 * Okumak isteyen "Devamını oku" ile tamamını açıyor.
 *
 * Üzerine gelince kalkma ve gölge efekti YOK: kaydırıcı taşmayı kestiği için
 * gölge kartın kenarında yarım kalıyordu.
 */
function YorumKarti({ yorum }: { yorum: Yorum }) {
  const metin = useRef<HTMLQuoteElement>(null);
  const [acik, setAcik] = useState(false);
  const [tasiyor, setTasiyor] = useState(false);

  useEffect(() => {
    const el = metin.current;
    if (!el) return;
    // Kısaltılmış hâldeyken ölçülüyor; açıkken düğme zaten görünür kalmalı.
    const olc = () => {
      if (!acik) setTasiyor(el.scrollHeight > el.clientHeight + 1);
    };
    olc();
    const gozlemci = new ResizeObserver(olc);
    gozlemci.observe(el);
    return () => gozlemci.disconnect();
  }, [acik]);

  return (
    <figure className="flex h-full flex-col rounded-[15px] border border-ink/11 bg-white p-[26px]">
      <div className="font-heading text-[26px] leading-none text-brand">&ldquo;</div>
      <blockquote
        ref={metin}
        className={`mt-[14px] text-[15.5px] leading-[1.65] text-[#2B303D] ${acik ? "" : "line-clamp-6"}`}
      >
        {yorum.metin}
      </blockquote>
      {tasiyor && (
        <button
          type="button"
          onClick={() => setAcik((a) => !a)}
          aria-expanded={acik}
          className="mt-2 self-start text-[14px] font-semibold text-brand hover:text-ink"
        >
          {acik ? "Daha az göster" : "Devamını oku"}
        </button>
      )}
      <figcaption className="mt-auto pt-6">
        <div className="text-[14.5px] font-semibold">{yorum.isim}</div>
        <div className="mt-[3px] font-mono text-[10.5px] tracking-[0.04em] text-[#656B7A]">{yorum.rol}</div>
      </figcaption>
    </figure>
  );
}
