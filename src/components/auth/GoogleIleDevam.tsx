"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { authHatasi } from "@/lib/auth-hatalari";
import { UyariKutusu } from "@/components/auth/UyariKutusu";
import { IKINCIL } from "@/components/auth/stil";

/**
 * "Google ile devam et" — Supabase OAuth (PKCE).
 *
 * Dönüş mevcut /auth/callback'e: kod orada exchangeCodeForSession ile
 * oturuma çevriliyor, giriş kaydı ve hoş geldin maili de orada — e-posta
 * doğrulama bağlantısıyla aynı yol. Ayrı bir auth akışı yok.
 *
 * Aynı e-postayla daha önce açılmış hesap varsa Supabase kimliği o hesaba
 * bağlıyor (Google e-postası doğrulanmış olduğu için); kişi kendi hesabına
 * girer. Yeni hesapta KVKK/sözleşme onayı henüz yok: panel onu bir kez
 * /kayit/tamamla ekranına yönlendiriyor (bkz. panel/layout.tsx).
 *
 * Uygulama içinde (WKWebView) gösterilmiyor: Google gömülü tarayıcıda
 * oturum açmayı engelliyor (disallowed_useragent). Çağıran SadeceWeb ile sarıyor.
 */
export function GoogleIleDevam({ hedef = "/panel" }: { hedef?: string }) {
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const basla = async () => {
    if (yukleniyor) return;
    setYukleniyor(true);
    setHata(null);
    try {
      const { error } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(hedef)}`,
          // Hesap seçici her seferinde: ortak bilgisayarda yanlış Google
          // hesabıyla sessizce girilmesin.
          queryParams: { prompt: "select_account" },
        },
      });
      // Başarıda tarayıcı Google'a gidiyor; buraya yalnız hata dönerken gelinir.
      if (error) {
        setYukleniyor(false);
        setHata(authHatasi(error, "giris"));
      }
    } catch (e) {
      setYukleniyor(false);
      setHata(authHatasi(e, "giris"));
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <button type="button" onClick={basla} disabled={yukleniyor} className={`${IKINCIL} disabled:cursor-wait disabled:opacity-60`}>
        {/* Google "G" işareti — resmi renkleriyle, dekoratif. */}
        <svg aria-hidden width="18" height="18" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        {yukleniyor ? "Google'a yönlendiriliyor…" : "Google ile devam et"}
      </button>
      {hata && <UyariKutusu mesaj={hata} />}
    </div>
  );
}

/** "veya" ayırıcı: Google düğmesi ile e-posta formu arasında. */
export function VeyaAyirici() {
  return (
    <div className="flex items-center gap-3" aria-hidden>
      <span className="h-px flex-1 bg-white/[0.08]" />
      <span className="text-[12px] text-[#8b8b95]">veya e-postayla</span>
      <span className="h-px flex-1 bg-white/[0.08]" />
    </div>
  );
}
