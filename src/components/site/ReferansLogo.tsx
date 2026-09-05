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
  gri,
  boyut = "serit",
}: {
  referans: Referans;
  className?: string;
  /** Şeritteki ikinci kopya için: aynı isimler ekran okuyucuda tekrarlanmasın. */
  ariaGizli?: boolean;
  /** Ana sayfa şeridinde logolar gri; üzerine gelince kendi rengine döner. */
  gri?: boolean;
  /**
   * Nerede kullanıldığı. "serit" ana sayfadaki ince kayan şerit (~30px);
   * "izgara" /referanslar sayfasındaki büyük kutular. Tek ölçü ikisine birden
   * uymuyordu: şeride göre ayarlı 30px, 104px'lik ızgara kutusunda kayboluyordu.
   */
  boyut?: "serit" | "izgara";
}) {
  /*
    Logolar SABİT YÜKSEKLİĞE göre hizalanıyor; genişlik yalnızca emniyet freni.

    Yüklenen logolar iç boyutu (intrinsic width/height) tanımsız SVG'ler
    olabiliyor. Böyle bir SVG'ye max-yükseklik verildiğinde tarayıcı en-boy
    oranını kestiremiyor ve boy tutarsız çıkıyordu — kimi 24px kimi 52px.
    Sabit yükseklik (h-, max-h değil) hepsini kesin olarak aynı boya getiriyor;
    en-boy oranı viewBox'tan geldiği için genişlik ona göre oluşuyor. max-w
    yalnızca aşırı geniş bir logonun dar ızgara hücresinden taşmasını önlüyor.

    Kaynak SVG'lerin farklı iç boşlukları (padding) olabilir; bunu CSS bir yere
    kadar düzeltir. Tam tutarlılık için logolar yüklenmeden önce kırpılıp aynı
    en-boy oranına oturtulmalı (aşağıdaki nota bkz.).
  */
  const olcu =
    boyut === "izgara"
      ? "h-[34px] w-auto max-w-[90%] object-contain sm:h-[40px]"
      : "max-h-[28px] w-auto max-w-[min(190px,100%)] object-contain sm:max-h-[30px] sm:max-w-[min(210px,100%)]";
  const renk = gri
    ? "grayscale opacity-65 group-hover:grayscale-0 group-hover:opacity-100"
    : "opacity-85 group-hover:opacity-100";

  const icerik = referans.logoUrl ? (
    // Supabase Storage host; next/image would need it added to remotePatterns.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={referans.logoUrl} alt={referans.ad} loading="lazy" className={`${olcu} transition ${renk}`} />
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
