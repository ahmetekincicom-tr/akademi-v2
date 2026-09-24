"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { authHatasi } from "@/lib/auth-hatalari";
import { WHATSAPP_NUMARALAR, whatsappLink } from "@/lib/iletisim";
import { PasswordField } from "@/components/auth/PasswordField";
import { UyariKutusu } from "@/components/auth/UyariKutusu";
import { DogrulamaYenidenGonder } from "@/components/auth/DogrulamaYenidenGonder";
import { createClient } from "@/lib/supabase/client";
import { oturumKaydet } from "@/app/oturum-actions";
import { SadeceWeb } from "@/components/panel/SadeceWeb";
import { ALAN, ALT_BASLIK, BAGLANTI, BASLIK, BIRINCIL, ETIKET } from "@/components/auth/stil";

/**
 * `hedef` is resolved on the server from the query string. Reading it here
 * with useSearchParams would force the whole page behind a Suspense boundary
 * and leave the server rendering nothing — which is exactly how this page
 * once ended up blank.
 */
export function GirisFormu({ hedef, baglantiHatasi = false }: { hedef: string; baglantiHatasi?: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const hataId = useId();
  const emailId = useId();

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
        setHata(authHatasi(error, "giris"));
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
      // Ağ hatası da buraya düşüyor; authHatasi onu da Türkçeye çeviriyor.
      setHata(authHatasi(e, "giris"));
    }
  };

  return (
    <div>
      <div className="text-center">
        <h1 className={BASLIK}>Panele giriş</h1>
        <p className={ALT_BASLIK}>Katılımcı hesabınla devam et.</p>
      </div>

      {/*
        Doğrulama / giriş bağlantısı geçersiz ya da süresi dolmuşsa
        /auth/onayla ve /auth/callback buraya ?hata=1 ile gönderiyor. Bu
        parametre daha önce hiç okunmuyordu; kişi sessizce boş formu görüyordu.
      */}
      {baglantiHatasi && !hata && (
        <div className="mt-6 flex flex-col gap-3">
          <UyariKutusu
            tur="bilgi"
            mesaj="Bağlantının süresi dolmuş ya da daha önce kullanılmış. Hesabını zaten doğruladıysan e-posta ve şifrenle giriş yapabilirsin."
          />
          {/* Doğrulanmamış hesap için yeni bağlantı: aynı Supabase akışı. */}
          <details className="rounded-[10px] border border-[#27272a] bg-[#0e0f12] px-[13px] py-[11px]">
            <summary className="cursor-pointer text-[13.5px] font-semibold text-[#d4d4d8]">
              Hesabım henüz doğrulanmadı, yeni bağlantı iste
            </summary>
            <div className="mt-3">
              <DogrulamaYenidenGonder />
            </div>
          </details>
        </div>
      )}

      {hata && (
        <div className="mt-6">
          <UyariKutusu id={hataId} mesaj={hata} />
        </div>
      )}

      {/*
        Gerçek <form>: Enter ile gönderilir. noValidate — doğrulama eskisi
        gibi handleSubmit'te; tarayıcının kendi balonları devreye girmesin.
        Yüklenirken ikinci gönderim yok (düğme kapalı + koşul).
      */}
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (!yukleniyor) handleSubmit();
        }}
        className="mt-6 flex flex-col gap-4"
        aria-busy={yukleniyor}
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor={emailId} className={ETIKET}>
            E-posta
          </label>
          <input
            id={emailId}
            type="email"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="ornek@sirket.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-describedby={hata ? hataId : undefined}
            aria-invalid={hata ? true : undefined}
            className={ALAN}
          />
        </div>

        <div className="flex flex-col gap-1">
          <PasswordField
            label="Şifre"
            placeholder="••••••••"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            describedBy={hata ? hataId : undefined}
            invalid={Boolean(hata)}
          />
          {/* "Beni hatırla" yok: oturum zaten kalıcı, çalışmayan bir denetim
              olmayandan kötü. Bağlantı tek başına durduğu için dokunma alanı
              geniş (py). */}
          <div className="flex justify-end">
            <Link href="/sifremi-unuttum" className={`py-2 text-[13px] ${BAGLANTI}`}>
              Şifremi unuttum
            </Link>
          </div>
        </div>

        <button type="submit" disabled={yukleniyor} className={BIRINCIL}>
          {yukleniyor ? "Giriş yapılıyor…" : "Giriş yap"}
        </button>
      </form>

      {/* Uygulamada iletişim bağlantısı yok: pazarlama sitesine açılıyordu. */}
      <p className="mt-6 text-center text-[13px] leading-[1.6] text-[#a1a1aa]">
        Panel erişimi yalnızca eğitime katılan kişiler içindir.{" "}
        <SadeceWeb>
          Sorun yaşarsan{" "}
          <a
            href={whatsappLink(WHATSAPP_NUMARALAR[0].numara)}
            target="_blank"
            rel="noopener noreferrer"
            className={BAGLANTI}
          >
            WhatsApp&apos;tan yaz
          </a>
          .
        </SadeceWeb>
      </p>
    </div>
  );
}
