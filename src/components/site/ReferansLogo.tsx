import type { CSSProperties } from "react";
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
    Logolar kartın içinde, kartından belirgin küçük bir KUTUYA sınırlanıyor —
    çerçeveye dayanmıyor, dört yanında boşluk kalıyor. Profesyonel logo
    duvarının görünümü budur: küçük, ortalanmış, bol nefesli.

    Hem max-yükseklik hem max-genişlik: kompakt logo yüksekliğe, geniş kelime
    logosu genişliğe dayanıyor; ikisi de kutuyu aşmıyor, dolayısıyla hiçbiri
    kartın kenarına gelmiyor. Genişlik yüzdeyle (kart genişliğine göre) veriliyor
    ki dar ızgara hücresinde de bağlayıcı olan hücre olsun.

    Yüklemede logolar kırpıldığı için (icerik-actions.ts › logoyuKirp) içerik =
    kutu; bu sınır hepsine aynı optik boyu ve aynı boşluğu veriyor.
  */
  const izgara = boyut === "izgara";

  /*
    Izgarada logo başına ÖLÇEK (yüzde). Kutuya-sığdır ve kırpma tüm logoları aynı
    boya getiriyor ama boy her şey değil: bir amblem+ince yazı logosu (TTK gibi)
    kalın bir wordmark'la (TRT) aynı kutuda bile daha "seyrek" göründüğü için
    küçük algılanıyor. Bunu ancak o logoyu elle biraz büyütmek eşitliyor.

    Ölçek CSS değişkeniyle taban sınıra çarpılıyor; max-w bir tavanla (%88)
    sınırlı ki büyük ölçekte bile logo karttan taşmasın.
  */
  const sinirla = (deger: number) => Math.min(Math.max(deger / 100, 0.5), 2);
  const olcek = izgara ? sinirla(referans.olcek ?? 100) : 1;
  const olcekMobil = izgara ? sinirla(referans.olcekMobil ?? 100) : 1;

  /*
    Genişlik freni yüzdeyle veriliyor ve kart genişliğine göre değişiyor: mobilde
    kart dar olduğu için aynı yüzde çok küçük piksele denk geliyordu (geniş
    logolar 15–19px'e düşüyordu). Bu yüzden mobilde fren gevşek (%86), masaüstünde
    kartlar geniş olduğu için sıkı (%58) — ikisinde de logo kutuya oturuyor ama
    optik boyu benzer kalıyor.

    Ölçek İKİ AYRI değişken: mobil sınıflar --olcek-mobil, sm: sınıfları --olcek
    kullanıyor. Böylece panelde mobil ölçek yalnızca mobili, masaüstü ölçek
    yalnızca masaüstünü etkiliyor. min(...) tavanı büyük ölçekte taşmayı önlüyor.
  */
  const olcu = izgara
    ? "w-auto object-contain max-h-[calc(40px*var(--olcek-mobil))] max-w-[min(100%,calc(86%*var(--olcek-mobil)))] sm:max-h-[calc(38px*var(--olcek))] sm:max-w-[min(88%,calc(58%*var(--olcek)))]"
    : // Kayan şerit: geniş eşit kartta ortalanmış, YATAY BOŞLUKLU. max-w %80 ile
      // sınırlı ki YTU gibi geniş logolar kartın kenarına dayanmasın.
      "max-h-[30px] w-auto max-w-[80%] object-contain sm:max-h-[32px]";
  const renk = gri
    ? "grayscale opacity-65 group-hover:grayscale-0 group-hover:opacity-100"
    : "opacity-85 group-hover:opacity-100";

  /*
    Kayan şeritte (serit) EAGER yükleme: şerit ekrandan taşıyor ve logoların
    çoğu başlangıçta görünür alanın dışında. loading="lazy" bunları hiç
    yüklemiyor — CSS animasyonuyla kayarken de tembel yükleme tetiklenmediği
    için şeritte boşluklar geçiyordu. Izgarada lazy kalıyor: orada logolar tek
    tek ve çoğu ilk ekranda.
  */
  const yukleme = izgara ? "lazy" : "eager";

  const icerik = referans.logoUrl ? (
    // Supabase Storage host; next/image would need it added to remotePatterns.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={referans.logoUrl}
      alt={referans.ad}
      loading={yukleme}
      className={`${olcu} transition ${renk}`}
      style={
        izgara
          ? ({ "--olcek": String(olcek), "--olcek-mobil": String(olcekMobil) } as CSSProperties)
          : undefined
      }
    />
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
