import { AuthShell } from "@/components/auth/AuthShell";
import { KayitFormu } from "@/components/auth/KayitFormu";

// AuthShell sunucuda kalmalı: içindeki Logo async bir sunucu bileşeni ve
// istemci paketine girdiğinde sayfa hidrate olamıyor.
export default function KayitPage() {
  return (
    <AuthShell topText="Zaten hesabın var mı?" topLinkLabel="Giriş yap" topLinkHref="/giris">
      <KayitFormu />
    </AuthShell>
  );
}
