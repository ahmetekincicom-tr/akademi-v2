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

/**
 * Menü ikonları tasarımdaki çizimlerin aynısı (16px, 1.9 çizgi). Sitenin genel
 * ikon setindeki karşılıkları farklı çiziliyor (Testlerim'de pano yerine onay
 * işareti, Yeni eğitimler'de dolu yıldız…); menüde tasarımdaki set kullanılıyor.
 * Burada olmayan bir ikon (yönetim menüsünün bazıları) genel setten geliyor.
 * Aynı tasarımlardan gelen sayfalar (Ödemelerim, ödeme akışı) da bunu kullanıyor.
 */
const MENU_IKON: Partial<Record<IconName, string>> = {
  grid: "M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5zM4 10h16M10 10v10",
  home: "M4 11l8-7 8 7v9h-5v-6h-6v6H4z",
  bell: "M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0",
  playCircle: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM10 8.5v7l6-3.5z",
  check: "M8 5H6v16h12V5h-2M9 3h6v4H9zM9 14l2 2 4-4",
  calendar: "M3.5 5h17v15.5h-17zM3.5 10h17M8 3v4M16 3v4",
  file: "M7 3h7l5 5v13H7zM14 3v5h5",
  users: "M9 4.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7zM3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M17 6.5a2.5 2.5 0 1 1 0 5M16.5 14c2.7 0 4.5 2 4.5 5",
  message: "M4 5h16v11H10l-6 4.5z",
  briefcase: "M4 8h16v11H4zM9 8V5h6v3M4 13h16",
  card: "M3 6h18v13H3zM3 10.5h18M7 15h3",
  bank: "M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18",
  sparkle: "M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z",
  user: "M12 4a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM5 20c0-3.5 3-6 7-6s7 2.5 7 6",
  shield: "M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6z",
  logout: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10",
};

export function MenuIkon({ ikon, boyut = 16, kalinlik = 1.9 }: { ikon: IconName; boyut?: number; kalinlik?: number }) {
  const yol = MENU_IKON[ikon];
  if (!yol) return <Icon name={ikon} size={boyut} strokeWidth={kalinlik} />;
  return (
    <svg
      width={boyut}
      height={boyut}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={kalinlik}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={yol} />
    </svg>
  );
}

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
    <div className="flex flex-col gap-0.5">
      <div className="px-2.5 pb-1 font-mono text-[9.5px] tracking-[0.2em] text-[#5D6782] uppercase">{baslik}</div>
      {children}
    </div>
  );
}

function IkonKutusu({ ikon, durum }: { ikon: IconName; durum: "normal" | "aktif" | "kapali" }) {
  return (
    <span
      className={`relative flex h-8 w-8 flex-none items-center justify-center rounded-[10px] ${
        durum === "aktif"
          ? "bg-[linear-gradient(160deg,#7FA0FF_0%,#2F62FF_50%,#1E48D6_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_0_0_1px_rgba(127,160,255,.35),0_0_14px_-2px_rgba(36,89,255,.55)]"
          : durum === "kapali"
            ? "border border-dashed border-white/[0.09] text-[#4A5373]"
            : "bg-white/[0.04] text-[#8E98B3] shadow-[inset_0_1px_0_rgba(255,255,255,.06),inset_0_0_0_1px_rgba(255,255,255,.06)]"
      }`}
    >
      <MenuIkon ikon={ikon} kalinlik={durum === "aktif" ? 2 : 1.9} />
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
          <MenuIkon ikon={ikincil.ikon} boyut={14} kalinlik={2} />
        </Link>
      )}
      <form action={cikis} className="flex-none">
        <button
          type="submit"
          title="Çıkış"
          aria-label="Çıkış"
          className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-[#4A2230] text-[#F08A9A] transition hover:border-[#E5484D] hover:bg-[#E5484D] hover:text-white"
        >
          <MenuIkon ikon="logout" boyut={14} kalinlik={2} />
        </button>
      </form>
    </div>
  );
}
