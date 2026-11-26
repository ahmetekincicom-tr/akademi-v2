import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { Icon } from "@/components/Icon";
import { ALT_BASLIK, BASLIK, BIRINCIL, IKINCIL } from "@/components/auth/stil";
import { APP_STORE_ADRESI } from "@/lib/davet";

export default async function SifreBelirleTamamPage({
  searchParams,
}: {
  searchParams: Promise<{ davet?: string }>;
}) {
  const { davet } = await searchParams;
  if (davet === "1") return <DavetTamam />;

  return (
    <AuthShell>
      <div className="text-center" role="status">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-[14px] bg-brand text-white shadow-[0_12px_28px_-8px_rgba(28,86,243,0.7)]">
          <Icon name="check" size={24} strokeWidth={2.6} />
        </span>
        <h1 className={`mt-6 ${BASLIK}`}>Hazırsın</h1>
        <p className={`${ALT_BASLIK} mt-3`}>Şifren güncellendi. Panelde kaldığın yerden devam edebilirsin.</p>
        <div className="mt-7 flex flex-col gap-2.5">
          <Link href="/panel" className={BIRINCIL}>
            Panele git
            <Icon name="arrowRight" size={16} />
          </Link>
          <Link href="/giris" className={IKINCIL}>
            Girişe dön
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}

/**
 * Davetle gelen kişi: hesabı artık etkin. Asıl soru "şimdi ne yapacağım";
 * cevap iki yol: uygulamayı indirip giriş yapmak ya da sitede devam etmek.
 */
function DavetTamam() {
  return (
    <AuthShell>
      <div className="text-center" role="status">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-[14px] bg-brand text-white shadow-[0_12px_28px_-8px_rgba(28,86,243,0.7)]">
          <Icon name="check" size={24} strokeWidth={2.6} />
        </span>
        <h1 className={`mt-6 ${BASLIK}`}>Hesabın hazır</h1>
        <p className={`${ALT_BASLIK} mt-3`}>
          Şifren kaydedildi. iPhone uygulamasını indirip e-posta adresin ve yeni şifrenle giriş yapabilirsin. Dilersen
          şimdi siteden de devam edebilirsin.
        </p>
        <div className="mt-7 flex flex-col gap-2.5">
          <a href={APP_STORE_ADRESI} className={BIRINCIL} rel="noopener noreferrer">
            Uygulamayı App Store&apos;dan indir
            <Icon name="download" size={16} />
          </a>
          <Link href="/panel" className={IKINCIL}>
            Sitede devam et
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
