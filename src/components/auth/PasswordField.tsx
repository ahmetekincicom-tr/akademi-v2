"use client";

import { useState } from "react";

function strengthOf(password: string) {
  const len = password.length;
  const level = len === 0 ? 0 : len < 6 ? 1 : len < 10 ? 2 : 3;
  return [
    { yuzde: "0%", etiket: "—", renk: "#656B7A" },
    { yuzde: "33%", etiket: "zayıf", renk: "#D93C3C" },
    { yuzde: "66%", etiket: "orta", renk: "#C98A1B" },
    { yuzde: "100%", etiket: "güçlü", renk: "#1C56F3" },
  ][level];
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
  const strength = strengthOf(value);

  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.13em] text-[#656B7A] uppercase">{label}</span>
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="font-mono text-[10.5px] tracking-[0.06em] text-brand"
        >
          {visible ? "gizle" : "göster"}
        </button>
      </span>
      <input
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[50px] rounded-[11px] border border-ink/14 bg-white px-[15px] text-[15.5px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
      />
      {showStrength && (
        <span className="mt-0.5 flex items-center gap-2">
          <span className="h-1 flex-1 overflow-hidden rounded-full bg-ink/8">
            <span className="block h-full rounded-full transition-all" style={{ background: strength.renk, width: strength.yuzde }} />
          </span>
          <span className="w-[78px] text-right font-mono text-[10px]" style={{ color: strength.renk }}>
            {strength.etiket}
          </span>
        </span>
      )}
    </label>
  );
}
