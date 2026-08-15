"use client";

import { ULKELER, okunurYaz, sadeceRakam } from "@/lib/telefon";

/**
 * Ülke kodu + numara.
 *
 * Kod ayrı bir <select>: tek bir metin kutusuna "+90 532…" yazdırmak, kişinin
 * sıfırla mı yoksa ülke koduyla mı yazacağını bilememesi demek. Ayrıca yurt
 * dışından katılan biri kendi kodunu buradan seçebiliyor.
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
      <span className="flex gap-2">
        <select
          value={ulkeKodu}
          onChange={(e) => onUlkeKodu(e.target.value)}
          aria-label="Ülke kodu"
          className="h-[50px] w-[112px] flex-none rounded-[11px] border border-ink/14 bg-white px-[10px] text-[15px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
        >
          {ULKELER.map((u) => (
            // Etikette bayrak + kod var; ülke adı açık menüde görünüyor ama
            // kapalıyken dar alana sığması için kısa tutuluyor.
            <option key={u.kod + u.ad} value={u.kod}>
              {u.bayrak} {u.kod}
            </option>
          ))}
        </select>
        <input
          // type="tel": mobilde numara tuş takımı açılıyor. type="number"
          // olsaydı baştaki sıfır silinir ve tekerlek kaydırınca değer değişirdi.
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder={ulkeKodu === "+90" ? "532 123 45 67" : "Numara"}
          value={numara}
          onChange={(e) => onNumara(okunurYaz(ulkeKodu, sadeceRakam(e.target.value)))}
          className="h-[50px] min-w-0 flex-1 rounded-[11px] border border-ink/14 bg-white px-[15px] text-[15.5px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
        />
      </span>
      <span className="text-[12.5px] text-[#656B7A]">
        Seans hatırlatmaları ve acil durumlar için. Başında sıfır olmadan yazabilirsin.
      </span>
    </label>
  );
}
