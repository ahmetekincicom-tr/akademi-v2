"use client";

import { useState } from "react";
import Link from "next/link";
import { authHatasi } from "@/lib/auth-hatalari";
import { useRouter } from "next/navigation";
import { PasswordField } from "@/components/auth/PasswordField";
import { CheckToggle } from "@/components/auth/CheckToggle";
import { TelefonAlani } from "@/components/auth/TelefonAlani";
import { UyariKutusu } from "@/components/auth/UyariKutusu";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/Icon";
import { VARSAYILAN_ULKE, e164, telefonGecerliMi } from "@/lib/telefon";

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

  const handleSubmit = async () => {
    if (!telefonTamam) {
      setHata("Telefon numaranı kontrol eder misin?");
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
      <div>
        <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-brand/12 text-brand">
          <Icon name="mail" size={22} />
        </span>
        <h1 className="mt-6 font-heading text-[32px] leading-[1.12] font-semibold tracking-[-0.03em]">
          E-postana bir bağlantı gönderdik
        </h1>
        <p className="mt-[10px] text-[15px] leading-[1.6] text-[#5C6273]">
          <span className="font-semibold text-ink">{email}</span> adresine gönderdiğimiz bağlantıya tıklayarak
          hesabını doğrula. Doğruladıktan sonra doğrudan panele yönlendirileceksin.
        </p>
        <Link
          href="/giris"
          className="mt-[26px] flex h-[50px] w-full items-center justify-center rounded-[11px] border border-ink/14 bg-white text-[15px] font-semibold text-ink hover:border-brand hover:text-brand"
        >
          Girişe dön
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-[32px] leading-[1.12] font-semibold tracking-[-0.03em]">Hesabını oluştur</h1>
      <p className="mt-[10px] text-[15px] text-[#5C6273]">
        Eğitim kaydın sonrası aldığın davet e-postasındaki bilgilerle hesabını tamamla.
      </p>

      {/* Dar ekranda iki sütun 150px'e düşüp isim alanları okunmaz oluyordu. */}
      <div className="mt-[26px] grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[10px] tracking-[0.13em] text-[#656B7A] uppercase">Ad</span>
          <input
            type="text"
            autoComplete="given-name"
            placeholder="Selin"
            value={ad}
            onChange={(e) => setAd(e.target.value)}
            className="h-[50px] rounded-[11px] border border-ink/14 bg-white px-[15px] text-[15.5px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[10px] tracking-[0.13em] text-[#656B7A] uppercase">Soyad</span>
          <input
            type="text"
            autoComplete="family-name"
            placeholder="Kaya"
            value={soyad}
            onChange={(e) => setSoyad(e.target.value)}
            className="h-[50px] rounded-[11px] border border-ink/14 bg-white px-[15px] text-[15.5px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[10px] tracking-[0.13em] text-[#656B7A] uppercase">E-posta</span>
          <input
            type="email"
            autoComplete="email"
            placeholder="ornek@sirket.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-[50px] rounded-[11px] border border-ink/14 bg-white px-[15px] text-[15.5px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
          />
        </label>

        <TelefonAlani
          ulkeKodu={ulkeKodu}
          numara={telefon}
          onUlkeKodu={setUlkeKodu}
          onNumara={setTelefon}
        />

        <PasswordField
          label="Şifre"
          placeholder="En az 8 karakter"
          value={password}
          onChange={setPassword}
          showStrength
        />
      </div>

      {hata && (
        <div className="mt-5">
          <UyariKutusu mesaj={hata} />
        </div>
      )}

      {/*
        İki onay AYRI duruyor ve ikincisi işaretsiz başlıyor.

        6563 sayılı Kanun ticari elektronik ileti iznini ayrı, açık ve önceden
        işaretlenmemiş biçimde almayı şart koşuyor. Üyelik sözleşmesiyle aynı
        kutuya konursa izin geçersiz olur; kaydolmanın şartı haline getirilmesi
        de aynı kapıya çıkıyor. Bu yüzden düğme yalnızca birincisine bakıyor.
      */}
      <div className="mt-5 flex flex-col gap-[14px]">
        <CheckToggle checked={sozlesme} onToggle={() => setSozlesme((v) => !v)} align="start">
          <Link href="/uyelik-sozlesmesi" target="_blank" className="font-semibold text-brand underline">
            Üyelik ve Kullanım Sözleşmesi
          </Link>
          {"'ni ve "}
          <Link href="/kisisel-verilerin-islenmesi" target="_blank" className="font-semibold text-brand underline">
            KVKK Aydınlatma Metni
          </Link>
          {"'ni okudum, kabul ediyorum."}
        </CheckToggle>

        <CheckToggle checked={iletiIzni} onToggle={() => setIletiIzni((v) => !v)} align="start">
          Kampanya, duyuru ve yeni eğitimlerden e-posta ile haberdar olmak istiyorum.{" "}
          <span className="text-[#656B7A]">(isteğe bağlı, sonradan kapatabilirsin)</span>
        </CheckToggle>
      </div>

      <button
        type="button"
        disabled={!sozlesme || yukleniyor}
        onClick={handleSubmit}
        className="mt-6 h-[52px] w-full rounded-[11px] bg-brand text-base font-semibold text-white shadow-[0_12px_28px_rgba(28,86,243,0.28)] hover:bg-ink disabled:cursor-not-allowed disabled:opacity-45"
      >
        {yukleniyor ? "Hesap oluşturuluyor…" : "Hesabı oluştur"}
      </button>
      <p className="mt-5 text-sm text-[#656B7A]">
        Zaten hesabın var mı?{" "}
        <Link href="/giris" className="font-semibold text-brand">
          Giriş yap
        </Link>
      </p>
    </div>
  );
}
