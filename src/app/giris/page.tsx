import { AuthShell } from "@/components/auth/AuthShell";
import { GirisFormu } from "@/components/auth/GirisFormu";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { sayfaMeta } from "@/lib/seo";
import { ON_YUZ_ACIK } from "@/proxy";
import { createClient } from "@/lib/supabase/server";

/**
 * The shell stays on the server because it renders <Logo>, which is an async
 * component that reads the uploaded brand mark. Pulled into a client bundle it
 * can never hydrate, and the page freezes — or, behind a null Suspense
 * fallback, goes completely blank.
 */
/**
 * Bu sayfa YALNIZ ön yüz kapalıyken indekslenebilir, diğer oturum sayfaları
 * hiç değil. Ön yüz açıkken site kendi sayfalarıyla aranıyor; giriş ekranı
 * dizinden ve site haritasından çıkıyor.
 *
 * Ön yüz kapalıyken bu alan adının arama motoruna açık tek yüzü burası:
 * ana alan adının başlık ve alt bilgisinden "üye girişi" bağlantısı buraya
 * veriliyor ve tıklayan kişi arama sonucunda da bunu bulabilmeli. Kayıt ve
 * şifre sıfırlama ekranları noindex kalıyor — ikisi de bu sayfanın ince
 * birer kopyası gibi görünür ve aynı sorguda birbiriyle yarışır.
 */
// Oturum durumuna göre yönlendiriliyor; önbelleğe alınmamalı.
export const dynamic = "force-dynamic";

// Paylaşım görseli panelden okunduğu için metadata istek anında üretiliyor.
export function generateMetadata(): Promise<Metadata> {
  return sayfaMeta({
  baslik: "Üye Girişi",
  aciklama:
    "Ahmet Ekinci Akademi katılımcı paneli. Derslerine, ders kayıtlarına, dokümanlarına ve ödeme bilgilerine buradan ulaşırsın.",
  yol: "/giris",
  // Ön yüz açıkken arama sonucunda öğrenci giriş ekranının işi yok; kapalıyken
  // alan adının tek yüzü olduğu için açık kalıyor (yukarıdaki not).
  indeksleme: !ON_YUZ_ACIK,
});
}

export default async function GirisPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; hata?: string }>;
}) {
  // Set by the proxy when it bounces a signed-out visitor off a /panel page.
  // hata=1: /auth/onayla ya da /auth/callback bağlantıyı doğrulayamadı.
  const { next, hata } = await searchParams;
  const hedef = next?.startsWith("/panel") ? next : "/panel";

  /*
    Oturumu açık olan buraya düşmesin.

    Ön yüz kapalıyken bu sayfa sitenin girişi: adres çubuğuna alan adını yazan
    öğrenci de, ana alan adındaki "üye girişi" bağlantısına tıklayan öğrenci de
    buraya geliyor. Oturumu zaten açıkken karşısına giriş formu çıkması
    "çıkış mı yaptım?" sorusunu doğuruyor.
  */
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(hedef);

  return (
    <AuthShell sekme="giris">
      <GirisFormu hedef={hedef} baglantiHatasi={hata === "1"} />
    </AuthShell>
  );
}
