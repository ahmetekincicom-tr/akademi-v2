"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { createClient } from "@/lib/supabase/client";

export default function SifremiUnuttumPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  const handleSubmit = async () => {
    if (!email) return;
    setYukleniyor(true);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/sifre-belirle`,
    });
    setYukleniyor(false);
    router.push("/sifremi-unuttum/kontrol");
  };

  return (
    <AuthShell topText="Hesabın yok mu?" topLinkLabel="Hesap oluştur" topLinkHref="/kayit">
      <div>
        <Link href="/giris" className="text-[13.5px] font-semibold text-[#5C6273] hover:text-brand">
          ← Girişe dön
        </Link>
        <h1 className="mt-5 font-heading text-[32px] leading-[1.12] font-semibold tracking-[-0.03em]">
          Şifreni sıfırla
        </h1>
        <p className="mt-[10px] text-[15px] leading-[1.6] text-[#5C6273]">
          Hesabına bağlı e-posta adresini yaz; sıfırlama bağlantısını hemen gönderelim. Bağlantı 30 dakika geçerli
          olur.
        </p>
        <label className="mt-[26px] flex flex-col gap-2">
          <span className="font-mono text-[10px] tracking-[0.13em] text-[#8A8F9E] uppercase">E-posta</span>
          <input
            type="email"
            placeholder="ornek@sirket.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-[50px] rounded-[11px] border border-ink/14 bg-white px-[15px] text-[15.5px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
          />
        </label>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!email || yukleniyor}
          className="mt-6 h-[52px] w-full rounded-[11px] bg-brand text-base font-semibold text-white shadow-[0_12px_28px_rgba(28,86,243,0.28)] hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {yukleniyor ? "Gönderiliyor…" : "Sıfırlama bağlantısı gönder"}
        </button>
        <p className="mt-[22px] text-sm leading-[1.6] text-[#8A8F9E]">
          E-postana erişimin yoksa <Link href="/iletisim">destek ekibine yaz</Link>; kimliğini doğrulayıp adresi güncelleyelim.
        </p>
      </div>
    </AuthShell>
  );
}
