import Link from "next/link";
import type { Kategori } from "@/lib/yazilar";

/**
 * Blog dizini ve kategori arşivlerinin üstündeki kategori çipleri.
 * Yalnız yazısı olan kategoriler (boş kategoriye çağırmak ölü uç).
 * Etkin çip aria-current ile işaretli; dokunma alanı 44 px.
 */
export function KategoriCipleri({
  kategoriler,
  etkin,
}: {
  kategoriler: (Kategori & { adet: number })[];
  /** Etkin kategorinin slug'ı; dizinde null ("Tümü"). */
  etkin: string | null;
}) {
  const cip = (aktif: boolean) =>
    `inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-[14px] font-medium transition ${
      aktif
        ? "border-ink bg-ink text-white"
        : "border-ink/12 bg-white text-[#3A3F4F] hover:border-brand hover:text-brand"
    }`;
  const gorunen = kategoriler.filter((k) => k.adet > 0);
  if (gorunen.length === 0) return null;
  return (
    <nav aria-label="Blog kategorileri">
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link href="/blog/" className={cip(etkin === null)} aria-current={etkin === null ? "page" : undefined}>
            Tümü
          </Link>
        </li>
        {gorunen.map((k) => (
          <li key={k.id}>
            <Link href={`/${k.slug}/`} className={cip(etkin === k.slug)} aria-current={etkin === k.slug ? "page" : undefined}>
              {k.ad}
              <span className={`font-mono text-[11px] ${etkin === k.slug ? "text-white/70" : "text-[#6B7080]"}`}>{k.adet}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
