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

export default async function SifremiUnuttumPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string }>;
}) {
  const { hata } = await searchParams;

  return (
    <AuthShell topText="Hesabın yok mu?" topLinkLabel="Hesap oluştur" topLinkHref="/kayit">
      {/* Süresi dolmuş ya da kullanılmış bağlantıyla gelenler buraya düşüyor;
          hiçbir açıklama olmadan boş forma bakmak kafa karıştırıyordu. */}
      <SifremiUnuttumFormu
        uyari={hata === "baglanti" ? "Bağlantının süresi dolmuş ya da daha önce kullanılmış. Yenisini gönderelim." : undefined}
      />
    </AuthShell>
  );
}
