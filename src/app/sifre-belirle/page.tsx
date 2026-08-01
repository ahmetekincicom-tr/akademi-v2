import { AuthShell } from "@/components/auth/AuthShell";
import { SifreBelirleFormu } from "@/components/auth/SifreBelirleFormu";

export default function SifreBelirlePage() {
  return (
    <AuthShell topText="Hesabın yok mu?" topLinkLabel="Hesap oluştur" topLinkHref="/kayit">
      <SifreBelirleFormu />
    </AuthShell>
  );
}
