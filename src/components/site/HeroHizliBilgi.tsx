import { Icon, type IconName } from "@/components/Icon";

export type HizliBilgi = { etiket: string; deger: string };

/**
 * Hero'daki süre/format/modül/seviye bilgileri. Eskiden etiket ve değer dört
 * sütuna serbest bırakılmıştı; "6 modül · 24 ders" gibi uzun değerler dar
 * ekranda satır ortasından kırılıyordu. Artık her biri kendi kartında.
 */
const IKONLAR: { anahtar: string; ikon: IconName }[] = [
  { anahtar: "süre", ikon: "clock" },
  { anahtar: "format", ikon: "playCircle" },
  { anahtar: "modül", ikon: "book" },
  { anahtar: "seviye", ikon: "sparkle" },
  { anahtar: "katılımcı", ikon: "user" },
  { anahtar: "yer", ikon: "pin" },
  { anahtar: "takvim", ikon: "calendar" },
  { anahtar: "destek", ikon: "message" },
];

function ikonSec(etiket: string): IconName {
  const k = etiket.toLocaleLowerCase("tr");
  return IKONLAR.find((i) => k.includes(i.anahtar))?.ikon ?? "check";
}

export function HeroHizliBilgi({ bilgiler }: { bilgiler: HizliBilgi[] }) {
  if (!bilgiler.length) return null;

  return (
    <div className="mt-11 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {bilgiler.map((h) => (
        <div
          key={h.etiket}
          className="rounded-[14px] border border-white/14 bg-white/[0.055] p-4 transition hover:border-brand/50 hover:bg-white/[0.09]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-brand/25 text-[#BDD0FF]">
            <Icon name={ikonSec(h.etiket)} size={17} />
          </span>
          <div className="mt-[14px] font-mono text-[9.5px] tracking-[0.16em] text-white/60 uppercase">{h.etiket}</div>
          <div className="mt-[5px] font-heading text-[16px] leading-[1.25] font-semibold tracking-[-0.02em] text-white sm:text-[17px]">
            {h.deger}
          </div>
        </div>
      ))}
    </div>
  );
}
