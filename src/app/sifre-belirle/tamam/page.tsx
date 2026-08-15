import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";

export default function SifreBelirleTamamPage() {
  return (
    <AuthShell topText="Hesabın yok mu?" topLinkLabel="Hesap oluştur" topLinkHref="/kayit">
      <div>
        <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-brand text-xl text-white shadow-[0_12px_28px_rgba(28,86,243,0.3)]">
          ✓
        </span>
        <h1 className="mt-6 font-heading text-[32px] leading-[1.12] font-semibold tracking-[-0.03em]">Hazırsın</h1>
        <p className="mt-3 text-[15.5px] leading-[1.65] text-[#5C6273]">
          Şifren güncellendi. Panelde kaldığın yerden devam edebilirsin.
        </p>
        <Link
          href="/panel"
          className="mt-[26px] flex h-[52px] items-center justify-center gap-[9px] rounded-[11px] bg-brand text-base font-semibold text-white shadow-[0_12px_28px_rgba(28,86,243,0.28)] hover:bg-ink"
        >
          Panele git →
        </Link>
        <Link
          href="/giris"
          className="mt-3 flex h-[50px] items-center justify-center rounded-[11px] border border-ink/14 bg-white text-[15px] font-semibold text-ink hover:border-brand hover:text-brand"
        >
          Girişe dön
        </Link>
      </div>
    </AuthShell>
  );
}
