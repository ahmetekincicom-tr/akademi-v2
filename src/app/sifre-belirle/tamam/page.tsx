import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { Icon } from "@/components/Icon";
import { ALT_BASLIK, BASLIK, BIRINCIL, IKINCIL } from "@/components/auth/stil";

export default function SifreBelirleTamamPage() {
  return (
    <AuthShell topText="Hesabın yok mu?" topLinkLabel="Hesap oluştur" topLinkHref="/kayit">
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
