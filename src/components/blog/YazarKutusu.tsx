import Image from "next/image";
import Link from "next/link";
import type { Yazar } from "@/lib/yazar";

/**
 * Yazı sonu yazar kutusu (ilgili yazılardan önce).
 *
 * Amaç güven ve yazar bilgisi — satış CTA'sı DEĞİL. Bu yüzden blog CTA
 * kartlarından görsel olarak ayrışıyor: nötr, çok hafif zemin, ince border,
 * yumuşak radius; marka rengi/vurgu yok. "Hakkımda" bağlantısı var olan
 * /hakkimizda sayfasına gidiyor (opsiyonel, kırık link değil).
 */
export function YazarKutusu({ yazar }: { yazar: Yazar }) {
  const bosHarf = yazar.name.trim().charAt(0).toUpperCase() || "A";

  return (
    <aside className="mt-12 flex flex-col gap-4 rounded-2xl border border-ink/10 bg-[#fafbfc] p-6 sm:flex-row sm:items-start sm:gap-5">
      {yazar.avatar ? (
        <Image
          src={yazar.avatar}
          alt={yazar.name}
          width={64}
          height={64}
          className="h-16 w-16 flex-none rounded-full object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="flex h-16 w-16 flex-none items-center justify-center rounded-full bg-brand/12 text-[22px] font-semibold text-brand"
        >
          {bosHarf}
        </span>
      )}

      <div className="min-w-0">
        <div className="font-heading text-[17px] font-semibold tracking-[-0.01em] text-ink">
          {yazar.name}
        </div>
        <div className="mt-0.5 text-[13px] text-[#6B7080]">{yazar.title}</div>
        <p className="mt-2.5 text-[14.5px] leading-[1.6] text-[#4A4F5E]">{yazar.bio}</p>
        <Link
          href="/hakkimizda/"
          className="mt-3 inline-flex items-center gap-1 text-[13.5px] font-semibold text-brand hover:gap-2"
        >
          Hakkımda
          <span aria-hidden>→</span>
        </Link>
      </div>
    </aside>
  );
}
