"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";

/**
 * Güç göstergesi yalnızca renk ve doluluk.
 *
 * Yanında "zayıf / orta / güçlü" yazıyordu; şifre yazarken göz oraya kayıyor ve
 * kelime, çubuğun zaten söylediği şeyi tekrarlıyordu. Etiket kaldırıldı, sinyal
 * rengin kendisinde kaldı — ekran okuyucular için aria-label'da duruyor.
 */
function gucOlc(password: string) {
  const len = password.length;
  const seviye = len === 0 ? 0 : len < 6 ? 1 : len < 10 ? 2 : 3;
  return [
    { yuzde: "0%", etiket: "boş", renk: "transparent" },
    { yuzde: "33%", etiket: "zayıf", renk: "#D93C3C" },
    { yuzde: "66%", etiket: "orta", renk: "#C98A1B" },
    { yuzde: "100%", etiket: "güçlü", renk: "#1C9A5F" },
  ][seviye];
}

export function PasswordField({
  label,
  placeholder,
  value,
  onChange,
  showStrength = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  showStrength?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const guc = gucOlc(value);

  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono text-[10px] tracking-[0.13em] text-[#656B7A] uppercase">{label}</span>

      {/* Göz düğmesi kutunun İÇİNDE: etiket satırında dururken "göster" yazısı
          etiketle aynı hizada iki ayrı işlev gibi okunuyordu. */}
      <span className="relative flex">
        <input
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-[50px] w-full rounded-[11px] border border-ink/14 bg-white pr-[46px] pl-[15px] text-[15.5px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Şifreyi gizle" : "Şifreyi göster"}
          // tabIndex -1: klavyeyle şifre alanından çıkan kişi doğrudan bir
          // sonraki alana geçsin, arada göz düğmesine takılmasın.
          tabIndex={-1}
          className="absolute top-0 right-0 flex h-[50px] w-[44px] items-center justify-center text-[#8A90A0] transition-colors hover:text-ink"
        >
          <Icon name={visible ? "eyeOff" : "eye"} size={18} />
        </button>
      </span>

      {showStrength && (
        <span
          className="mt-0.5 block h-[5px] overflow-hidden rounded-full bg-ink/8"
          role="progressbar"
          aria-label={`Şifre gücü: ${guc.etiket}`}
        >
          <span
            className="block h-full rounded-full transition-all duration-300"
            style={{ background: guc.renk, width: guc.yuzde }}
          />
        </span>
      )}
    </label>
  );
}
