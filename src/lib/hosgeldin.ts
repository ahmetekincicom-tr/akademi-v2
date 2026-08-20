import "server-only";

import { createClient } from "@/lib/supabase/server";
import { epostaGonder, epostaYapilandirildiMi, yoneticiBildirimi } from "@/lib/eposta";
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

    await epostaGonder({ akis: "hosgeldin", konu: "Ahmet Ekinci Akademi üye alanına hoş geldin", metin, html, alici: user.email });

    /*
      Yeni üyelik bildirimi de burada.

      Kayıt anında değil ilk girişte: e-posta doğrulaması açıkken kayıt olup
      hiç giriş yapmayan adresler var ve onlar gerçek bir üye değil. Damga
      zaten kişi başına bir kez atıldığı için bu bildirim de tam bir kez
      gidiyor — ayrı bir "gönderildi mi" kaydı tutmaya gerek kalmıyor.
    */
    const { data: kisi } = await supabase
      .from("profiles")
      .select("ad, soyad, email, telefon, ileti_izni")
      .eq("id", user.id)
      .maybeSingle();
    const tamAd = [kisi?.ad, kisi?.soyad].filter(Boolean).join(" ") || kisi?.email || "Yeni üye";

    await yoneticiBildirimi({
      akis: "yeni-uyelik",
      konu: `Yeni üyelik · ${tamAd}`,
      ustEtiket: "Yeni üyelik",
      baslik: `${tamAd} panele katıldı`,
      ozet: "Hesap oluşturuldu ve ilk giriş yapıldı. Eğitim kaydı ve ödeme tanımlanmayı bekliyor.",
      satirlar: [
        { etiket: "E-posta", deger: kisi?.email ?? user.email ?? "—" },
        { etiket: "Telefon", deger: kisi?.telefon ?? "—" },
        { etiket: "İleti izni", deger: kisi?.ileti_izni ? "Var" : "Yok" },
      ],
      yol: "/kontrol-9f4x2k/ogrenciler",
      eylemEtiketi: "Öğrencileri aç",
    });
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
