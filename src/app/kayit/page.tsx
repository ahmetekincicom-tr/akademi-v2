import { AuthShell } from "@/components/auth/AuthShell";
import { KayitFormu } from "@/components/auth/KayitFormu";
import type { Metadata } from "next";
import { sayfaMeta } from "@/lib/seo";

// AuthShell sunucuda kalmalı: içindeki Logo async bir sunucu bileşeni ve
// istemci paketine girdiğinde sayfa hidrate olamıyor.
// Paylaşım görseli panelden okunduğu için metadata istek anında üretiliyor.
export function generateMetadata(): Promise<Metadata> {
  return sayfaMeta({
  baslik: "Hesap oluştur",
  aciklama: "Katılımcı hesabı oluştur.",
  yol: "/kayit",
  // Oturum sayfalarının arama sonucunda işi yok.
  indeksleme: false,
});
}

export default function KayitPage() {
  return (
    <AuthShell topText="Zaten hesabın var mı?" topLinkLabel="Giriş yap" topLinkHref="/giris">
      <KayitFormu />
    </AuthShell>
  );
}
