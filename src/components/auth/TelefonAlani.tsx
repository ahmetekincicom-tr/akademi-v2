"use client";

import { useId } from "react";
import { UlkeKoduSecici } from "@/components/auth/UlkeKoduSecici";
import { okunurYaz, sadeceRakam } from "@/lib/telefon";
import { ETIKET, YARDIM } from "@/components/auth/stil";

/**
 * Ülke kodu + numara, tek bir alan gibi görünen iki parça.
 *
 * Kod ayrı duruyor çünkü tek bir metin kutusuna "+90 532…" yazdırmak, kişinin
 * sıfırla mı yoksa ülke koduyla mı yazacağını bilememesi demek.
 *
 * Etiket numara kutusuna bağlı (htmlFor); ülke kodu düğmesi kendi
 * aria-label'ını taşıyor. Eskiden <label> ikisini birden sarıyordu.
 */
export function TelefonAlani({
  ulkeKodu,
  numara,
  onUlkeKodu,
  onNumara,
  hataId,
  gecersiz,
}: {
  ulkeKodu: string;
  numara: string;
  onUlkeKodu: (v: string) => void;
  onNumara: (v: string) => void;
  /** Alan hatası gösteriliyorsa onun id'si (aria-describedby). */
  hataId?: string;
  gecersiz?: boolean;
}) {
  const id = useId();
  const yardimId = `${id}-yardim`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={ETIKET}>
        Telefon
      </label>

      {/* Odak halkası birleşik alanın tamamına: iki parça arasında kesilmesin. */}
      <div className="auth-telefon flex rounded-[9px] focus-within:shadow-[0_0_0_3px_rgba(28,86,243,0.45)] [&:focus-within_button]:border-brand [&:focus-within_input]:border-brand">
        <UlkeKoduSecici deger={ulkeKodu} onDegisim={onUlkeKodu} />
        <input
          id={id}
          // type="tel": mobilde numara tuş takımı açılıyor. type="number"
          // olsaydı baştaki sıfır silinir ve tekerlek kaydırınca değer değişirdi.
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder={ulkeKodu === "+90" ? "532 123 45 67" : "Numara"}
          value={numara}
          onChange={(e) => onNumara(okunurYaz(ulkeKodu, sadeceRakam(e.target.value)))}
          aria-describedby={[hataId, yardimId].filter(Boolean).join(" ")}
          aria-invalid={gecersiz || undefined}
          className="h-11 min-w-0 flex-1 rounded-r-[9px] border border-[#27272a] bg-[#111114] px-[13px] text-[15px] text-[#fafafa] outline-none placeholder:text-[#71717a] hover:border-[#3f3f46] aria-[invalid=true]:border-[#f87171]"
        />
      </div>

      <span id={yardimId} className={YARDIM}>
        Seans hatırlatmaları için. Başında sıfır olmadan yazabilirsin.
      </span>
    </div>
  );
}
