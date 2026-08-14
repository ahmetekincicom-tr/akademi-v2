"use server";

import { createClient } from "@/lib/supabase/server";
import { epostaGonder } from "@/lib/eposta";

export async function testEpostasiGonder(): Promise<{ iyi: boolean; mesaj: string }> {
  const supabase = await createClient();
  // Eylem dışarıdan da çağrılabilir; posta gönderimini oturumu olan herkese
  // açmak istemiyoruz.
  const { data: yonetici } = await supabase.rpc("is_admin");
  if (yonetici !== true) return { iyi: false, mesaj: "Yetkin yok." };

  const { gonderildi, hata } = await epostaGonder({
    konu: "Akademi paneli · test e-postası",
    metin: [
      "Bu bir test. Bu maili aldıysan ödeme bildirimleri de sana ulaşacak.",
      "",
      `Gönderim zamanı: ${new Date().toLocaleString("tr-TR")}`,
    ].join("\n"),
  });

  // Resend'in hata metni doğrudan gösteriliyor: "domain not verified" gibi
  // cevaplar sorunu tek satırda anlatıyor, özetlemek bilgi kaybı olurdu.
  return gonderildi
    ? { iyi: true, mesaj: "Gönderildi — gelen kutunu (ve spam'i) kontrol et." }
    : { iyi: false, mesaj: hata ?? "Gönderilemedi." };
}
