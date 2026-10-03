import Link from "next/link";
import { Icon } from "@/components/Icon";

/**
 * Öğrenci ve yönetim panelinin ortak yan menüsü — "Sidebar" tasarımı (2b).
 *
 * Düz koyu zemin (#0B1120), simge yok: her satırın başında küçük bir nokta,
 * seçili satırda dolu mavi nokta ve #18234A zemin. Bölüm başlıkları mono,
 * kapalı bölümler soluk ve "YAKINDA" çerçeveli hap, sayaçlar #18234A hap.
 * Altta kullanıcı kutusu ve iki düğme (öteki panel + çıkış).
 *
 * Yalnız sunum; menü verisi, aktiflik ve sayaçlar kabuklarda (PanelShell,
 * AdminShell).
 */

export const YAN_MENU_ZEMIN = "bg-[#0B1120] text-[#C9D0E0]";

export function MenuMarka({
  href,
  baslik,
  alt,
  onGit,
  onKapat,
}: {
  href: string;
  baslik: string;
  alt: string;
  onGit?: () => void;
  onKapat: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-[22px] pt-[calc(22px+env(safe-area-inset-top))] pb-1.5">
      <Link href={href} onClick={onGit} className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[10px] bg-[#2459FF] text-[15px] font-bold text-white">
          AE
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-[15px] font-semibold text-white">{baslik}</span>
          <span className="font-mono text-[10px] tracking-[0.16em] text-[#6B7590] uppercase">{alt}</span>
        </span>
      </Link>
      <button
        type="button"
        aria-label="Menüyü kapat"
        onClick={onKapat}
        className="flex h-9 w-9 flex-none items-center justify-center rounded-[9px] text-[#6B7590] transition hover:bg-[#141C33] hover:text-white lg:hidden"
      >
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}

export function MenuGrup({ baslik, ilk = false, children }: { baslik: string; ilk?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className={`px-2.5 pb-2 font-mono text-[10px] tracking-[0.16em] text-[#5D6782] uppercase ${ilk ? "" : "pt-1"}`}>{baslik}</div>
      {children}
    </div>
  );
}

const SATIR = "flex items-center gap-3 rounded-[9px] px-3 py-2.5 text-[14px]";

export function MenuOgesi({
  href,
  etiket,
  aktif,
  sayi = 0,
  uyari = false,
  onGit,
}: {
  href: string;
  etiket: string;
  aktif: boolean;
  /** Okunmamış/bekleyen sayısı; 0 ise hap yok. */
  sayi?: number;
  /** Sayı değil, duran bir uyarı (bekleyen ödeme): kırmızı nokta. */
  uyari?: boolean;
  onGit?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onGit}
      aria-current={aktif ? "page" : undefined}
      className={`${SATIR} transition ${aktif ? "bg-[#18234A] font-semibold text-white" : "text-[#C9D0E0] hover:bg-[#141C33] hover:text-white"}`}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 flex-none rounded-full"
        style={{ background: uyari ? "#F08A9A" : aktif ? "#5B86FF" : "#2A3350" }}
      />
      <span className="min-w-0 flex-1 truncate">{etiket}</span>
      {sayi > 0 && (
        <span className="flex-none rounded-full bg-[#18234A] px-2 py-[3px] font-mono text-[10px] text-[#AFC2FF]">
          {sayi > 999 ? "999+" : sayi}
        </span>
      )}
      {uyari && <span className="sr-only">(bekleyen işlem var)</span>}
    </Link>
  );
}

/** Henüz açılmamış bölüm: tıklanmıyor, "YAKINDA" hapı. */
export function MenuYakinda({ etiket }: { etiket: string }) {
  return (
    <div aria-disabled className={`${SATIR} cursor-not-allowed text-[#5D6782]`}>
      <span aria-hidden className="h-1.5 w-1.5 flex-none rounded-full bg-[#2A3350]" />
      <span className="min-w-0 flex-1 truncate">{etiket}</span>
      <span className="flex-none rounded-full border border-[#2A3350] px-[7px] py-[3px] font-mono text-[9px] tracking-[0.1em] uppercase">
        Yakında
      </span>
    </div>
  );
}

export function MenuAlt({
  basHarf,
  ad,
  eposta,
  ikincil,
  cikis,
}: {
  basHarf: string;
  ad: string;
  eposta: string;
  /** Öteki panele geçiş ("Yönetim paneli" / "Öğrenci görünümü"); yoksa çıkış tam genişlik. */
  ikincil?: { href: string; etiket: string } | null;
  cikis: () => void | Promise<void>;
}) {
  return (
    <div className="mt-auto flex flex-col gap-2.5 px-4 pt-3 pb-[calc(22px+env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-2.5 rounded-[11px] bg-[#111A30] p-2.5">
        <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-[#1E2B55] text-[12px] font-bold text-[#AFC2FF]">
          {basHarf}
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-[13px] font-semibold text-white">{ad}</span>
          <span className="truncate font-mono text-[10px] text-[#6B7590]">{eposta}</span>
        </span>
      </div>
      <div className="flex gap-2">
        {ikincil && (
          <Link
            href={ikincil.href}
            className="flex flex-1 items-center justify-center rounded-[9px] border border-[#233056] p-[9px] text-[13px] font-semibold text-[#AFC2FF] transition hover:border-[#5B86FF] hover:text-white"
          >
            {ikincil.etiket}
          </Link>
        )}
        <form action={cikis} className={ikincil ? "" : "flex-1"}>
          <button
            type="submit"
            className="w-full rounded-[9px] border border-[#3A1E28] px-3 py-[9px] text-[13px] font-semibold text-[#F08A9A] transition hover:border-[#E5484D] hover:bg-[#E5484D] hover:text-white"
          >
            Çıkış
          </button>
        </form>
      </div>
    </div>
  );
}
