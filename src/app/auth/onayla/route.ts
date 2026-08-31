import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { guvenliYol } from "@/lib/guvenli-url";
import { hosgeldinGonder } from "@/lib/hosgeldin";
import { oturumKaydiniYaz } from "@/lib/oturum-kayit";

/**
 * E-posta bağlantılarının indiği yer — supabase.co üzerinden geçmeden.
 *
 * Varsayılan kurulumda `{{ .ConfirmationURL }}` şuna açılıyor:
 *
 *   https://<proje>.supabase.co/auth/v1/verify?token=...&redirect_to=...
 *
 * Yani kullanıcı önce supabase.co'ya uğrayıp oradan siteye dönüyor. Adres
 * çubuğunda bir an başka bir alan adı görünmesi güven kırıyor; şifre
 * sıfırlarken hiç istenmeyen şey bu.
 *
 * Bu adres o sıçramayı kaldırıyor: şablon doğrudan buraya bağlanıyor,
 * doğrulamayı token_hash ile kendimiz yapıyoruz. Kullanıcı yalnızca kendi
 * alan adımızı görüyor.
 */

// Supabase'in gönderdiği türler. Listeden geçmeyen bir değer verifyOtp'a
// aktarılmıyor: tür istemciden geliyor ve doğrudan geçirmek gereksiz.
const TURLER: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const ham = searchParams.get("type");
  const tur = TURLER.find((t) => t === ham);
  const next = guvenliYol(searchParams.get("next"), "/panel");

  if (tokenHash && tur) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type: tur, token_hash: tokenHash });
    if (!error) {
      /*
        Bu da bir GİRİŞ ve kaydedilmesi gerekiyor.

        Doğrulama bağlantısıyla gelen kişi giriş formundan geçmiyor, dolayısıyla
        oturumKaydet() çalışmıyordu; sonuç olarak yeni üyelerin ilk oturumu —
        çoğu zaman tek oturumu — giriş hareketlerinde hiç görünmüyordu. Panelde
        "giriş yapmış ama kayıt yok" diye görünen şey buydu.

        verifyOtp'u çağıran istemcinin KENDİSİ geçiliyor: yeni oturum çerezleri
        henüz yanıta yazılmadı, yeni bir istemci istekteki eski çerezleri okur
        ve oturum yokmuş gibi davranırdı.
      */
      await oturumKaydiniYaz(supabase);

      // Şifre sıfırlamada hoş geldin maili gitmiyor: hesabı zaten olan birine
      // "hoş geldin" demek, sıfırlama mailinin hemen ardından alakasız bir
      // ikinci mail olarak düşüyor.
      if (tur !== "recovery") await hosgeldinGonder();
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Süresi dolmuş ya da kullanılmış bağlantı en sık gelen durum; kullanıcı
  // ne yapacağını bilsin diye sıfırlama ekranına yönlendiriliyor.
  const hedef = tur === "recovery" ? "/sifremi-unuttum?hata=baglanti" : "/giris?hata=1";
  return NextResponse.redirect(`${origin}${hedef}`);
}
