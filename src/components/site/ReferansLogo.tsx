import type { Referans } from "@/lib/icerik";
import { guvenliUrl } from "@/lib/guvenli-url";

/**
 * Renders an uploaded logo, or the company name when no image exists yet, so a
 * reference added without artwork still shows up instead of leaving a gap.
 */
export function ReferansLogo({
  referans,
  className,
  ariaGizli,
  gri,
}: {
  referans: Referans;
  className?: string;
  /** Şeritteki ikinci kopya için: aynı isimler ekran okuyucuda tekrarlanmasın. */
  ariaGizli?: boolean;
  /** Ana sayfa şeridinde logolar gri; üzerine gelince kendi rengine döner. */
  gri?: boolean;
}) {
  // Logolar yüksekliğe göre hizalanıyor, kutuya sığdırılarak değil. Eskiden hem
  // yükseklik hem genişlik yüzdeyle sınırlıydı; TRT gibi kısa/kalın markalar
  // yüksekliğe dayanıp tam boy çizilirken, Mustela gibi uzun yazı logoları önce
  // genişliğe dayanıp belirgin biçimde küçük kalıyordu. Sabit yükseklik +
  // object-contain ikisini de aynı optik boya getiriyor; max-w yalnızca aşırı
  // geniş (oranı ~5'ten büyük) logolar taşmasın diye emniyet freni.
  // min(...) ikinci bir iş yapıyor: /referanslar sayfasındaki dar ızgara
  // hücrelerinde piksel değeri değil hücre genişliği bağlayıcı oluyor, logo
  // kutusundan taşmıyor.
  const olcu =
    "h-[28px] w-auto max-w-[min(190px,100%)] object-contain sm:h-[30px] sm:max-w-[min(210px,100%)]";
  const renk = gri
    ? "grayscale opacity-65 group-hover:grayscale-0 group-hover:opacity-100"
    : "opacity-85 group-hover:opacity-100";

  const icerik = referans.logoUrl ? (
    // Supabase Storage host; next/image would need it added to remotePatterns.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={referans.logoUrl} alt={referans.ad} loading="lazy" className={`${olcu} transition ${renk}`} />
  ) : (
    <span className="truncate px-3 text-center text-[12.5px] font-semibold text-[#5C6273]">{referans.ad}</span>
  );

  const stil = `group flex items-center justify-center rounded-[9px] border border-ink/10 bg-mist ${className ?? ""}`;

  const siteUrl = guvenliUrl(referans.siteUrl);

  return siteUrl ? (
    <a
      href={siteUrl}
      target="_blank"
      rel="noreferrer"
      title={referans.ad}
      className={stil}
      aria-hidden={ariaGizli || undefined}
      tabIndex={ariaGizli ? -1 : undefined}
    >
      {icerik}
    </a>
  ) : (
    <div title={referans.ad} className={stil} aria-hidden={ariaGizli || undefined}>
      {icerik}
    </div>
  );
}
