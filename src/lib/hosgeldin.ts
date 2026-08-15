import "server-only";

import { createClient } from "@/lib/supabase/server";
import { epostaGonder, epostaYapilandirildiMi } from "@/lib/eposta";
import { bildirimSablonu } from "@/lib/eposta-sablon";

/**
 * Hoş geldin e-postası — kişiye bir kez, ilk girişinde.
 *
 * Kayıt anında değil ilk girişte: e-posta doğrulaması açıkken kayıt olan kişi
 * hesabını henüz kullanamıyor, o anda "hoş geldin" demek erken. İçe aktarılan
 * öğrenciler de kayıt akışından hiç geçmiyor. İlk giriş ikisini birden
 * yakalayan tek an.
 */
export async function hosgeldinGonder(): Promise<void> {
  if (!epostaYapilandirildiMi()) return;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return;

    /*
      Damga ÖNCE atılıyor, mail sonra.

      Koşul update'in kendi içinde: "önce oku, boşsa gönder, sonra damgala"
      olsaydı aynı anda açılan iki sekme ikisi de boş görüp iki mail yollardı.
      Burada damgayı yalnızca bir istek yazabiliyor, dönen satır da o.

      Sıranın bedeli: mail gönderilemezse bir daha denenmiyor. Tersi çok daha
      kötü — her girişte tekrar eden bir "hoş geldin" maili.
    */
    const { data: damgalanan } = await supabase
      .from("profiles")
      .update({ hosgeldin_tarihi: new Date().toISOString() })
      .eq("id", user.id)
      .is("hosgeldin_tarihi", null)
      .select("ad");

    if (!damgalanan || damgalanan.length === 0) return;

    const ad = damgalanan[0]?.ad?.trim();
    const { html, metin } = bildirimSablonu({
      ustEtiket: "Hoş geldin",
      baslik: ad ? `Hoş geldin ${ad}` : "Hoş geldin",
      ozet:
        "Üye alanın hazır. Eğitim içeriklerin, ders kayıtların ve dokümanların burada toplanıyor; " +
        "sorularını da buradan sorabilirsin.",
      satirlar: [
        { etiket: "Derslerim", deger: "Eğitim içeriklerin ve ders kayıtların" },
        { etiket: "Dokümanlar", deger: "Şablonlar ve kontrol listeleri" },
        { etiket: "Soru-cevap", deger: "Takıldığın yerde doğrudan bize yaz" },
        { etiket: "Gündem panosu", deger: "Meta ve sosyal medya tarafındaki gelişmeler" },
      ],
      eylem: { etiket: "Panele git", adres: await panelAdresi() },
    });

    await epostaGonder({ konu: "Ahmet Ekinci Akademi üye alanına hoş geldin", metin, html, alici: user.email });
  } catch {
    // Hoş geldin maili girişi engellememeli. Sessiz geçiliyor.
  }
}

async function panelAdresi(): Promise<string> {
  const { headers } = await import("next/headers");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const sema = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return host ? `${sema}://${host}/panel` : `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/panel`;
}
