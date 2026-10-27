import Link from "next/link";
import { BlogKapak } from "@/components/blog/BlogKapak";
import { BlogSimge } from "@/components/blog/BlogSimge";
import type { YaziOzet } from "@/lib/yazilar";
import { tarihIso, tarihUzun } from "@/lib/blog-meta";

/**
 * /blog/ dizininin başındaki öne çıkan yazı (en yeni yazı). Masaüstünde
 * kapak solda, metin sağda; dar ekranda kart gibi alt alta.
 *
 * Kapak sayfanın en büyük görseli (LCP): tembel yüklenmiyor.
 */
export function OneCikanYazi({ yazi }: { yazi: YaziOzet }) {
  return (
    <Link
      href={`/${yazi.slug}/`}
      className="group grid overflow-hidden rounded-[22px] border border-ink/11 bg-white transition hover:border-brand/45 hover:shadow-[0_24px_50px_rgba(10,13,24,0.11)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]"
    >
      <BlogKapak
        gorsel={yazi.kapak}
        kategoriSlug={yazi.kategori?.slug}
        ozel={{ ton: yazi.kapakTon, simge: yazi.kapakSimge }}
        cesit="one"
        oncelikli
      />
      <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] tracking-[0.06em] text-[#5C6273]">
          <span className="rounded-full bg-ink px-2.5 py-1 font-semibold text-white uppercase">Son yazı</span>
          {yazi.kategori && <span className="font-semibold text-brand uppercase">{yazi.kategori.ad}</span>}
          {yazi.yayinTarihi && <time dateTime={tarihIso(yazi.yayinTarihi)}>{tarihUzun(yazi.yayinTarihi)}</time>}
        </div>
        <h2 className="mt-4 font-heading text-[26px] leading-[1.15] font-semibold tracking-[-0.03em] text-balance text-ink transition-colors group-hover:text-brand sm:text-[32px]">
          {yazi.baslik}
        </h2>
        {yazi.ozet && <p className="mt-4 line-clamp-4 text-[16px] leading-[1.65] text-[#5C6273]">{yazi.ozet}</p>}
        <span className="mt-6 inline-flex items-center gap-2 text-[14.5px] font-semibold text-brand">
          Yazıyı oku
          <BlogSimge ad="ok" boyut={16} className="transition-transform group-hover:translate-x-1 motion-reduce:transition-none" />
        </span>
      </div>
    </Link>
  );
}
