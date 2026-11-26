import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { UyariKutusu } from "@/components/auth/UyariKutusu";
import { ALT_BASLIK, BASLIK, BIRINCIL, IKINCIL } from "@/components/auth/stil";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { davetKoduCoz, davetKullanilmamis } from "@/lib/davet";
import { davetiKabulEt } from "./actions";
import { EtkinlestirDugmesi } from "./EtkinlestirDugmesi";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hesabını etkinleştir",
  robots: { index: false, follow: false },
};

/** a***@ornek.com: sayfayı açan kişi hangi hesap olduğunu tanısın, adres de tamamen görünmesin. */
function adresiGizle(eposta: string): string {
  const [ad, alan] = eposta.split("@");
  if (!ad || !alan) return eposta;
  return `${ad.slice(0, 1)}${"*".repeat(Math.max(2, Math.min(ad.length - 1, 6)))}@${alan}`;
}

type Durum = "gecersiz" | "suresi-doldu" | "kullanildi" | "hata";

const MESAJ: Record<Durum, { baslik: string; metin: string }> = {
  gecersiz: {
    baslik: "Bağlantı geçersiz",
    metin: "Bu davet bağlantısı tanınmadı. E-postadaki bağlantının tamamını açtığından emin ol ya da şifreni aşağıdan belirle.",
  },
  "suresi-doldu": {
    baslik: "Bağlantının süresi doldu",
    metin: "Davet bağlantıları 14 gün geçerli. Hesabın duruyor; şifreni aşağıdan e-posta adresinle belirleyebilirsin.",
  },
  kullanildi: {
    baslik: "Hesabın zaten etkin",
    metin: "Bu hesapla daha önce giriş yapılmış, davet bağlantısı artık kullanılamıyor. E-posta adresin ve şifrenle giriş yapabilirsin.",
  },
  hata: {
    baslik: "Bir sorun oluştu",
    metin: "Davet şu an işlenemedi. Birkaç dakika sonra tekrar dene ya da şifreni aşağıdan belirle.",
  },
};

export default async function DavetPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; durum?: string; hata?: string }>;
}) {
  const { t, durum: gelenDurum, hata } = await searchParams;

  let durum: Durum | null = gelenDurum && gelenDurum in MESAJ ? (gelenDurum as Durum) : null;
  let eposta: string | null = null;

  if (!durum) {
    const gizli = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const yonetim = gorevIstemcisi();
    const cozum = gizli ? davetKoduCoz(t, gizli) : null;
    if (!gizli || !yonetim) durum = "hata";
    else if (!cozum?.gecerli) durum = cozum?.sebep === "suresi-doldu" ? "suresi-doldu" : "gecersiz";
    else {
      const { data } = await yonetim.auth.admin.getUserById(cozum.userId);
      const kisi = data?.user;
      if (!kisi?.email) durum = "gecersiz";
      else if (!davetKullanilmamis(cozum.sonGiris, kisi.last_sign_in_at)) durum = "kullanildi";
      else eposta = kisi.email;
    }
  }

  if (durum || !eposta || !t) {
    const m = MESAJ[durum ?? "gecersiz"];
    return (
      <AuthShell>
        <h1 className={BASLIK}>{m.baslik}</h1>
        <p className={`${ALT_BASLIK} mt-3`}>{m.metin}</p>
        <div className="mt-7 flex flex-col gap-2.5">
          {durum === "kullanildi" ? (
            <>
              <Link href="/giris" className={BIRINCIL}>
                Giriş yap
              </Link>
              <Link href="/sifremi-unuttum" className={IKINCIL}>
                Şifremi unuttum
              </Link>
            </>
          ) : (
            <>
              <Link href="/sifremi-unuttum" className={BIRINCIL}>
                Şifremi belirle
              </Link>
              <Link href="/giris" className={IKINCIL}>
                Girişe dön
              </Link>
            </>
          )}
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className={BASLIK}>Hesabını etkinleştir</h1>
      <p className={`${ALT_BASLIK} mt-3`}>
        Ahmet Ekinci Akademi&apos;de <strong className="text-[#fafafa]">{adresiGizle(eposta)}</strong> adına bir hesap
        açıldı. Yeni üyelik oluşturmana gerek yok: devam edip şifreni belirle, sonra bu e-posta ve şifreyle siteden
        ya da iPhone uygulamasından giriş yap.
      </p>
      {hata && (
        <div className="mt-5">
          <UyariKutusu mesaj="Hesap etkinleştirilemedi. Lütfen tekrar dene." />
        </div>
      )}
      <form action={davetiKabulEt} className="mt-7">
        <input type="hidden" name="t" value={t} />
        <EtkinlestirDugmesi />
      </form>
    </AuthShell>
  );
}
