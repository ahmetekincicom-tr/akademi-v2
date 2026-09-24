"use client";

import { useId, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { kayitTamamla } from "@/app/kayit/tamamla/actions";
import { CheckToggle } from "@/components/auth/CheckToggle";
import { TelefonAlani } from "@/components/auth/TelefonAlani";
import { UyariKutusu } from "@/components/auth/UyariKutusu";
import { ALAN, ALT_BASLIK, BAGLANTI, BASLIK, BIRINCIL, ETIKET } from "@/components/auth/stil";
import { VARSAYILAN_ULKE, telefonGecerliMi } from "@/lib/telefon";

/**
 * Google ile açılan hesabın tamamlanması. Alanlar ve onay metinleri e-posta
 * kayıt formuyla aynı; doğrulama sunucuda da tekrarlanıyor (kayitTamamla).
 */
export function KayitTamamlaFormu({ email, ad: ilkAd, soyad: ilkSoyad }: { email: string; ad: string; soyad: string }) {
  const [ad, setAd] = useState(ilkAd);
  const [soyad, setSoyad] = useState(ilkSoyad);
  const [ulkeKodu, setUlkeKodu] = useState(VARSAYILAN_ULKE);
  const [telefon, setTelefon] = useState("");
  const [sozlesme, setSozlesme] = useState(false);
  const [iletiIzni, setIletiIzni] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, startTransition] = useTransition();
  const router = useRouter();
  const kimlik = useId();
  const hataId = `${kimlik}-hata`;

  const gonder = () => {
    if (yukleniyor || !sozlesme) return;
    if (!telefonGecerliMi(ulkeKodu, telefon)) {
      setHata("Telefon numaranı kontrol eder misin?");
      return;
    }
    setHata(null);
    startTransition(async () => {
      const r = await kayitTamamla({ ad, soyad, ulkeKodu, telefon, sozlesme, iletiIzni });
      if (r.error) {
        setHata(r.error);
        return;
      }
      // Panel düzeni profili sunucuda yeniden okuyor; onay artık kayıtlı.
      router.replace("/panel");
      router.refresh();
    });
  };

  return (
    <div>
      <div className="text-center">
        <h1 className={BASLIK}>Hesabını tamamla</h1>
        <p className={ALT_BASLIK}>
          <span className="font-semibold break-all text-[#fafafa]">{email}</span> ile giriş yaptın. Panele geçmeden önce
          birkaç bilgiye ihtiyacımız var.
        </p>
      </div>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          gonder();
        }}
        className="mt-7 flex flex-col gap-4"
        aria-busy={yukleniyor}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor={`${kimlik}-ad`} className={ETIKET}>
              Ad
            </label>
            <input
              id={`${kimlik}-ad`}
              type="text"
              autoComplete="given-name"
              value={ad}
              onChange={(e) => setAd(e.target.value)}
              aria-describedby={hata ? hataId : undefined}
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
              value={soyad}
              onChange={(e) => setSoyad(e.target.value)}
              aria-describedby={hata ? hataId : undefined}
              className={ALAN}
            />
          </div>
        </div>

        <TelefonAlani
          ulkeKodu={ulkeKodu}
          numara={telefon}
          onUlkeKodu={setUlkeKodu}
          onNumara={setTelefon}
          hataId={hata ? hataId : undefined}
        />

        {hata && <UyariKutusu id={hataId} mesaj={hata} />}

        {/* Onaylar e-posta kayıt formuyla aynı: zorunlu sözleşme + ayrı,
            işaretsiz başlayan ticari ileti izni (6563 s. Kanun). */}
        <fieldset className="mt-1 flex flex-col gap-3 rounded-[12px] border border-white/[0.07] bg-[#0a0c12] p-3.5">
          <legend className="sr-only">Onaylar</legend>
          <span className="font-mono text-[10.5px] tracking-[0.12em] text-[#8b8b95] uppercase">Zorunlu</span>
          <CheckToggle checked={sozlesme} onToggle={() => setSozlesme((v) => !v)} align="start">
            <Link href="/uyelik-sozlesmesi" target="_blank" className={`underline ${BAGLANTI}`}>
              Üyelik ve Kullanım Sözleşmesi
            </Link>
            {"'ni ve "}
            <Link href="/kisisel-verilerin-islenmesi" target="_blank" className={`underline ${BAGLANTI}`}>
              KVKK Aydınlatma Metni
            </Link>
            {"'ni okudum, kabul ediyorum."}
          </CheckToggle>
          <span className="mt-1 border-t border-white/[0.06] pt-3 font-mono text-[10.5px] tracking-[0.12em] text-[#8b8b95] uppercase">
            İsteğe bağlı
          </span>
          <CheckToggle checked={iletiIzni} onToggle={() => setIletiIzni((v) => !v)} align="start">
            Kampanya, duyuru ve yeni eğitimlerden e-posta ile haberdar olmak istiyorum.{" "}
            <span className="text-[#8b8b95]">Sonradan kapatabilirsin.</span>
          </CheckToggle>
        </fieldset>

        <button type="submit" disabled={!sozlesme || yukleniyor} className={`${BIRINCIL} mt-1`}>
          {yukleniyor ? "Kaydediliyor…" : "Panele devam et"}
        </button>
      </form>
    </div>
  );
}
