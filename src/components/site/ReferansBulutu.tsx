import type { Referans } from "@/lib/icerik";
import { ReferansLogo } from "./ReferansLogo";

/**
 * Ortalanmış başlık + iki kenarı soluklaşan geniş bir şerit. Kaynak tasarımdan
 * farkı, logoların sabit marka ikonları değil admin panelinden yüklenen gerçek
 * referanslar olması — bu yüzden ikon paketi yerine mevcut ReferansLogo
 * kullanılıyor.
 *
 * Şerit yarısı kadar ilerleyip başa döndüğü için liste iki kez basılıyor;
 * kopyalar ekran okuyucudan gizli.
 */
export function ReferansBulutu({ referanslar }: { referanslar: Referans[] }) {
  if (referanslar.length === 0) return null;

  return (
    <section className="border-b border-ink/8 bg-mist py-14 sm:py-16">
      <div className="mx-auto w-full max-w-[1240px] px-5 text-center sm:px-8">
        <p className="font-mono text-[10.5px] tracking-[0.16em] text-[#656B7A] uppercase">
          Eğitimlerimizi tercih eden kuruluşlar
        </p>

        <div
          className="referans-bulutu relative mt-8 overflow-hidden sm:mt-10"
          style={{
            maskImage: "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)",
          }}
        >
          <div className="referans-bulutu-serit flex w-max items-center gap-6 sm:gap-8">
            {[...referanslar, ...referanslar].map((r, i) => (
              <ReferansLogo
                key={`${r.id}-${i}`}
                referans={r}
                className="h-[62px] min-w-[148px] flex-none px-7 sm:h-[66px] sm:px-8"
                ariaGizli={i >= referanslar.length}
                gri
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
