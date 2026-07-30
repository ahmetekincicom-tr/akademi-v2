"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordField } from "@/components/auth/PasswordField";
import { CheckToggle } from "@/components/auth/CheckToggle";
import { createClient } from "@/lib/supabase/client";

export default function KayitPage() {
  const router = useRouter();
  const [ad, setAd] = useState("");
  const [soyad, setSoyad] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [kvkk, setKvkk] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [gonderildi, setGonderildi] = useState(false);

  const handleSubmit = async () => {
    setYukleniyor(true);
    setHata(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { ad, soyad } },
    });
    setYukleniyor(false);
    if (error) {
      setHata(error.message);
      return;
    }
    if (data.session) {
      router.push("/panel");
      router.refresh();
      return;
    }
    setGonderildi(true);
  };

  if (gonderildi) {
    return (
      <AuthShell topText="Zaten hesabın var mı?" topLinkLabel="Giriş yap" topLinkHref="/giris">
        <div>
          <h1 className="font-heading text-[32px] leading-[1.12] font-semibold tracking-[-0.03em]">
            E-postana bir bağlantı gönderdik
          </h1>
          <p className="mt-[10px] text-[15px] leading-[1.6] text-[#5C6273]">
            {email} adresine gönderdiğimiz bağlantıya tıklayarak hesabını doğrula. Doğruladıktan sonra doğrudan panele
            yönlendirileceksin.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell topText="Zaten hesabın var mı?" topLinkLabel="Giriş yap" topLinkHref="/giris">
      <div>
        <h1 className="font-heading text-[32px] leading-[1.12] font-semibold tracking-[-0.03em]">Hesabını oluştur</h1>
        <p className="mt-[10px] text-[15px] text-[#5C6273]">
          Eğitim kaydın sonrası aldığın davet e-postasındaki bilgilerle hesabını tamamla.
        </p>

        <div className="mt-[26px] grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-2">
            <span className="font-mono text-[10px] tracking-[0.13em] text-[#8A8F9E] uppercase">Ad</span>
            <input
              type="text"
              placeholder="Selin"
              value={ad}
              onChange={(e) => setAd(e.target.value)}
              className="h-[50px] rounded-[11px] border border-ink/14 bg-white px-[15px] text-[15.5px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-mono text-[10px] tracking-[0.13em] text-[#8A8F9E] uppercase">Soyad</span>
            <input
              type="text"
              placeholder="Kaya"
              value={soyad}
              onChange={(e) => setSoyad(e.target.value)}
              className="h-[50px] rounded-[11px] border border-ink/14 bg-white px-[15px] text-[15.5px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="font-mono text-[10px] tracking-[0.13em] text-[#8A8F9E] uppercase">E-posta</span>
            <input
              type="email"
              placeholder="ornek@sirket.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-[50px] rounded-[11px] border border-ink/14 bg-white px-[15px] text-[15.5px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
            />
          </label>
          <PasswordField
            label="Şifre"
            placeholder="En az 8 karakter"
            value={password}
            onChange={setPassword}
            showStrength
          />
        </div>

        {hata && (
          <div className="mt-5 flex items-start gap-[11px] rounded-[11px] border border-danger/35 bg-danger/7 px-[15px] py-[13px]">
            <span className="flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[6px] bg-danger text-[11px] font-bold text-white">
              !
            </span>
            <span className="text-sm leading-[1.5] text-danger-ink">{hata}</span>
          </div>
        )}

        <div className="mt-5">
          <CheckToggle checked={kvkk} onToggle={() => setKvkk((v) => !v)} align="start">
            Kişisel verilerin işlenmesi ve mesafeli satış koşullarını okudum, onaylıyorum.
          </CheckToggle>
        </div>

        <button
          type="button"
          disabled={!kvkk || yukleniyor}
          onClick={handleSubmit}
          className="mt-6 h-[52px] w-full rounded-[11px] bg-brand text-base font-semibold text-white shadow-[0_12px_28px_rgba(28,86,243,0.28)] hover:bg-ink disabled:cursor-not-allowed disabled:opacity-45"
        >
          {yukleniyor ? "Hesap oluşturuluyor…" : "Hesabı oluştur"}
        </button>
        <p className="mt-5 text-sm text-[#8A8F9E]">
          Zaten hesabın var mı? <Link href="/giris">Giriş yap</Link>
        </p>
      </div>
    </AuthShell>
  );
}
