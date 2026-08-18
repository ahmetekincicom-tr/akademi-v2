import Link from "next/link";
import { Icon } from "@/components/Icon";

/**
 * Panelin karşılama başlığı.
 *
 * Önceden selamlama, başlangıç adımları listesinin ALTINDA duruyordu: sayfayı
 * açan kişi önce bir onay listesi, sonra kendi adını görüyordu. Sıra ters ve
 * ilk izlenim dağınıktı — panelin girişi kişiyi karşılamalı, sonra ne
 * yapması gerektiğini söylemeli.
 *
 * Koyu blok bilerek: sitenin hero'suyla aynı dil ve panelin üstünü tek bir
 * sabit noktaya oturtuyor. Kartların hepsi beyazken sayfa nereden başladığı
 * belirsiz bir yığına dönüşüyordu.
 */
export function PanelHosgeldin({
  ad,
  altMetin,
  ilerleme,
  eylem,
}: {
  ad: string | null;
  altMetin: string;
  /** Başlangıç adımlarının durumu; hepsi bittiyse verilmiyor. */
  ilerleme?: { tamam: number; toplam: number };
  eylem?: { etiket: string; yol: string };
}) {
  const yuzde = ilerleme && ilerleme.toplam > 0 ? Math.round((ilerleme.tamam / ilerleme.toplam) * 100) : 0;

  return (
    <section className="relative overflow-hidden rounded-2xl bg-ink text-white">
      {/* Izgara ve ışık: düz koyu bir dikdörtgen ucuz duruyor. */}
      <div
        className="bg-grid-dark absolute inset-0 opacity-70"
        style={{
          maskImage: "radial-gradient(120% 120% at 12% 0%, #000 20%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(120% 120% at 12% 0%, #000 20%, transparent 75%)",
        }}
      />
      <div className="absolute -top-28 -left-16 h-[340px] w-[340px] rounded-full bg-brand opacity-25 blur-[110px]" />

      <div className="relative flex flex-wrap items-center justify-between gap-6 px-6 py-7 sm:px-8 sm:py-8">
        <div className="min-w-0">
          <div className="font-mono text-[10px] tracking-[0.18em] text-white/45 uppercase">Öğrenci paneli</div>
          <h1 className="mt-[10px] font-heading text-[27px] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-[33px]">
            Merhaba{ad ? `, ${ad}` : ""}
          </h1>
          <p className="mt-[10px] max-w-[520px] text-[14.5px] leading-[1.6] text-white/62">{altMetin}</p>
        </div>

        <div className="flex flex-none flex-wrap items-center gap-4">
          {ilerleme && (
            <div className="min-w-[168px]">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-[10px] tracking-[0.14em] text-white/45 uppercase">Kurulum</span>
                <span className="font-heading text-[15px] font-semibold tracking-[-0.02em]">
                  {ilerleme.tamam}/{ilerleme.toplam}
                </span>
              </div>
              <div className="mt-[9px] h-[6px] w-full overflow-hidden rounded-full bg-white/12">
                <div
                  className="h-full rounded-full bg-brand transition-[width] duration-500"
                  style={{ width: `${yuzde}%` }}
                />
              </div>
            </div>
          )}

          {eylem && (
            <Link
              href={eylem.yol}
              className="inline-flex h-[46px] flex-none items-center gap-[8px] rounded-[11px] bg-white px-5 text-[14.5px] font-semibold text-ink transition hover:bg-brand hover:text-white"
            >
              {eylem.etiket}
              <Icon name="arrowRight" size={16} />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
