"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckToggle } from "@/components/auth/CheckToggle";
import { createClient } from "@/lib/supabase/client";
import { oturumKaydet } from "@/app/oturum-actions";

/**
 * `hedef` is resolved on the server from the query string. Reading it here
 * with useSearchParams would force the whole page behind a Suspense boundary
 * and leave the server rendering nothing — which is exactly how this page
 * once ended up blank.
 */
export function GirisFormu({ hedef }: { hedef: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [remember, setRemember] = useState(true);
  const [hata, setHata] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      setHata(true);
      return;
    }
    setYukleniyor(true);
    setHata(false);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setYukleniyor(false);
      setHata(true);
      return;
    }
    // Oturum çerezi yazıldıktan sonra: IP ve konumu sunucu kendi okur.
    await oturumKaydet();
    setYukleniyor(false);
    router.push(hedef);
    router.refresh();
  };

  return (
    <div>
        <h1 className="font-heading text-[32px] leading-[1.12] font-semibold tracking-[-0.03em]">Panele giriş</h1>
        <p className="mt-[10px] text-[15px] text-[#5C6273]">Katılımcı hesabınla devam et.</p>

        {hata && (
          <div className="mt-[22px] flex items-start gap-[11px] rounded-[11px] border border-danger/35 bg-danger/7 px-[15px] py-[13px]">
            <span className="flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[6px] bg-danger text-[11px] font-bold text-white">
              !
            </span>
            <span className="text-sm leading-[1.5] text-danger-ink">
              E-posta veya şifre hatalı. Şifreni hatırlamıyorsan sıfırlama bağlantısı isteyebilirsin.
            </span>
          </div>
        )}

        <div className="mt-[26px] flex flex-col gap-4">
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
          <label className="flex flex-col gap-2">
            <span className="flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-[0.13em] text-[#8A8F9E] uppercase">Şifre</span>
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
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-[50px] rounded-[11px] border border-ink/14 bg-white px-[15px] text-[15.5px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
            />
          </label>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <CheckToggle checked={remember} onToggle={() => setRemember((v) => !v)}>
            Beni hatırla
          </CheckToggle>
          <Link href="/sifremi-unuttum" className="text-sm font-semibold text-brand">
            Şifremi unuttum
          </Link>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={yukleniyor}
          className="mt-6 h-[52px] w-full rounded-[11px] bg-brand text-base font-semibold text-white shadow-[0_12px_28px_rgba(28,86,243,0.28)] hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {yukleniyor ? "Giriş yapılıyor…" : "Giriş yap"}
        </button>

        <p className="mt-[26px] text-sm leading-[1.6] text-[#8A8F9E]">
          Panel erişimi yalnızca eğitime katılan kişiler içindir. Sorun yaşarsan{" "}
          <Link href="/iletisim">WhatsApp&apos;tan yaz</Link>.
        </p>
    </div>
  );
}
