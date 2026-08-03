"use client";

import Link from "next/link";
import { useNativeUygulama } from "@/lib/native";
import { Icon } from "@/components/Icon";
import type { IconName } from "@/components/Icon";

export type Uyari = {
  tip: "bekleyen" | "eylem";
  baslik: string;
  metin: string;
  yol: string;
  eylem: string;
  ikon: IconName;
};

/**
 * Panele girer girmez görülmesi gereken tek iş. Başlangıç adımları kartı
 * yolun tamamını gösteriyor; bu şerit "şimdi şunu yap" diyor, o yüzden
 * aynı anda birden fazlası basılmıyor — en acili seçiliyor.
 */
export function PanelUyari({ uyari }: { uyari: Uyari }) {
  const bekleyen = uyari.tip === "bekleyen";
  const native = useNativeUygulama();

  // Ödemeye çıkan uyarı uygulamada gösterilmiyor: Apple'ın 3.1.3 maddesi
  // uygulama içinden dışarıdaki ödemeye yönlendirmeyi yasaklıyor. Kural
  // burada, çağıran sayfada değil — uyarı nereden basılırsa basılsın geçerli.
  if (native && uyari.yol === "/panel/odemelerim") return null;

  return (
    <div
      className={`flex flex-wrap items-start gap-4 rounded-2xl border px-5 py-[18px] sm:px-6 ${
        bekleyen ? "border-[#E0A21C]/35 bg-[#FDF6E7]" : "border-brand/30 bg-brand/8"
      }`}
    >
      <span
        className={`mt-[2px] flex h-10 w-10 flex-none items-center justify-center rounded-[12px] ${
          bekleyen ? "bg-[#E0A21C]/18 text-[#8A6210]" : "bg-brand text-white"
        }`}
      >
        <Icon name={uyari.ikon} size={19} />
      </span>

      {/* basis ile sarmalıyor: dar ekranda metin ezilmesin, düğme alta insin. */}
      <div className="min-w-0 grow basis-[240px]">
        <div className="text-[15.5px] font-semibold text-ink">{uyari.baslik}</div>
        <div className="mt-[3px] text-[13.5px] leading-[1.55] text-[#5C6273]">{uyari.metin}</div>
      </div>

      <Link
        href={uyari.yol}
        className={`h-10 flex-none rounded-[10px] px-[18px] text-[13.5px] leading-10 font-semibold transition ${
          bekleyen
            ? "border border-ink/15 bg-white text-ink hover:border-ink"
            : "bg-brand text-white hover:bg-ink"
        }`}
      >
        {uyari.eylem}
      </Link>
    </div>
  );
}
