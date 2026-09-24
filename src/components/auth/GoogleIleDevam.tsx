"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { authHatasi } from "@/lib/auth-hatalari";
import { oturumKaydet } from "@/app/oturum-actions";
import { UyariKutusu } from "@/components/auth/UyariKutusu";
import { GOOGLE_CLIENT_ID } from "@/lib/bolumler";

/**
 * "Google ile devam et" — Google Identity Services (GIS) + Supabase
 * signInWithIdToken.
 *
 * NEDEN REDIRECT (signInWithOAuth) DEĞİL: o akışta Google'ın onay ekranı
 * dönüş adresi olarak "…supabase.co" gösteriyor. Burada Google düğmesi kendi
 * sayfamızda çiziliyor, onay açılır pencerede ve Google yalnızca bizim alan
 * adımızı (JavaScript origin) ve uygulama adını gösteriyor; supabase.co hiç
 * görünmüyor. Ücretli özel alan adı eklentisi gerekmiyor.
 *
 * Güvenlik: Google'a SHA-256 ile özetlenmiş nonce veriliyor, Supabase'e ham
 * nonce; Supabase ID token'daki nonce'u doğruluyor (yeniden oynatma olmaz).
 *
 * Giriş sonrası: şifreyle girişteki gibi oturumKaydet() (giriş kaydı + hoş
 * geldin maili), ardından tam sayfa geçiş (yeni oturum çerezi sunucuya
 * gitsin). Onayı olmayan yeni Google hesabını panel bir kez /kayit/tamamla'ya
 * yönlendiriyor (panel/layout.tsx).
 *
 * Görünen düğme kartın tasarım dilinde (resmi "G" logosu + "Google ile devam
 * et"); tıklamayı üstüne serilen görünmez Google düğmesi (renderButton
 * iframe'i) alıyor, yani akış yine Google'ın kendi güvenli penceresi.
 * iOS uygulamasında gösterilmiyor (çağıran SadeceWeb ile sarıyor).
 */

type GisYanit = { credential: string };
type Gis = {
  accounts: {
    id: {
      initialize: (o: Record<string, unknown>) => void;
      renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
    };
  };
};
declare global {
  interface Window {
    google?: Gis;
  }
}

const GIS_SCRIPT = "https://accounts.google.com/gsi/client";

function gisYukle(): Promise<Gis> {
  return new Promise((coz, reddet) => {
    if (window.google?.accounts?.id) return coz(window.google);
    let s = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SCRIPT}"]`);
    if (!s) {
      s = document.createElement("script");
      s.src = GIS_SCRIPT;
      s.async = true;
      document.head.appendChild(s);
    }
    s.addEventListener("load", () => (window.google ? coz(window.google) : reddet(new Error("gis"))));
    s.addEventListener("error", () => reddet(new Error("gis")));
  });
}

async function nonceUret(): Promise<{ ham: string; ozet: string }> {
  const ham = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const ozetBayt = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ham));
  const ozet = Array.from(new Uint8Array(ozetBayt))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return { ham, ozet };
}

export function GoogleIleDevam({ hedef = "/panel", baglam = "signin" }: { hedef?: string; baglam?: "signin" | "signup" }) {
  const kutu = useRef<HTMLDivElement>(null);
  const [durum, setDurum] = useState<"yukleniyor" | "hazir" | "giriliyor" | "yok">("yukleniyor");
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    let iptal = false;
    (async () => {
      try {
        const [gis, nonce] = await Promise.all([gisYukle(), nonceUret()]);
        if (iptal || !kutu.current) return;

        gis.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          nonce: nonce.ozet,
          context: baglam,
          ux_mode: "popup",
          itp_support: true,
          use_fedcm_for_button: true,
          callback: async ({ credential }: GisYanit) => {
            setHata(null);
            setDurum("giriliyor");
            try {
              const { error } = await createClient().auth.signInWithIdToken({
                provider: "google",
                token: credential,
                nonce: nonce.ham,
              });
              if (error) {
                setDurum("hazir");
                setHata(authHatasi(error, "giris"));
                return;
              }
              try {
                await oturumKaydet();
              } catch (e) {
                console.error("[google] oturum kaydı yazılamadı:", e);
              }
              window.location.assign(hedef);
            } catch (e) {
              setDurum("hazir");
              setHata(authHatasi(e, "giris"));
            }
          },
        });

        // Görünmez düğme görünen düğmeyle aynı genişlikte (Google en fazla 400px).
        const genislik = Math.min(400, Math.max(200, Math.floor(kutu.current.getBoundingClientRect().width)));
        gis.accounts.id.renderButton(kutu.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "rectangular",
          text: baglam === "signup" ? "signup_with" : "continue_with",
          logo_alignment: "center",
          locale: "tr",
          width: genislik,
        });
        setDurum("hazir");
      } catch {
        // Script engellendi (reklam engelleyici vb.): düğme hiç çizilmiyor,
        // e-postayla giriş aynen duruyor.
        if (!iptal) setDurum("yok");
      }
    })();
    return () => {
      iptal = true;
    };
  }, [hedef, baglam]);

  if (durum === "yok") return null;

  return (
    <div className="flex flex-col gap-3">
      {/*
        Görünen düğme bizim tasarımımız; tıklamayı üstteki GÖRÜNMEZ Google
        düğmesi alıyor (GIS iframe'i, opaklık ~0). Böylece akış Google'ın
        kendi güvenli penceresi, görünüm ise kartın tasarım dili. Fare üstü ve
        klavye odağı iframe'de olduğu için stil sarmalayıcının group /
        focus-within durumundan geliyor.
      */}
      <div
        className={`group relative h-11 w-full rounded-[10px] focus-within:ring-2 focus-within:ring-[#7ea2ff] focus-within:ring-offset-2 focus-within:ring-offset-[#0d1017] ${
          durum === "giriliyor" ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <div
          aria-hidden
          className={`flex h-full w-full items-center justify-center gap-2.5 rounded-[10px] border border-white/[0.1] bg-[#141722] text-[14.5px] font-semibold text-[#fafafa] shadow-[0_1px_0_rgba(255,255,255,0.05)_inset] transition-colors group-hover:border-white/[0.18] group-hover:bg-[#1a1e2b] ${
            durum === "yukleniyor" ? "cursor-wait opacity-60" : ""
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
          </svg>
          {durum === "giriliyor" ? "Google ile giriş yapılıyor…" : "Google ile devam et"}
        </div>
        {/* Gerçek Google düğmesi: görünmez ama tıklanabilir; tüm alanı kaplar. */}
        <div
          ref={kutu}
          className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-[10px] opacity-[0.01] [&_iframe]:!h-11"
        />
      </div>
      <p className="sr-only" aria-live="polite">
        {durum === "giriliyor" ? "Google ile giriş yapılıyor…" : ""}
      </p>
      {hata && <UyariKutusu mesaj={hata} />}
      {/* Ayırıcı düğmeyle birlikte: Google yüklenemezse ikisi birden kaybolur. */}
      <div className="mt-2">
        <VeyaAyirici />
      </div>
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
