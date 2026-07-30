import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";

export default function EPostaKontrolPage() {
  return (
    <AuthShell topText="Hesabın yok mu?" topLinkLabel="Hesap oluştur" topLinkHref="/kayit">
      <div>
        <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-brand/12 text-lg text-brand">
          ✉
        </span>
        <h1 className="mt-6 font-heading text-[32px] leading-[1.12] font-semibold tracking-[-0.03em]">
          E-postanı kontrol et
        </h1>
        <p className="mt-3 text-[15.5px] leading-[1.65] text-[#5C6273]">
          selin@limonian.com adresine sıfırlama bağlantısı gönderdik. Bağlantıya tıkladıktan sonra yeni şifreni
          belirleyebilirsin.
        </p>
        <div className="mt-[26px] rounded-[13px] border border-ink/11 bg-white px-5 py-[18px]">
          <div className="font-mono text-[10px] tracking-[0.13em] text-[#8A8F9E] uppercase">Gelmedi mi?</div>
          <p className="mt-[9px] text-sm leading-[1.6] text-[#3A3F4F]">
            Spam klasörünü kontrol et. 60 saniye sonra tekrar gönderebilirsin.
          </p>
        </div>
        <Link
          href="/sifre-belirle"
          className="mt-6 flex h-[52px] w-full items-center justify-center rounded-[11px] bg-brand text-base font-semibold text-white shadow-[0_12px_28px_rgba(28,86,243,0.28)] hover:bg-ink"
        >
          Bağlantıyı aç (önizleme)
        </Link>
        <Link
          href="/giris"
          className="mt-3 flex h-[50px] w-full items-center justify-center rounded-[11px] border border-ink/14 bg-white text-[15px] font-semibold text-ink hover:border-brand hover:text-brand"
        >
          Girişe dön
        </Link>
      </div>
    </AuthShell>
  );
}
