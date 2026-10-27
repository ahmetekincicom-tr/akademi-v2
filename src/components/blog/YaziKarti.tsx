import Link from "next/link";
import { BlogKapak } from "@/components/blog/BlogKapak";
import type { YaziOzet } from "@/lib/yazilar";
import { tarihIso, tarihUzun } from "@/lib/blog-meta";

/**
 * Yazı kartı: dizin, kategori ve etiket arşivleri, ilgili yazılar.
 *
 * Kartın tamamı tek bağlantı (dokunma alanı kartın kendisi). Başlık
 * seviyesi sayfaya göre: dizinde h2, yazı sonundaki "İlgili yazılar"
 * altında h3.
 */
export function YaziKarti({
  yazi,
  baslik: BaslikEtiketi = "h2",
  konum,
}: {
  yazi: YaziOzet;
  baslik?: "h2" | "h3";
  /** Ölçüm için (BlogAnalitik → benzer yazı tıklaması). */
  konum?: number;
}) {
  return (
    <Link
      href={`/${yazi.slug}/`}
      {...(konum ? { "data-ilgili-slug": yazi.slug, "data-ilgili-pos": konum } : {})}
      className="group flex flex-col overflow-hidden rounded-2xl border border-ink/11 bg-white transition hover:-translate-y-[3px] hover:border-brand/45 hover:shadow-[0_20px_44px_rgba(10,13,24,0.11)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:hover:translate-y-0"
    >
      <BlogKapak gorsel={yazi.kapak} kategoriSlug={yazi.kategori?.slug} ozel={{ ton: yazi.kapakTon, simge: yazi.kapakSimge }} />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] tracking-[0.06em] text-[#5C6273]">
          {yazi.kategori && <span className="font-semibold text-brand uppercase">{yazi.kategori.ad}</span>}
          {yazi.yayinTarihi && <time dateTime={tarihIso(yazi.yayinTarihi)}>{tarihUzun(yazi.yayinTarihi)}</time>}
        </div>
        <BaslikEtiketi className="mt-2.5 font-heading text-[19px] leading-[1.28] font-semibold tracking-[-0.022em] text-balance text-ink transition-colors group-hover:text-brand sm:text-[20px]">
          {yazi.baslik}
        </BaslikEtiketi>
        {yazi.ozet && <p className="mt-2.5 line-clamp-3 text-[14.5px] leading-[1.6] text-[#5C6273]">{yazi.ozet}</p>}
      </div>
    </Link>
  );
}
