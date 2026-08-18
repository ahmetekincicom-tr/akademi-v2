import Link from "next/link";
import { getMarka } from "@/lib/marka";

/**
 * Logonun durduğu yerler ve başlıktaki yüksekliğe göre oranları.
 *
 * Tek bir sabit yükseklik yerine ölçek kullanılıyor: panelden yükseklik
 * değiştirildiğinde üçü birden orantılı büyüyüp küçülüyor, aralarındaki
 * hiyerarşi bozulmuyor. Oranlar kurumsal sitelerdeki alışılmış dağılım —
 * giriş ekranında logo tek başına durduğu için en büyük, alt bilgide en
 * küçük.
 */
const OLCEK = {
  baslik: 1,
  alt: 0.88,
  giris: 1.2,
} as const;

export type LogoYeri = keyof typeof OLCEK;

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
  yer = "baslik",
}: {
  href?: string;
  variant?: "dark" | "light";
  subline?: string;
  /** Logonun durduğu yer; yüksekliği bu belirliyor. */
  yer?: LogoYeri;
}) {
  const marka = await getMarka();
  const textColor = variant === "light" ? "text-white" : "text-ink";
  const sublineColor = variant === "light" ? "text-white/45" : "text-[#6B7080]";

  // The "light" variant sits on the dark header/footer, so it needs the logo
  // drawn for dark backgrounds.
  const logoUrl = variant === "light" ? marka.logoKoyuZemin : marka.logoAcikZemin;
  const yukseklik = Math.round(marka.logoYuksekligi * OLCEK[yer]);

  if (logoUrl) {
    return (
      <Link href={href} className="inline-flex items-center" aria-label="Ahmet Ekinci Akademi">
        {/*
          Yükseklik satır içi stille veriliyor, Tailwind sınıfıyla değil:
          değer veritabanından geliyor ve Tailwind sınıfları derleme anında
          taranıyor — `h-[${x}px]` gibi bir sınıf çıktıya hiç girmiyor.

          Genişlik sınırı yüksekliğe bağlı: yatay bir yazı logosu, yüksekliğin
          yedi katına kadar uzayabilir. Sabit bir üst sınır (eskiden 190px)
          uzun yazı logolarını yükseklikten önce kırpıyor ve logo istenenden
          küçük duruyordu.
        */}
        {/* Supabase Storage host; next/image would need it in remotePatterns. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt="Ahmet Ekinci Akademi"
          style={{ height: yukseklik, maxWidth: yukseklik * 7 }}
          className="w-auto object-contain"
        />
      </Link>
    );
  }

  // Yedek kilit: logo yüklenmemişken. Kare işaret yüksekliğin %80'i, yazı
  // ondan oranlanıyor ki ayar burada da çalışsın.
  const kare = Math.round(yukseklik * 0.8);

  return (
    <Link href={href} className={`flex items-center gap-[11px] ${textColor}`}>
      <span
        style={{ height: kare, width: kare, fontSize: Math.round(kare * 0.47) }}
        className="flex flex-none items-center justify-center rounded-[9px] bg-brand font-heading font-bold tracking-[-0.02em] text-white"
      >
        AE
      </span>
      <span className="flex flex-col leading-[1.1]">
        <span
          style={{ fontSize: Math.round(kare * 0.47) }}
          className="font-heading font-semibold tracking-[-0.01em]"
        >
          Ahmet Ekinci
        </span>
        <span
          style={{ fontSize: Math.max(9, Math.round(kare * 0.3)) }}
          className={`font-mono tracking-[0.22em] uppercase ${sublineColor}`}
        >
          {subline}
        </span>
      </span>
    </Link>
  );
}
