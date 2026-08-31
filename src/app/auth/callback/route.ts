import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { guvenliYol } from "@/lib/guvenli-url";
import { hosgeldinGonder } from "@/lib/hosgeldin";
import { oturumKaydiniYaz } from "@/lib/oturum-kayit";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Dogrulanmadan kullanilirsa acik yonlendirmeye donusur.
  const next = guvenliYol(searchParams.get("next"), "/panel");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Doğrulama bağlantısıyla gelen kişi giriş formundan geçmiyor, dolayısıyla
      // oturumKaydet() de çalışmıyor: giriş kaydı ve hoş geldin maili burada
      // tetikleniyor. Gerekçesi auth/onayla/route.ts içinde.
      //
      // ŞİFRE SIFIRLAMADA DEĞİL: o akış da buradan geçiyor ama şifresini
      // sıfırlayan kişiye "hoş geldin" demek yanlış — hesabı zaten var ve
      // maili bekleyen bir şeyle ilgisi yok.
      await oturumKaydiniYaz(supabase);
      if (!next.startsWith("/sifre-belirle")) await hosgeldinGonder();
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/giris?hata=1`);
}
