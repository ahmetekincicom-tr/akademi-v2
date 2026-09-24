"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { authHatasi } from "@/lib/auth-hatalari";
import { PasswordField } from "@/components/auth/PasswordField";
import { UyariKutusu } from "@/components/auth/UyariKutusu";
import { createClient } from "@/lib/supabase/client";
import { ALAN_HATASI, ALT_BASLIK, BASLIK, BIRINCIL, YARDIM } from "@/components/auth/stil";

export function SifreBelirleFormu() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const canSubmit = password.length >= 8 && password === confirm;

  // Sunum: kural aynı (canSubmit); yalnız neden kapalı olduğu alanın yanında
  // söyleniyor. Kişi yazmayı bitirmeden kırmızı görmesin diye koşullu.
  const kimlik = useId();
  const uzunlukId = `${kimlik}-uzunluk`;
  const eslesmeId = `${kimlik}-eslesme`;
  const hataId = `${kimlik}-hata`;
  const kisa = password.length > 0 && password.length < 8;
  const eslesmiyor = confirm.length > 0 && password !== confirm;

  const handleSubmit = async () => {
    setYukleniyor(true);
    setHata(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setYukleniyor(false);
    if (error) {
      setHata(authHatasi(error, "sifre-degistir"));
      return;
    }
    router.push("/sifre-belirle/tamam");
  };

  return (
    <div>
      <h1 className={BASLIK}>Yeni şifre belirle</h1>
      <p className={ALT_BASLIK}>Şifren en az 8 karakter olmalı; bir büyük harf ve bir rakam içermesi önerilir.</p>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit && !yukleniyor) handleSubmit();
        }}
        className="mt-6 flex flex-col gap-4"
        aria-busy={yukleniyor}
      >
        <div className="flex flex-col gap-1.5">
          <PasswordField
            label="Yeni şifre"
            placeholder="En az 8 karakter"
            value={password}
            onChange={setPassword}
            showStrength
            autoComplete="new-password"
            describedBy={[uzunlukId, hata ? hataId : ""].filter(Boolean).join(" ")}
            invalid={kisa}
          />
          <p id={uzunlukId} className={kisa ? ALAN_HATASI : YARDIM}>
            {kisa ? `En az 8 karakter olmalı (${password.length}/8).` : "En az 8 karakter."}
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <PasswordField
            label="Şifreyi tekrar yaz"
            placeholder="••••••••"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            describedBy={eslesmiyor ? eslesmeId : undefined}
            invalid={eslesmiyor}
          />
          {eslesmiyor && (
            <p id={eslesmeId} className={ALAN_HATASI} aria-live="polite">
              Şifreler eşleşmiyor.
            </p>
          )}
        </div>
        {hata && <UyariKutusu id={hataId} mesaj={hata} />}
        <button type="submit" disabled={!canSubmit || yukleniyor} className={BIRINCIL}>
          {yukleniyor ? "Güncelleniyor…" : "Şifreyi güncelle"}
        </button>
      </form>
    </div>
  );
}
