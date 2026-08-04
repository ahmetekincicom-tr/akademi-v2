import { AuthShell } from "@/components/auth/AuthShell";
import { SifremiUnuttumFormu } from "@/components/auth/SifremiUnuttumFormu";
import type { Metadata } from "next";
import { sayfaMeta } from "@/lib/seo";

export const metadata: Metadata = sayfaMeta({
  baslik: "Şifremi unuttum",
  aciklama: "Şifre sıfırlama bağlantısı al.",
  yol: "/sifremi-unuttum",
  // Oturum sayfalarının arama sonucunda işi yok.
  indeksleme: false,
});

export default function SifremiUnuttumPage() {
  return (
    <AuthShell topText="Hesabın yok mu?" topLinkLabel="Hesap oluştur" topLinkHref="/kayit">
      <SifremiUnuttumFormu />
    </AuthShell>
  );
}
