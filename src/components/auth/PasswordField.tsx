"use client";

import { useId, useState } from "react";
import { Icon } from "@/components/Icon";
import { ALAN, ETIKET } from "@/components/auth/stil";

/**
 * Güç göstergesi yalnızca renk ve doluluk; ekran okuyucular için etiket
 * aria-label'da. Ölçüt eskisiyle aynı (uzunluk).
 */
function gucOlc(password: string) {
  const len = password.length;
  const seviye = len === 0 ? 0 : len < 6 ? 1 : len < 10 ? 2 : 3;
  return [
    { yuzde: "0%", etiket: "boş", renk: "transparent" },
    { yuzde: "33%", etiket: "zayıf", renk: "#ef4444" },
    { yuzde: "66%", etiket: "orta", renk: "#f59e0b" },
    { yuzde: "100%", etiket: "güçlü", renk: "#22c55e" },
  ][seviye];
}

export function PasswordField({
  label,
  placeholder,
  value,
  onChange,
  showStrength = false,
  autoComplete = "current-password",
  describedBy,
  invalid,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  showStrength?: boolean;
  /** "current-password" (giriş) ya da "new-password" (kayıt, yeni şifre). */
  autoComplete?: "current-password" | "new-password";
  /** Alanı açıklayan hata/yardım metninin id'si. */
  describedBy?: string;
  invalid?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const guc = gucOlc(value);
  const id = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={ETIKET}>
        {label}
      </label>

      {/* Göz düğmesi kutunun içinde; etiketin dışında ki tıklaması alanı
          odaklamaya çalışmasın. Klavyeyle erişilebilir (Tab ile gelinir). */}
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={`${ALAN} pr-12`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Şifreyi gizle" : "Şifreyi göster"}
          aria-controls={id}
          className="absolute top-1/2 right-1.5 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[7px] text-[#a1a1aa] transition-colors hover:bg-[#1c1c20] hover:text-[#fafafa]"
        >
          <Icon name={visible ? "eyeOff" : "eye"} size={18} />
        </button>
      </div>

      {showStrength && (
        <span
          className="mt-1 block h-[4px] overflow-hidden rounded-full bg-[#27272a]"
          role="progressbar"
          aria-label={`Şifre gücü: ${guc.etiket}`}
        >
          <span
            className="block h-full rounded-full transition-all duration-300"
            style={{ background: guc.renk, width: guc.yuzde }}
          />
        </span>
      )}
    </div>
  );
}
