import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";

/**
 * Öğrenci ve yönetim panelinin ortak yan menüsü — Claude Design'daki 2b yan
 * menüsü (ikon kutulu sürüm).
 *
 *  - Lacivert → siyah dikey degrade, üstte sönen ince ızgara.
 *  - Her satırda solda çerçeveli ikon kutusu; seçili satır yükseltilmiş hap,
 *    ikon kutusu parlak mavi.
 *  - Sayaç: dolu mavi daire. Kapalı bölüm: kesikli ikon kutusu, soluk yazı,
 *    sağda "YAKINDA".
 *  - Öğrencide üstte "Aktif program" kartı (kurulum ilerlemesiyle).
 *
 * Yalnız sunum; menü verisi, aktiflik ve sayaçlar kabuklarda (PanelShell,
 * AdminShell).
 */

/** Menü zemini; tarayıcı çubuğu rengi (theme-color) için de kullanılıyor. */
export const YAN_MENU_RENK = "#0A0F22";
export const YAN_MENU_ZEMIN = "text-[#C9D0E0]";

/** aside'ın arka planı: degrade + üstte sönen ızgara. */
export function YanMenuZemin() {
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#101A3E_0%,#0B1129_38%,#070B16_100%)]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "linear-gradient(180deg,#000,transparent)",
          WebkitMaskImage: "linear-gradient(180deg,#000,transparent)",
        }}
      />
    </>
  );
}

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
    <div className="relative flex items-center gap-3 px-5 pt-[calc(22px+env(safe-area-inset-top))]">
      <Link href={href} onClick={onGit} className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[11px] bg-white text-[14px] font-extrabold text-[#0B1129] shadow-[0_8px_18px_-8px_rgba(0,0,0,.6)]">
          AE
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-[15px] font-semibold text-white">{baslik}</span>
          <span className="font-mono text-[9.5px] tracking-[0.2em] text-[#7FA0FF] uppercase">{alt}</span>
        </span>
      </Link>
      <button
        type="button"
        aria-label="Menüyü kapat"
        onClick={onKapat}
        className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] text-[#8E98B3] transition hover:bg-white/8 hover:text-white lg:hidden"
      >
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}

/** Öğrencide "Aktif program" kartı. İlerleme yoksa yalnız başlık. */
export function MenuProgram({
  baslik,
  ilerleme,
}: {
  baslik: string;
  ilerleme: { etiket: string; yuzde: number } | null;
}) {
  return (
    <div className="relative mx-4 rounded-[14px] border border-white/10 bg-white/[0.04] px-3.5 pt-3 pb-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,.04)]">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 flex-none rounded-full bg-[#3DDC97] shadow-[0_0_0_3px_rgba(61,220,151,.18)]" />
        <span className="font-mono text-[9.5px] tracking-[0.18em] text-[#AFC2FF] uppercase">Aktif program</span>
        {ilerleme && <span className="ml-auto font-mono text-[10px] text-[#8E98B3]">{ilerleme.etiket}</span>}
      </div>
      <div className="mt-2 line-clamp-2 text-[13.5px] leading-[1.3] font-bold tracking-[-0.01em] text-white">{baslik}</div>
      {ilerleme && (
        <div className="mt-2.5 h-[3px] overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#4C7DFF,#7FA0FF)]"
            style={{ width: `${Math.max(4, ilerleme.yuzde)}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function MenuGrup({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="px-2.5 pb-1.5 font-mono text-[9.5px] tracking-[0.2em] text-[#5D6782] uppercase">{baslik}</div>
      {children}
    </div>
  );
}

function IkonKutusu({ ikon, durum }: { ikon: IconName; durum: "normal" | "aktif" | "kapali" }) {
  return (
    <span
      className={`relative flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[9px] ${
        durum === "aktif"
          ? "bg-[linear-gradient(180deg,#5A86FF,#2459FF)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.35),0_6px_16px_-4px_rgba(36,89,255,.85)]"
          : durum === "kapali"
            ? "border border-dashed border-white/15 text-[#4A5373]"
            : "border border-white/10 bg-white/[0.03] text-[#AEB6CC]"
      }`}
    >
      <Icon name={ikon} size={15} />
    </span>
  );
}

export function MenuOgesi({
  href,
  etiket,
  ikon,
  aktif,
  sayi = 0,
  uyari = false,
  onGit,
}: {
  href: string;
  etiket: string;
  ikon: IconName;
  aktif: boolean;
  /** Okunmamış/bekleyen sayısı; 0 ise rozet yok. */
  sayi?: number;
  /** Sayı değil, duran bir uyarı (bekleyen ödeme): satır sonunda turuncu nokta. */
  uyari?: boolean;
  onGit?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onGit}
      aria-current={aktif ? "page" : undefined}
      className={`flex items-center gap-3 rounded-[13px] border px-2 py-[6px] text-[14.5px] transition ${
        aktif
          ? "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.035))] font-bold text-white shadow-[0_10px_24px_-14px_rgba(0,0,0,.8)]"
          : "border-transparent text-[#C9D0E0] hover:bg-white/[0.04] hover:text-white"
      }`}
    >
      <IkonKutusu ikon={ikon} durum={aktif ? "aktif" : "normal"} />
      <span className="min-w-0 flex-1 truncate">{etiket}</span>
      {sayi > 0 && (
        <span className="flex h-[19px] min-w-[19px] flex-none items-center justify-center rounded-full bg-[#2459FF] px-1.5 text-[10.5px] font-bold text-white shadow-[0_4px_10px_-4px_rgba(36,89,255,.9)]">
          {sayi > 999 ? "999+" : sayi}
        </span>
      )}
      {uyari && (
        <span className="mr-1.5 h-2 w-2 flex-none rounded-full bg-[#FFB02E] shadow-[0_0_0_3px_rgba(255,176,46,.2)]">
          <span className="sr-only">(bekleyen işlem var)</span>
        </span>
      )}
    </Link>
  );
}

/** Henüz açılmamış bölüm: tıklanmıyor; kesikli ikon kutusu ve "YAKINDA". */
export function MenuYakinda({ etiket, ikon }: { etiket: string; ikon: IconName }) {
  return (
    <div aria-disabled className="flex cursor-not-allowed items-center gap-3 rounded-[13px] border border-transparent px-2 py-[6px] text-[14.5px] text-[#4F587A]">
      <IkonKutusu ikon={ikon} durum="kapali" />
      <span className="min-w-0 flex-1 truncate">{etiket}</span>
      <span className="flex-none font-mono text-[8.5px] tracking-[0.18em] text-[#6B7590] uppercase">Yakında</span>
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
  /** Öteki panele geçiş ("Yönetim paneli" / "Öğrenci görünümü"): ikon düğmesi. */
  ikincil?: { href: string; etiket: string; ikon: IconName } | null;
  cikis: () => void | Promise<void>;
}) {
  return (
    <div className="relative mt-auto flex items-center gap-2.5 border-t border-white/[0.07] px-4 pt-3.5 pb-[calc(16px+env(safe-area-inset-bottom))]">
      <span className="relative flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[11px] bg-[#1E2B55] text-[12px] font-bold text-[#AFC2FF]">
        {basHarf}
        <span className="absolute -right-[2px] -bottom-[2px] h-2.5 w-2.5 rounded-full bg-[#3DDC97] ring-2 ring-[#070B16]" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[13px] font-semibold text-white">{ad}</span>
        <span className="truncate font-mono text-[10px] text-[#6B7590]">{eposta}</span>
      </span>
      {ikincil && (
        <Link
          href={ikincil.href}
          title={ikincil.etiket}
          aria-label={ikincil.etiket}
          className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px] border border-white/12 text-[#C9D0E0] transition hover:border-[#5B86FF] hover:text-white"
        >
          <Icon name={ikincil.ikon} size={15} />
        </Link>
      )}
      <form action={cikis} className="flex-none">
        <button
          type="submit"
          title="Çıkış"
          aria-label="Çıkış"
          className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-[#4A2230] text-[#F08A9A] transition hover:border-[#E5484D] hover:bg-[#E5484D] hover:text-white"
        >
          <Icon name="logout" size={15} />
        </button>
      </form>
    </div>
  );
}
