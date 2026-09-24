"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { authHatasi } from "@/lib/auth-hatalari";
import { useRouter } from "next/navigation";
import { PasswordField } from "@/components/auth/PasswordField";
import { CheckToggle } from "@/components/auth/CheckToggle";
import { TelefonAlani } from "@/components/auth/TelefonAlani";
import { UyariKutusu } from "@/components/auth/UyariKutusu";
import { DogrulamaYenidenGonder } from "@/components/auth/DogrulamaYenidenGonder";
import { GoogleIleDevam } from "@/components/auth/GoogleIleDevam";
import { SadeceWeb } from "@/components/panel/SadeceWeb";
import { GOOGLE_GIRIS_ACIK } from "@/lib/bolumler";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/Icon";
import { VARSAYILAN_ULKE, e164, telefonGecerliMi } from "@/lib/telefon";
import { ALAN, ALAN_HATASI, ALT_BASLIK, BAGLANTI, BASLIK, BIRINCIL, ETIKET, IKINCIL, YARDIM } from "@/components/auth/stil";

/** handleSubmit'in telefon mesajı; alanın yanında gösterilsin diye adlı. */
const TELEFON_HATASI = "Telefon numaranı kontrol eder misin?";

export function KayitFormu() {
  const router = useRouter();
  const [ad, setAd] = useState("");
  const [soyad, setSoyad] = useState("");
  const [email, setEmail] = useState("");
  const [ulkeKodu, setUlkeKodu] = useState(VARSAYILAN_ULKE);
  const [telefon, setTelefon] = useState("");
  const [password, setPassword] = useState("");
  const [sozlesme, setSozlesme] = useState(false);
  const [iletiIzni, setIletiIzni] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [gonderildi, setGonderildi] = useState(false);

  const telefonTamam = telefonGecerliMi(ulkeKodu, telefon);

  // Sunum: kimlikler (label/aria-describedby) ve telefon hatasının genel
  // kutu yerine alanın yanında gösterilmesi.
  const kimlik = useId();
  const hataId = `${kimlik}-hata`;
  const telefonHataId = `${kimlik}-tel-hata`;
  const telefonHatasi = hata === TELEFON_HATASI;
  const genelHata = hata !== null && !telefonHatasi;
  const sonucBaslik = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    // Form yerini sonuç ekranına bırakınca odak başlığa: ekran okuyucu
    // değişikliği duyurur, klavye kullanıcısı sayfanın başından devam eder.
    if (gonderildi) sonucBaslik.current?.focus();
  }, [gonderildi]);

  const handleSubmit = async () => {
    if (!telefonTamam) {
      setHata(TELEFON_HATASI);
      return;
    }
    setYukleniyor(true);
    setHata(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Bu alanlar handle_new_user tetikleyicisiyle profiles'a yazılıyor.
        // Onay TARİHLERİ buradan gönderilmiyor; sunucu now() ile damgalıyor.
        data: {
          ad,
          soyad,
          telefon: e164(ulkeKodu, telefon),
          sozlesme_onayi: true,
          ileti_izni: iletiIzni,
        },
      },
    });
    setYukleniyor(false);
    if (error) {
      setHata(authHatasi(error, "kayit"));
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
      <div className="text-center" role="status" aria-live="polite">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-[14px] border border-brand/40 bg-brand/15 text-[#8fb0ff]">
          <Icon name="mail" size={22} />
        </span>
        <h1 ref={sonucBaslik} tabIndex={-1} className={`mt-6 outline-none ${BASLIK}`}>
          E-postana bir bağlantı gönderdik
        </h1>
        <p className={`${ALT_BASLIK} mt-3`}>
          <span className="font-semibold break-all text-[#fafafa]">{email}</span> adresine gönderdiğimiz bağlantıya
          tıklayarak hesabını doğrula. Doğruladıktan sonra doğrudan panele yönlendirileceksin.
        </p>
        <p className={`${YARDIM} mt-4`}>
          Birkaç dakika içinde gelmezse spam / gereksiz klasörüne de bak. Bağlantı yalnızca bir kez çalışır.
        </p>
        {/* Mail az önce gitti: ilk 60 sn yeniden gönderme kapalı (Supabase de
            aynı aralıkla sınırlıyor). */}
        <div className="mt-7">
          <DogrulamaYenidenGonder email={email} baslangicBekleme={60} />
        </div>
        <Link href="/giris" className={`${IKINCIL} mt-3`}>
          Girişe dön
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center">
        <h1 className={BASLIK}>Hesabını oluştur</h1>
        <p className={ALT_BASLIK}>Eğitim kaydında kullandığın e-postayla devam et.</p>
      </div>

      {/* Google ile kayıtta sözleşme onayı ve telefon ilk girişte
          /kayit/tamamla ekranında alınıyor. */}
      {GOOGLE_GIRIS_ACIK && (
        <SadeceWeb>
          <div className="mt-6">
            <GoogleIleDevam baglam="signup" />
          </div>
        </SadeceWeb>
      )}

      {/* noValidate: doğrulama eskisi gibi handleSubmit'te. Onay kutusu
          işaretlenmeden düğme kapalı; kapalı düğmeyle Enter da gönderemez. */}
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (sozlesme && !yukleniyor) handleSubmit();
        }}
        className="mt-6 flex flex-col gap-3.5"
        aria-busy={yukleniyor}
      >
        {/* Mobilde alt alta, 640px ve üstünde yan yana. */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor={`${kimlik}-ad`} className={ETIKET}>
              Ad
            </label>
            <input
              id={`${kimlik}-ad`}
              type="text"
              autoComplete="given-name"
              placeholder="Selin"
              value={ad}
              onChange={(e) => setAd(e.target.value)}
              aria-describedby={genelHata ? hataId : undefined}
              className={ALAN}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor={`${kimlik}-soyad`} className={ETIKET}>
              Soyad
            </label>
            <input
              id={`${kimlik}-soyad`}
              type="text"
              autoComplete="family-name"
              placeholder="Kaya"
              value={soyad}
              onChange={(e) => setSoyad(e.target.value)}
              aria-describedby={genelHata ? hataId : undefined}
              className={ALAN}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${kimlik}-email`} className={ETIKET}>
            E-posta
          </label>
          <input
            id={`${kimlik}-email`}
            type="email"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="ornek@sirket.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-describedby={genelHata ? hataId : undefined}
            className={ALAN}
          />
        </div>

        {/* Telefon ve şifre 640px ve üstünde yan yana: form bir ekrana sığsın. */}
        <div className="grid grid-cols-1 items-start gap-3.5 sm:grid-cols-2 sm:gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <TelefonAlani
              ulkeKodu={ulkeKodu}
              numara={telefon}
              onUlkeKodu={setUlkeKodu}
              onNumara={setTelefon}
              hataId={telefonHatasi ? telefonHataId : undefined}
              gecersiz={telefonHatasi}
              yardimGizli
            />
            {telefonHatasi && (
              <p id={telefonHataId} role="alert" className={ALAN_HATASI}>
                {hata}
              </p>
            )}
          </div>

          <PasswordField
            label="Şifre"
            placeholder="En az 8 karakter"
            value={password}
            onChange={setPassword}
            showStrength
            autoComplete="new-password"
            describedBy={genelHata ? hataId : undefined}
          />
        </div>

        {genelHata && <UyariKutusu id={hataId} mesaj={hata} />}

        {/*
          İki onay AYRI duruyor ve ikincisi işaretsiz başlıyor.

          6563 sayılı Kanun ticari elektronik ileti iznini ayrı, açık ve önceden
          işaretlenmemiş biçimde almayı şart koşuyor. Üyelik sözleşmesiyle aynı
          kutuya konursa izin geçersiz olur; kaydolmanın şartı haline getirilmesi
          de aynı kapıya çıkıyor. Bu yüzden düğme yalnızca birincisine bakıyor.
        */}
        <fieldset className="mt-1 flex flex-col gap-2.5">
          <legend className="sr-only">Onaylar</legend>
          <CheckToggle checked={sozlesme} onToggle={() => setSozlesme((v) => !v)} align="start">
            <Link href="/uyelik-sozlesmesi" target="_blank" className={`underline ${BAGLANTI}`}>
              Üyelik ve Kullanım Sözleşmesi
            </Link>
            {"'ni ve "}
            <Link href="/kisisel-verilerin-islenmesi" target="_blank" className={`underline ${BAGLANTI}`}>
              KVKK Aydınlatma Metni
            </Link>
            {"'ni okudum, kabul ediyorum. "}
            <span className="text-[#8b8b95]">(zorunlu)</span>
          </CheckToggle>
          <CheckToggle checked={iletiIzni} onToggle={() => setIletiIzni((v) => !v)} align="start">
            Kampanya, duyuru ve yeni eğitimlerden e-posta ile haberdar olmak istiyorum.{" "}
            <span className="text-[#8b8b95]">(isteğe bağlı, sonradan kapatabilirsin)</span>
          </CheckToggle>
        </fieldset>

        <button type="submit" disabled={!sozlesme || yukleniyor} className={`${BIRINCIL} mt-1`}>
          {yukleniyor ? "Hesap oluşturuluyor…" : "Hesabı oluştur"}
        </button>
      </form>
    </div>
  );
}
