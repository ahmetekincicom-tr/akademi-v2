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
}: {
  referans: Referans;
  className?: string;
  /** Şeritteki ikinci kopya için: aynı isimler ekran okuyucuda tekrarlanmasın. */
  ariaGizli?: boolean;
}) {
  const icerik = referans.logoUrl ? (
    // Supabase Storage host; next/image would need it added to remotePatterns.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={referans.logoUrl}
      alt={referans.ad}
      loading="lazy"
      className="max-h-[60%] max-w-[78%] object-contain opacity-80 transition group-hover:opacity-100"
    />
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
