import { BlogSimge } from "@/components/blog/BlogSimge";
import { KAPAK_TON_RENKLERI, kapakGorunumu } from "@/lib/blog-kapak";

/**
 * Yazı kapağı.
 *
 * Görsel varsa görsel; yoksa kategorinin (ya da yazıya özel seçilmiş) renk
 * ve simgesiyle çizilen kapak (lib/blog-kapak). Çizim CSS'te
 * (globals.css → .aea-kapak); renk tek bir --ton değişkeniyle geliyor.
 *
 *   kart     liste ve ilgili yazı kartları (16:10)
 *   one      /blog/ dizininin öne çıkan yazısı (16:9, geniş)
 *   hero     yazı sayfasının kapağı (16:9, LCP: hemen yüklenir)
 */
export function BlogKapak({
  gorsel,
  alt = "",
  kategoriSlug,
  ozel,
  cesit = "kart",
  oncelikli = false,
}: {
  gorsel: string | null;
  alt?: string;
  kategoriSlug?: string | null;
  ozel?: { ton?: string | null; simge?: string | null };
  cesit?: "kart" | "one" | "hero";
  /** LCP görseli: tembel yükleme yok, yüksek öncelik. */
  oncelikli?: boolean;
}) {
  if (gorsel) {
    return (
      <div className={`aea-kapak aea-kapak--${cesit}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- /dosya ve eski WordPress adresleri; next/image yapılandırmasının dışında */}
        <img
          src={gorsel}
          alt={alt}
          loading={oncelikli ? "eager" : "lazy"}
          fetchPriority={oncelikli ? "high" : undefined}
          decoding="async"
        />
      </div>
    );
  }

  const g = kapakGorunumu(kategoriSlug, ozel);
  return (
    <div
      className={`aea-kapak aea-kapak--${cesit} aea-kapak--cizim`}
      style={{ "--ton": KAPAK_TON_RENKLERI[g.ton] } as React.CSSProperties}
      aria-hidden="true"
      data-ton={g.ton}
    >
      <span className="aea-kapak__halka aea-kapak__halka--1" />
      <span className="aea-kapak__halka aea-kapak__halka--2" />
      <span className="aea-kapak__halka aea-kapak__halka--3" />
      <span className="aea-kapak__simge">
        <BlogSimge ad={g.simge} cizgi={1.8} className="aea-kapak__svg" />
      </span>
    </div>
  );
}
