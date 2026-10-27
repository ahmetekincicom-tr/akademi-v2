"use client";

import { Children, useState, type ReactNode } from "react";

/**
 * Kart ızgarası: ilk `ilk` kart görünür, gerisi "Daha fazla yazı göster"
 * ile on ikişer açılır (kaynak sistemdeki dizinle aynı davranış).
 *
 * Bütün kartlar sunucuda basılıyor; gizlenenler de HTML'de var. Arama
 * motoru ve JavaScript'i kapalı ziyaretçi bütün yazıların bağlantısını
 * görüyor, düğme yalnızca görünürlüğü değiştiriyor.
 */
export function DahaFazla({ children, ilk = 12, adim = 12 }: { children: ReactNode; ilk?: number; adim?: number }) {
  const kartlar = Children.toArray(children);
  const [gorunen, setGorunen] = useState(ilk);
  const kalan = kartlar.length - gorunen;

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
        {kartlar.map((kart, i) => (
          <div key={i} className={i < gorunen ? "flex [&>*]:flex-1" : "hidden"}>
            {kart}
          </div>
        ))}
      </div>
      {kalan > 0 && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => setGorunen((g) => g + adim)}
            className="inline-flex min-h-12 items-center rounded-full border border-ink/15 bg-white px-6 text-[15px] font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            Daha fazla yazı göster ({kalan})
          </button>
        </div>
      )}
    </>
  );
}
