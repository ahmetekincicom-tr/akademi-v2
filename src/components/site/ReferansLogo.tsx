import type { Referans } from "@/lib/icerik";

/**
 * Renders an uploaded logo, or the company name when no image exists yet, so a
 * reference added without artwork still shows up instead of leaving a gap.
 */
export function ReferansLogo({ referans, className }: { referans: Referans; className?: string }) {
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

  return referans.siteUrl ? (
    <a href={referans.siteUrl} target="_blank" rel="noreferrer" title={referans.ad} className={stil}>
      {icerik}
    </a>
  ) : (
    <div title={referans.ad} className={stil}>
      {icerik}
    </div>
  );
}
