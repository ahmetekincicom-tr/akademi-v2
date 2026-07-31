import Link from "next/link";
import { getMarka } from "@/lib/marka";

/**
 * Reads the uploaded brand logo itself rather than taking it as a prop — it is
 * rendered from the header, the footer and the auth shell, and cache() means
 * they still share one query. Falls back to the built-in AE lockup when no
 * logo has been uploaded, so the site is never left without a mark.
 */
export async function Logo({
  href = "/",
  variant = "dark",
  subline = "Akademi",
}: {
  href?: string;
  variant?: "dark" | "light";
  subline?: string;
}) {
  const marka = await getMarka();
  const textColor = variant === "light" ? "text-white" : "text-ink";
  const sublineColor = variant === "light" ? "text-white/45" : "text-[#6B7080]";

  // The "light" variant sits on the dark header/footer, so it needs the logo
  // drawn for dark backgrounds.
  const logoUrl = variant === "light" ? marka.logoKoyuZemin : marka.logoAcikZemin;

  if (logoUrl) {
    return (
      <Link href={href} className="inline-flex items-center" aria-label="Ahmet Ekinci Akademi">
        {/* Supabase Storage host; next/image would need it in remotePatterns. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt="Ahmet Ekinci Akademi" className="h-9 w-auto max-w-[190px] object-contain" />
      </Link>
    );
  }

  return (
    <Link href={href} className={`flex items-center gap-[11px] ${textColor}`}>
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[9px] bg-brand font-heading text-[15px] font-bold tracking-[-0.02em] text-white">
        AE
      </span>
      <span className="flex flex-col leading-[1.1]">
        <span className="font-heading text-[15px] font-semibold tracking-[-0.01em]">Ahmet Ekinci</span>
        <span className={`font-mono text-[9.5px] tracking-[0.22em] uppercase ${sublineColor}`}>{subline}</span>
      </span>
    </Link>
  );
}
