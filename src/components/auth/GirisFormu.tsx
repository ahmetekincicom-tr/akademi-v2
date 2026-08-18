"use client";

import { useState } from "react";
import Link from "next/link";
import { WHATSAPP_NUMARALAR, whatsappLink } from "@/lib/iletisim";
import { PasswordField } from "@/components/auth/PasswordField";
import { UyariKutusu } from "@/components/auth/UyariKutusu";
import { createClient } from "@/lib/supabase/client";
import { oturumKaydet } from "@/app/oturum-actions";
import { SadeceWeb } from "@/components/panel/SadeceWeb";

/**
 * `hedef` is resolved on the server from the query string. Reading it here
 * with useSearchParams would force the whole page behind a Suspense boundary
 * and leave the server rendering nothing — which is exactly how this page
 * once ended up blank.
 */
export function GirisFormu({ hedef }: { hedef: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      setHata("E-posta ve şifre alanlarını doldur.");
      return;
    }
    setYukleniyor(true);
    setHata(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setYukleniyor(false);
        setHata(
          error.message === "Invalid login credentials"
            ? "E-posta veya şifre hatalı. Şifreni hatırlamıyorsan sıfırlama bağlantısı isteyebilirsin."
            : error.message,
        );
        return;
      }

      // Giriş kaydı bir yan iş. Tablo yoksa veya bu çağrı düşerse giriş yine de
      // tamamlanmalı — burada beklenmeyen bir hata girişi engellemesin.
      try {
        await oturumKaydet();
      } catch (e) {
        console.error("[giris] oturum kaydı yazılamadı:", e);
      }

      // Tam sayfa geçişi: yeni yazılan oturum çerezi ilk istekte sunucuya gider,
      // böylece proxy oturumu göremeyip girişe geri atmaz.
      window.location.assign(hedef);
    } catch (e) {
      setYukleniyor(false);
      setHata(e instanceof Error ? e.message : "Beklenmeyen bir hata oldu. Tekrar dene.");
    }
  };

  return (
    <div>
        <h1 className="font-heading text-[32px] leading-[1.12] font-semibold tracking-[-0.03em]">Panele giriş</h1>
        <p className="mt-[10px] text-[15px] text-[#5C6273]">Katılımcı hesabınla devam et.</p>

        {hata && (
          <div className="mt-[22px]">
            <UyariKutusu mesaj={hata} />
          </div>
        )}

        <div className="mt-[26px] flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="font-mono text-[10px] tracking-[0.13em] text-[#656B7A] uppercase">E-posta</span>
            <input
              type="email"
              placeholder="ornek@sirket.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-[50px] rounded-[11px] border border-ink/14 bg-white px-[15px] text-[15.5px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
            />
          </label>
          <PasswordField label="Şifre" placeholder="••••••••" value={password} onChange={setPassword} />
        </div>

        {/* "Beni hatırla" kutusu kaldırıldı: durumu hiçbir yerde okunmuyordu,
            yani işaretlense de işaretlenmese de aynı şey oluyordu. Oturum
            zaten kalıcı — çalışmayan bir denetim, olmayandan kötü. */}
        <div className="mt-4 flex justify-end">
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

        {/* Uygulamada iletişim bağlantısı yok: pazarlama sitesine açılıyor ve
            oradan tüm site gezilebiliyordu. Cümle bağlantısız kalıyor. */}
        <p className="mt-[26px] text-sm leading-[1.6] text-[#656B7A]">
          Panel erişimi yalnızca eğitime katılan kişiler içindir.{" "}
          <SadeceWeb>
            {/* Doğrudan WhatsApp: iletişim sayfası ön yüzle birlikte kapalı,
                ayrıca giriş yapamayan biri için en kısa yol zaten bu. */}
            Sorun yaşarsan{" "}
            <a href={whatsappLink(WHATSAPP_NUMARALAR[0].numara)} target="_blank" rel="noopener noreferrer">
              WhatsApp&apos;tan yaz
            </a>
            .
          </SadeceWeb>
        </p>
    </div>
  );
}
