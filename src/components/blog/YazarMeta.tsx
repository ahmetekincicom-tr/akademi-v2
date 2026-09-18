import Image from "next/image";
import Link from "next/link";
import type { Yazar } from "@/lib/yazar";
import { tarihUzun, tarihIso, guncellemeGosterilecek } from "@/lib/blog-meta";

/**
 * Başlık altındaki kompakt yazar/meta alanı.
 *
 * Küçük avatar + yazar adı, altında yayın tarihi · (varsa) güncellendi ·
 * okuma süresi. Sade ve editoryal: kart/gölge/arka plan yok, blog başlığından
 * baskın değil. Tarihler <time> ile semantik. "Güncellendi" yalnızca içerik
 * gerçekten (yayından sonraki bir günde) güncellendiyse görünür.
 */
export function YazarMeta({
  yazar,
  yayinTarihi,
  icerikGuncelleme,
  okuma,
}: {
  yazar: Yazar;
  yayinTarihi: string | null;
  icerikGuncelleme: string | null;
  okuma: number;
}) {
  const guncellendi = guncellemeGosterilecek(yayinTarihi, icerikGuncelleme);
  const bosHarf = yazar.name.trim().charAt(0).toUpperCase() || "A";

  const AdBileseni = yazar.profileUrl ? (
    <Link href={yazar.profileUrl} className="font-semibold text-ink hover:text-brand">
      {yazar.name}
    </Link>
  ) : (
    <span className="font-semibold text-ink">{yazar.name}</span>
  );

  return (
    <div className="mt-6 flex items-center gap-3">
      {yazar.avatar ? (
        <Image
          src={yazar.avatar}
          alt={yazar.name}
          width={40}
          height={40}
          className="h-10 w-10 flex-none rounded-full object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand/12 text-[15px] font-semibold text-brand"
        >
          {bosHarf}
        </span>
      )}

      <div className="min-w-0 text-[14px] leading-tight">
        <div className="text-[14.5px]">{AdBileseni}</div>
        <div className="mt-[3px] flex flex-wrap items-center gap-x-[7px] gap-y-0.5 text-[12.5px] text-[#6B7080]">
          {yayinTarihi && (
            <time dateTime={tarihIso(yayinTarihi)}>{tarihUzun(yayinTarihi)}</time>
          )}
          {guncellendi && (
            <>
              <span aria-hidden>·</span>
              <span>
                Güncellendi <time dateTime={tarihIso(guncellendi)}>{tarihUzun(guncellendi)}</time>
              </span>
            </>
          )}
          <span aria-hidden>·</span>
          <span>{okuma} dk okuma</span>
        </div>
      </div>
    </div>
  );
}
