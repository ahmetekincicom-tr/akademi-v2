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
 * Düğme Google'ın kendi düğmesi (renderButton): marka kuralları gereği
 * görünümü Google belirliyor; koyu tema ve kart genişliğiyle çiziliyor.
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

        // Kart genişliği (Google en fazla 400px çiziyor).
        const genislik = Math.min(400, Math.max(200, Math.floor(kutu.current.getBoundingClientRect().width)));
        gis.accounts.id.renderButton(kutu.current, {
          type: "standard",
          theme: "filled_black",
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
      {/* Google düğmesi buraya çiziliyor; yüklenene kadar aynı boyda yer tutucu
          (düzen zıplamasın). */}
      <div className="relative flex min-h-[44px] justify-center">
        <div ref={kutu} className={`flex w-full justify-center ${durum === "giriliyor" ? "pointer-events-none opacity-50" : ""}`} />
        {durum === "yukleniyor" && (
          <div aria-hidden className="absolute inset-0 animate-pulse rounded-[9px] border border-[#27272a] bg-[#18181b]" />
        )}
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
