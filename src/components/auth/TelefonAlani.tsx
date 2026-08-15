"use client";

import { UlkeKoduSecici } from "@/components/auth/UlkeKoduSecici";
import { okunurYaz, sadeceRakam } from "@/lib/telefon";

/**
 * Ülke kodu + numara, tek bir alan gibi görünen iki parça.
 *
 * Kod ayrı duruyor çünkü tek bir metin kutusuna "+90 532…" yazdırmak, kişinin
 * sıfırla mı yoksa ülke koduyla mı yazacağını bilememesi demek.
 */
export function TelefonAlani({
  ulkeKodu,
  numara,
  onUlkeKodu,
  onNumara,
}: {
  ulkeKodu: string;
  numara: string;
  onUlkeKodu: (v: string) => void;
  onNumara: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono text-[10px] tracking-[0.13em] text-[#656B7A] uppercase">Telefon</span>

      {/* Odak halkası parçalardan birine değil, birleşik alanın tamamına
          uygulanıyor; yoksa iki parça arasında halka kesiliyor. */}
      <span className="flex rounded-[11px] focus-within:shadow-[0_0_0_3px_rgba(28,86,243,0.14)] [&:focus-within_button]:border-brand [&:focus-within_input]:border-brand">
        <UlkeKoduSecici deger={ulkeKodu} onDegisim={onUlkeKodu} />
        <input
          // type="tel": mobilde numara tuş takımı açılıyor. type="number"
          // olsaydı baştaki sıfır silinir ve tekerlek kaydırınca değer değişirdi.
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder={ulkeKodu === "+90" ? "532 123 45 67" : "Numara"}
          value={numara}
          onChange={(e) => onNumara(okunurYaz(ulkeKodu, sadeceRakam(e.target.value)))}
          className="h-[50px] min-w-0 flex-1 rounded-r-[11px] border border-ink/14 bg-white px-[15px] text-[15.5px] text-ink outline-none"
        />
      </span>

      <span className="text-[12.5px] text-[#656B7A]">
        Seans hatırlatmaları için. Başında sıfır olmadan yazabilirsin.
      </span>
    </label>
  );
}
