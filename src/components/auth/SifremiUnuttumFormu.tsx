"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { authHatasi } from "@/lib/auth-hatalari";
import { WHATSAPP_NUMARALAR, whatsappLink } from "@/lib/iletisim";
import { useRouter } from "next/navigation";
import { UyariKutusu } from "@/components/auth/UyariKutusu";
import { Icon } from "@/components/Icon";
import { createClient } from "@/lib/supabase/client";
import { SadeceWeb, SadeceUygulama } from "@/components/panel/SadeceWeb";
import { ALAN, ALT_BASLIK, BAGLANTI, BASLIK, BIRINCIL, ETIKET } from "@/components/auth/stil";

export function SifremiUnuttumFormu({ uyari }: { uyari?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(uyari ?? null);
  const emailId = useId();
  const hataId = useId();

  const handleSubmit = async () => {
    if (!email) return;
    setYukleniyor(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/sifre-belirle`,
    });
    setYukleniyor(false);

    /*
      Adresin kayıtlı olup olmadığı BİLEREK belli edilmiyor: hata da olsa aynı
      ekrana gidiliyor. Aksi halde bu form, hangi e-postaların sisteme kayıtlı
      olduğunu sorgulamak için kullanılabilirdi.

      Ama hız sınırı gibi gerçek hatalar da sessizce yutuluyordu; onlar artık
      ekranda görünüyor — kullanıcı beklediği maili boşuna beklemesin.

      Hangi hatanın gösterileceği bir LİSTEYLE belirleniyor, "hepsini göster"
      ile değil: user_not_found gibi bir kod ekrana basılsaydı bu form yine
      adres sorgulama aracına dönerdi.
    */
    const gosterilebilir = new Set([
      "over_request_rate_limit",
      "over_email_send_rate_limit",
      "email_address_invalid",
      "validation_failed",
      "email_address_not_authorized",
      "email_provider_disabled",
      "provider_disabled",
      "captcha_failed",
      "request_timeout",
    ]);

    const agHatasi = error?.message?.toLowerCase().includes("failed to fetch");

    if (error && (error.status === 429 || agHatasi || gosterilebilir.has(error.code ?? ""))) {
      setHata(authHatasi(error, "sifre-sifirla"));
      return;
    }

    router.push(`/sifremi-unuttum/kontrol?email=${encodeURIComponent(email)}`);
  };

  return (
    <div>
      {/* Ok gerçek ikon: metin karakteri ("←") yazı tipine göre kayıyordu. */}
      <Link
        href="/giris"
        className="inline-flex items-center gap-[7px] rounded-[6px] py-1 text-[13px] font-semibold text-[#a1a1aa] hover:text-white"
      >
        <Icon name="arrowLeft" size={15} />
        Girişe dön
      </Link>
      <h1 className={`mt-5 ${BASLIK}`}>Şifreni sıfırla</h1>
      <p className={ALT_BASLIK}>
        Hesabına bağlı e-posta adresini yaz; sıfırlama bağlantısını hemen gönderelim. Bağlantı 30 dakika geçerli olur.
      </p>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (email && !yukleniyor) handleSubmit();
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
            className={ALAN}
          />
        </div>
        {/* Süresi dolmuş bağlantıyla gelinmişse (uyari) bu bir bilgi, hata değil. */}
        {hata && <UyariKutusu id={hataId} mesaj={hata} tur={hata === uyari ? "bilgi" : "hata"} />}
        <button type="submit" disabled={!email || yukleniyor} className={BIRINCIL}>
          {yukleniyor ? "Gönderiliyor…" : "Sıfırlama bağlantısı gönder"}
        </button>
      </form>

      <p className="mt-6 text-[13px] leading-[1.6] text-[#a1a1aa]">
        <SadeceWeb>
          E-postana erişimin yoksa{" "}
          <a
            href={whatsappLink(WHATSAPP_NUMARALAR[0].numara)}
            target="_blank"
            rel="noopener noreferrer"
            className={BAGLANTI}
          >
            WhatsApp&apos;tan yaz
          </a>
          ; kimliğini doğrulayıp adresi güncelleyelim.
        </SadeceWeb>
        <SadeceUygulama>
          E-postana erişimin yoksa eğitmeninle iletişime geç; kimliğini doğrulayıp adresi güncelleyelim.
        </SadeceUygulama>
      </p>
    </div>
  );
}
