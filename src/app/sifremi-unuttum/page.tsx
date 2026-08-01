import { AuthShell } from "@/components/auth/AuthShell";
import { SifremiUnuttumFormu } from "@/components/auth/SifremiUnuttumFormu";

export default function SifremiUnuttumPage() {
  return (
    <AuthShell topText="Hesabın yok mu?" topLinkLabel="Hesap oluştur" topLinkHref="/kayit">
      <SifremiUnuttumFormu />
    </AuthShell>
  );
}
