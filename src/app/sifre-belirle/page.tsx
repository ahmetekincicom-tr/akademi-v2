"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordField } from "@/components/auth/PasswordField";

export default function SifreBelirlePage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const canSubmit = password.length >= 8 && password === confirm;

  return (
    <AuthShell topText="Hesabın yok mu?" topLinkLabel="Hesap oluştur" topLinkHref="/kayit">
      <div>
        <h1 className="font-heading text-[32px] leading-[1.12] font-semibold tracking-[-0.03em]">Yeni şifre belirle</h1>
        <p className="mt-[10px] text-[15px] text-[#5C6273]">
          Şifren en az 8 karakter olmalı; bir büyük harf ve bir rakam içermesi önerilir.
        </p>
        <div className="mt-[26px] flex flex-col gap-4">
          <PasswordField label="Yeni şifre" placeholder="En az 8 karakter" value={password} onChange={setPassword} showStrength />
          <label className="flex flex-col gap-2">
            <span className="font-mono text-[10px] tracking-[0.13em] text-[#8A8F9E] uppercase">Şifreyi tekrar yaz</span>
            <input
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-[50px] rounded-[11px] border border-ink/14 bg-white px-[15px] text-[15.5px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
            />
          </label>
        </div>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => router.push("/sifre-belirle/tamam")}
          className="mt-6 h-[52px] w-full rounded-[11px] bg-brand text-base font-semibold text-white shadow-[0_12px_28px_rgba(28,86,243,0.28)] hover:bg-ink disabled:cursor-not-allowed disabled:opacity-45"
        >
          Şifreyi güncelle
        </button>
      </div>
    </AuthShell>
  );
}
