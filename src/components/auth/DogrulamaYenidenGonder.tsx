"use client";

import { useEffect, useId, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { authHatasi } from "@/lib/auth-hatalari";
import { UyariKutusu } from "@/components/auth/UyariKutusu";
import { ALAN, ETIKET, IKINCIL } from "@/components/auth/stil";

/**
 * Hesap doğrulama e-postasını yeniden gönderir.
 *
 * Yalnızca Supabase'in kendi `auth.resend({ type: "signup" })` çağrısı: mail
 * yine Supabase'ten (Custom SMTP → Resend) ve aynı "Confirm signup"
 * şablonuyla çıkıyor; ikinci bir doğrulama sistemi yok. `emailRedirectTo`
 * verilmiyor — signUp da vermiyor; şablon bağlantıyı {{ .SiteURL }} ile
 * /auth/onayla'ya kuruyor (bkz. docs/eposta.md).
 *
 * Geri sayım: Supabase aynı adrese iki doğrulama maili arasında varsayılan
 * olarak 60 sn bekletiyor (SMTP ayarlarındaki "minimum interval"). Düğme bu
 * süre boyunca kapalı; sunucu yine de 429 dönerse mesajdaki saniye
 * okunup sayaç ona göre kuruluyor.
 *
 * Adresin kayıtlı olup olmadığı belli edilmiyor: başarı metni koşullu.
 */

const BEKLEME_SN = 60;

function beklemeSuresi(hata: { message?: string; status?: number; code?: string }): number | null {
  const oranSiniri =
    hata.status === 429 || hata.code === "over_email_send_rate_limit" || hata.code === "over_request_rate_limit";
  if (!oranSiniri) return null;
  // "For security purposes, you can only request this after 42 seconds."
  const sn = Number(/after (\d+) seconds?/i.exec(hata.message ?? "")?.[1]);
  return Number.isFinite(sn) && sn > 0 ? sn : BEKLEME_SN;
}

export function DogrulamaYenidenGonder({
  email: sabitEmail,
  baslangicBekleme = 0,
}: {
  /** Biliniyorsa (kayıt sonrası ekran) alan gösterilmez. */
  email?: string;
  /** Mail az önce gönderildiyse ilk bekleme (sn). */
  baslangicBekleme?: number;
}) {
  const [email, setEmail] = useState(sabitEmail ?? "");
  const [kalan, setKalan] = useState(baslangicBekleme);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [durum, setDurum] = useState<{ tur: "hata" | "bilgi"; mesaj: string } | null>(null);
  const emailId = useId();
  const durumId = useId();

  // Saniyede bir azalan sayaç; sıfırda durur.
  useEffect(() => {
    if (kalan <= 0) return;
    const t = setTimeout(() => setKalan((k) => k - 1), 1000);
    return () => clearTimeout(t);
  }, [kalan]);

  const gonder = async () => {
    const adres = email.trim();
    if (!adres || yukleniyor || kalan > 0) return;
    setYukleniyor(true);
    setDurum(null);
    try {
      const { error } = await createClient().auth.resend({ type: "signup", email: adres });
      if (error) {
        const bekle = beklemeSuresi(error);
        if (bekle) setKalan(bekle);
        setDurum({ tur: "hata", mesaj: authHatasi(error, "kayit") });
      } else {
        setKalan(BEKLEME_SN);
        setDurum({
          tur: "bilgi",
          mesaj: `${adres} doğrulanmamış bir hesaba aitse yeni bir doğrulama bağlantısı gönderdik. Önceki bağlantılar artık geçersiz olabilir; en son geleni kullan.`,
        });
      }
    } catch (e) {
      setDurum({ tur: "hata", mesaj: authHatasi(e, "kayit") });
    } finally {
      setYukleniyor(false);
    }
  };

  const etiket = yukleniyor
    ? "Gönderiliyor…"
    : kalan > 0
      ? `Tekrar göndermek için ${kalan} sn`
      : "Doğrulama bağlantısını tekrar gönder";

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void gonder();
      }}
      className="flex flex-col gap-3 text-left"
      aria-busy={yukleniyor}
    >
      {sabitEmail === undefined && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={emailId} className={ETIKET}>
            Kayıt olduğun e-posta
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
            aria-describedby={durum ? durumId : undefined}
            className={ALAN}
          />
        </div>
      )}
      {/* aria-live: sayaç her saniye okunmasın diye düğmede değil; yalnız
          sonuç kutusu duyuruluyor (UyariKutusu role=alert/status). */}
      <button type="submit" disabled={yukleniyor || kalan > 0 || !email.trim()} className={`${IKINCIL} disabled:cursor-not-allowed disabled:opacity-55`}>
        {etiket}
      </button>
      {durum && <UyariKutusu id={durumId} tur={durum.tur} mesaj={durum.mesaj} />}
    </form>
  );
}
