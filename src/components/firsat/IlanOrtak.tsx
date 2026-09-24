import { kalanGun, suresiDoldu, type Ilan } from "@/lib/firsat";
import { TR_ZAMAN } from "@/lib/zaman";
import { Icon } from "@/components/Icon";

/** Liste, detay ve yönetim ekranının ortak parçaları (hook yok; sunucu/istemci). */

export const gunBicimi = new Intl.DateTimeFormat("tr-TR", { timeZone: TR_ZAMAN, day: "numeric", month: "long" });
export const gunYilBicimi = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TR_ZAMAN,
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** "2026-10-12" (tarih, saatsiz) → "12 Ekim". Öğlen UTC: gün kaymasın. */
export function tarihMetni(gun: string, yil = false): string {
  const d = new Date(`${gun}T12:00:00Z`);
  return (yil ? gunYilBicimi : gunBicimi).format(d);
}

/** Logo yoksa şirket adının baş harfleri — sade, marka renginde bir karo. */
export function SirketLogosu({ ilan, boyut = 48 }: { ilan: Pick<Ilan, "sirketAdi" | "sirketLogo">; boyut?: number }) {
  const harf =
    ilan.sirketAdi
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toLocaleUpperCase("tr") ?? "")
      .join("") || "?";
  return (
    <span
      className="flex flex-none items-center justify-center overflow-hidden rounded-[12px] border border-ink/8 bg-white"
      style={{ width: boyut, height: boyut }}
    >
      {ilan.sirketLogo ? (
        // eslint-disable-next-line @next/next/no-img-element -- kendi /dosya ucumuzdan; next/image optimizer'ına gerek yok
        <img src={ilan.sirketLogo} alt="" className="h-full w-full object-contain p-[6px]" />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand/12 to-brand/4 font-heading font-semibold text-brand"
          style={{ fontSize: Math.round(boyut * 0.34) }}
        >
          {harf}
        </span>
      )}
    </span>
  );
}

/**
 * Son başvuru durumu: süresi dolduysa gri "İlan süresi doldu", 3 gün ve
 * altıysa kehribar "Son 2 gün", değilse sade tarih.
 */
export function SonBasvuruEtiketi({ ilan, bugun, kompakt }: { ilan: Pick<Ilan, "durum" | "sonBasvuru">; bugun: string; kompakt?: boolean }) {
  if (suresiDoldu(ilan, bugun)) {
    return (
      <span className="inline-flex items-center gap-[5px] rounded-full bg-ink/7 px-[9px] py-[3px] font-mono text-[9.5px] tracking-[0.08em] text-[#5C6273] uppercase">
        İlan süresi doldu
      </span>
    );
  }
  const kalan = kalanGun(ilan.sonBasvuru, bugun);
  if (kalan === null) {
    return kompakt ? null : <span className="text-[12.5px] text-[#8A90A0]">Son başvuru tarihi belirtilmedi</span>;
  }
  const acil = kalan <= 3;
  return (
    <span
      className={`inline-flex items-center gap-[5px] text-[12.5px] ${acil ? "font-semibold text-[#A5711A]" : "text-[#5C6273]"}`}
      title={`Son başvuru: ${tarihMetni(ilan.sonBasvuru!, true)}`}
    >
      <Icon name="clock" size={13} />
      {acil
        ? kalan === 0
          ? "Bugün son gün"
          : `Son ${kalan} gün`
        : `Son başvuru ${tarihMetni(ilan.sonBasvuru!)}`}
    </span>
  );
}

/** Mono, büyük harfli küçük etiket (panelin genel rozet dili). */
export function Etiket({ children, vurgulu }: { children: React.ReactNode; vurgulu?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-[9px] py-[3px] font-mono text-[9.5px] tracking-[0.08em] uppercase ${
        vurgulu ? "bg-brand/10 text-brand" : "bg-mist text-[#5C6273]"
      }`}
    >
      {children}
    </span>
  );
}
