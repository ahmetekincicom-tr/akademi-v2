import Link from "next/link";

export function Logo({
  href = "/",
  variant = "dark",
  subline = "Akademi",
}: {
  href?: string;
  variant?: "dark" | "light";
  subline?: string;
}) {
  const textColor = variant === "light" ? "text-white" : "text-ink";
  const sublineColor = variant === "light" ? "text-white/45" : "text-[#6B7080]";

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
