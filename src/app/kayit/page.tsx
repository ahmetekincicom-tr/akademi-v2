import { AuthShell } from "@/components/auth/AuthShell";
import { KayitFormu } from "@/components/auth/KayitFormu";
import type { Metadata } from "next";
import { sayfaMeta } from "@/lib/seo";
import { nativeIstekMi } from "@/lib/native-sunucu";

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

export default async function KayitPage() {
  /*
    iOS uygulamasında telefon isteğe bağlı: App Store 5.1.1(v) uygulamanın
    temel işlevi için gerekmeyen kişisel veriyi zorunlu tutmayı yasaklıyor
    (inceleme bu gerekçeyle telefonu işaret etti). Sitede zorunlu kalıyor.
  */
  const telefonZorunlu = !(await nativeIstekMi());
  return (
    <AuthShell sekme="kayit">
      <KayitFormu telefonZorunlu={telefonZorunlu} />
    </AuthShell>
  );
}
