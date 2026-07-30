import Link from "next/link";

/**
 * Placeholder for panel sections whose data model isn't built yet. Deliberately
 * shows nothing rather than sample rows — a signed-in student should never see
 * records that aren't theirs.
 */
export function YakindaBos({
  ikon,
  baslik,
  aciklama,
  metin,
  aksiyon,
}: {
  ikon: string;
  baslik: string;
  aciklama: string;
  metin: string;
  aksiyon?: { href: string; label: string };
}) {
  return (
    <main className="p-[34px] pb-14">
      <h1 className="font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[32px]">
        {baslik}
      </h1>
      <p className="mt-2 max-w-[620px] text-[15px] text-[#5C6273]">{aciklama}</p>

      <div className="mt-[26px] rounded-2xl border border-ink/10 bg-white px-8 py-14 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[13px] bg-mist font-mono text-lg text-[#9CA1AE]">
          {ikon}
        </div>
        <p className="mx-auto mt-4 max-w-[440px] text-[14.5px] leading-[1.6] text-[#5C6273]">{metin}</p>
        {aksiyon && (
          <Link
            href={aksiyon.href}
            className="mt-6 inline-flex h-11 items-center rounded-[10px] bg-brand px-5 text-sm font-semibold text-white hover:bg-ink"
          >
            {aksiyon.label}
          </Link>
        )}
      </div>
    </main>
  );
}
