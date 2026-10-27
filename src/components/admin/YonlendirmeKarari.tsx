"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import type { YonlendirmeKarari } from "@/app/kontrol-9f4x2k/(protected)/blog/actions";
import type { IcLinkHedef } from "@/lib/yazilar";

/**
 * Yayından kaldırılan ya da silinen yazının adresi için karar penceresi.
 *
 * Yazının adresi Google'da dizinli ve başka sitelerden bağlantı almış
 * olabilir. Adres öylece ölürse (404) o değer kaybolur. Kaynak sistemdeki
 * akışın aynısı: varsayılan /blog/, istenirse ilgili bir yazı, başka bir
 * adres ya da "kalıcı olarak kaldırıldı" (410).
 *
 * 410 bilerek en sonda ve açıklamalı: arama motoru adresi dizinden hızla
 * düşürüyor, geri dönüşü yok.
 */

type Secim = "blog" | "yazi" | "adres" | "gone";

export function YonlendirmeKarariPenceresi({
  baslik,
  aciklama,
  onayMetni,
  yazilar,
  haricSlug,
  onIptal,
  onOnay,
}: {
  baslik: string;
  aciklama: string;
  onayMetni: string;
  /** Yönlendirilebilecek yayındaki yazılar (iç bağlantı hedefleri). */
  yazilar: IcLinkHedef[];
  /** Yazının kendisi listede çıkmasın. */
  haricSlug?: string;
  onIptal: () => void;
  onOnay: (karar: YonlendirmeKarari) => void;
}) {
  const [secim, setSecim] = useState<Secim>("blog");
  const [yaziUrl, setYaziUrl] = useState("");
  const [adres, setAdres] = useState("");
  const ilkRadyo = useRef<HTMLInputElement>(null);
  const baslikId = useId();

  const adaylar = yazilar.filter((y) => y.grup === "Blog yazısı" && y.url !== `/${haricSlug}/`);

  useEffect(() => {
    ilkRadyo.current?.focus();
    const tus = (e: KeyboardEvent) => {
      if (e.key === "Escape") onIptal();
    };
    window.addEventListener("keydown", tus);
    return () => window.removeEventListener("keydown", tus);
  }, [onIptal]);

  const gecerli = secim === "blog" || secim === "gone" || (secim === "yazi" ? Boolean(yaziUrl) : adres.trim() !== "");

  const onayla = () => {
    if (!gecerli) return;
    if (secim === "gone") return onOnay({ kod: 410 });
    const hedef = secim === "blog" ? "/blog/" : secim === "yazi" ? yaziUrl : adres.trim();
    onOnay({ kod: 301, hedef });
  };

  const secenek = (deger: Secim, ad: string, not: string, ek?: React.ReactNode) => (
    <label
      className={`flex cursor-pointer flex-col gap-2 rounded-[12px] border p-3.5 transition ${
        secim === deger ? "border-brand bg-brand/[0.04]" : "border-ink/12 hover:border-ink/25"
      }`}
    >
      <span className="flex min-h-[24px] items-start gap-3">
        <input
          ref={deger === "blog" ? ilkRadyo : undefined}
          type="radio"
          name="yonlendirme"
          value={deger}
          checked={secim === deger}
          onChange={() => setSecim(deger)}
          className="mt-[3px] h-[18px] w-[18px] flex-none accent-brand"
        />
        <span className="flex flex-col gap-0.5">
          <span className="text-[14.5px] font-semibold text-ink">{ad}</span>
          <span className="text-[12.5px] leading-[1.5] text-[#5C6273]">{not}</span>
        </span>
      </span>
      {secim === deger && ek}
    </label>
  );

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-labelledby={baslikId}>
      <button type="button" aria-label="Vazgeç" onClick={onIptal} className="absolute inset-0 bg-ink/45" />
      <div className="absolute inset-x-0 bottom-0 flex max-h-[90dvh] flex-col rounded-t-[22px] bg-white shadow-[0_-18px_40px_rgba(10,13,24,0.18)] sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-[min(560px,calc(100vw-32px))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[18px]">
        <div className="flex flex-none items-start justify-between gap-3 px-5 pt-5">
          <div>
            <h2 id={baslikId} className="font-heading text-[18px] leading-[1.25] font-semibold tracking-[-0.02em]">
              {baslik}
            </h2>
            <p className="mt-1.5 text-[13.5px] leading-[1.55] text-[#5C6273]">{aciklama}</p>
          </div>
          <button
            type="button"
            onClick={onIptal}
            aria-label="Kapat"
            className="grid h-11 w-11 flex-none place-items-center rounded-[10px] text-[#5C6273] hover:bg-mist"
          >
            <Icon name="x" size={17} />
          </button>
        </div>

        <fieldset className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain px-5 pt-4 pb-2">
          <legend className="sr-only">Eski adres nereye gitsin?</legend>
          {secenek("blog", "Blog ana sayfasına", "Önerilen. Ziyaretçi /blog/ sayfasına gider, adresin değeri korunur.")}
          {secenek(
            "yazi",
            "İlgili bir yazıya",
            "Aynı konuyu anlatan başka bir yazı varsa en iyi seçenek bu.",
            <select
              value={yaziUrl}
              onChange={(e) => setYaziUrl(e.target.value)}
              aria-label="Yönlendirilecek yazı"
              className="h-11 w-full rounded-[10px] border border-ink/14 bg-white px-3 text-[14px] text-ink outline-none focus:border-brand"
            >
              <option value="">Yazı seç…</option>
              {adaylar.map((y) => (
                <option key={y.url} value={y.url}>
                  {y.baslik}
                </option>
              ))}
            </select>,
          )}
          {secenek(
            "adres",
            "Başka bir adrese",
            "Örneğin bir eğitim sayfası: /egitimler/meta-ads-egitimi/",
            <input
              value={adres}
              onChange={(e) => setAdres(e.target.value)}
              placeholder="/egitimler/"
              aria-label="Yönlendirilecek adres"
              className="h-11 w-full rounded-[10px] border border-ink/14 bg-white px-3 text-[14px] text-ink outline-none focus:border-brand"
            />,
          )}
          {secenek(
            "gone",
            "Kalıcı olarak kaldırıldı (410)",
            "Yalnız içeriğin hiçbir karşılığı yoksa. Google adresi dizinden hızla çıkarır; geri alınabilir ama sıralama geri gelmeyebilir.",
          )}
        </fieldset>

        <div className="flex flex-none flex-col-reverse gap-2 border-t border-ink/8 px-5 pt-3 pb-[max(14px,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onIptal}
            className="h-11 rounded-[11px] border border-ink/13 px-4 text-[14px] font-semibold text-ink hover:bg-mist"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={onayla}
            disabled={!gecerli}
            className="h-11 rounded-[11px] bg-brand px-5 text-[14px] font-semibold text-white hover:bg-ink disabled:opacity-45"
          >
            {onayMetni}
          </button>
        </div>
      </div>
    </div>
  );
}
