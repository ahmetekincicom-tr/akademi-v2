"use client";

import { useMemo, useState } from "react";
import {
  etiketleriAyir,
  etiketleriTopla,
  etiketOnerileri,
  etiketSec,
  etiketYazimFarklari,
  ETIKET_ESIGI,
} from "@/lib/blog-etiket";

/**
 * Etiket alanı: virgülle ayrılmış metin + var olan etiketlerden öneri.
 *
 * Amaç tekrarı önlemek: "meta ads" yazılırken var olan "Meta Ads" öneriliyor;
 * farklı yazılmış ama aynı adrese düşen etiket kayıtta var olan yazıma
 * çevriliyor (YaziEditoru → etiketleriDuzenle) ve burada önceden söyleniyor.
 * Etiketin arama sıralamasına doğrudan katkısı az; az sayıda, tutarlı etiket
 * okuyucunun benzer yazıları bulmasına yarıyor. Etiket sayfası 3 yazıdan
 * sonra arama motoruna açılıyor (lib/blog-etiket → ETIKET_ESIGI).
 */

const ETIKET = "font-mono text-[10px] tracking-[0.13em] text-[#656B7A] uppercase";
const GIRDI =
  "h-[46px] w-full rounded-[10px] border border-ink/14 bg-white px-[14px] text-[15px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]";

export function EtiketAlani({
  deger,
  onDegis,
  yazilar,
  haricId,
}: {
  deger: string;
  onDegis: (v: string) => void;
  /** Etiket sayıları için yazılar (bu yazı hariç tutulur). */
  yazilar: { id: string; etiketler: string[] }[];
  haricId?: string;
}) {
  const [odak, setOdak] = useState(false);
  const mevcut = useMemo(() => etiketleriTopla(yazilar.filter((y) => y.id !== haricId)), [yazilar, haricId]);
  const oneriler = useMemo(() => etiketOnerileri(deger, mevcut, 8), [deger, mevcut]);
  const farklar = useMemo(() => etiketYazimFarklari(etiketleriAyir(deger), mevcut), [deger, mevcut]);
  const sayi = etiketleriAyir(deger).length;

  return (
    <div className="flex flex-col gap-2">
      <span className="flex items-center justify-between gap-2">
        <label htmlFor="yazi-etiketler" className={ETIKET}>
          Etiketler (virgülle ayır)
        </label>
        {sayi > 5 && <span className="font-mono text-[11px] text-[#8a5a00]">{sayi} etiket · 3–5 yeterli</span>}
      </span>
      <input
        id="yazi-etiketler"
        value={deger}
        onChange={(e) => onDegis(e.target.value)}
        onFocus={() => setOdak(true)}
        onBlur={() => setOdak(false)}
        placeholder="meta ads, facebook, bütçe"
        autoComplete="off"
        className={GIRDI}
      />
      {farklar.length > 0 && (
        <p className="text-[12px] leading-[1.5] text-[#5C6273]">
          Kayıtta var olan yazıma çevrilecek:{" "}
          {farklar.map((f) => `“${f.yazilan}” → “${f.kanonik}”`).join(", ")}
        </p>
      )}
      {(odak || deger.trim().length > 0) && oneriler.length > 0 && (
        <div>
          <span className="text-[11.5px] text-[#8A90A0]">Var olan etiketler</span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {oneriler.map((o) => (
              <button
                key={o.slug}
                type="button"
                // Girdi odağını kaybetmesin: tıklama blur'dan önce işlensin.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onDegis(etiketSec(deger, o.ad))}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-ink/12 bg-white px-3 text-[13px] text-ink transition hover:border-brand hover:text-brand"
              >
                {o.ad}
                <span className="font-mono text-[10.5px] text-[#656B7A]" aria-hidden>
                  {o.adet}
                </span>
                <span className="sr-only">, {o.adet} yazıda</span>
              </button>
            ))}
          </div>
          <span className="mt-1.5 block text-[11.5px] leading-[1.5] text-[#8A90A0]">
            Etiket sayfası {ETIKET_ESIGI} yazıya ulaşınca Google&apos;a açılır.
          </span>
        </div>
      )}
    </div>
  );
}
