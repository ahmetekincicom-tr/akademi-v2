"use client";

import { useState, useTransition } from "react";
import { testEpostasiGonder } from "@/app/kontrol-9f4x2k/(protected)/tani/actions";
import { Icon } from "@/components/Icon";

/**
 * "Anahtar tanımlı" ile "mail gerçekten düşüyor" arasında, doğrulanmış alan
 * adı ve gönderen adresi gibi sessizce patlayan bir sürü adım var. Tek yolu
 * gerçekten bir mail atmak.
 */
export function EpostaTesti() {
  const [sonuc, setSonuc] = useState<{ iyi: boolean; mesaj: string } | null>(null);
  const [islemde, basla] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-ink/7 px-[22px] py-[15px]">
      <button
        type="button"
        disabled={islemde}
        onClick={() =>
          basla(async () => {
            setSonuc(await testEpostasiGonder());
          })
        }
        className="flex h-9 flex-none items-center gap-[7px] rounded-[9px] bg-ink px-[14px] text-[13px] font-semibold text-white transition hover:bg-brand disabled:opacity-45"
      >
        <Icon name="mail" size={14} />
        {islemde ? "Gönderiliyor…" : "Test e-postası gönder"}
      </button>
      {sonuc && (
        <span className="text-[13px]" style={{ color: sonuc.iyi ? "#1C56F3" : "#C13333" }}>
          {sonuc.mesaj}
        </span>
      )}
    </div>
  );
}
