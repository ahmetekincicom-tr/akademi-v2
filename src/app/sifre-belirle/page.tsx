import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { SifreBelirleFormu } from "@/components/auth/SifreBelirleFormu";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Bu sayfaya yalnızca sıfırlama bağlantısından gelinir.
 *
 * Bağlantı doğrulandığında Supabase bir oturum açıyor; şifreyi değiştiren şey
 * o oturum. Oturum yokken sayfa açılabildiğinde kullanıcı formu dolduruyor,
 * "Şifreyi güncelle" diyor ve karşısına İngilizce bir API hatası çıkıyordu.
 * Nedenini de anlamıyor — bağlantının süresi dolmuş olabilir, hiç tıklamamış
 * olabilir. Onun yerine baştan başlatıyoruz.
 */
export default async function SifreBelirlePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sifremi-unuttum?hata=baglanti");

  return (
    <AuthShell topText="Hesabın yok mu?" topLinkLabel="Hesap oluştur" topLinkHref="/kayit">
      <SifreBelirleFormu />
    </AuthShell>
  );
}
