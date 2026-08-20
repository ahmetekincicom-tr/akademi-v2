"use server";

import { createClient } from "@/lib/supabase/server";
import { epostaGonder } from "@/lib/eposta";
import { bildirimSablonu } from "@/lib/eposta-sablon";

export async function testEpostasiGonder(): Promise<{ iyi: boolean; mesaj: string }> {
  const supabase = await createClient();
  // Eylem dışarıdan da çağrılabilir; posta gönderimini oturumu olan herkese
  // açmak istemiyoruz.
  const { data: yonetici } = await supabase.rpc("is_admin");
  if (yonetici !== true) return { iyi: false, mesaj: "Yetkin yok." };

  // Gerçek bildirimlerle aynı şablon: test yalnızca "gitti mi" değil,
  // "nasıl görünüyor" sorusunu da cevaplamalı.
  const { html, metin } = bildirimSablonu({
    ustEtiket: "Test",
    baslik: "Bildirimler çalışıyor",
    ozet: "Bu maili aldıysan ödeme, mesaj ve talep bildirimleri de sana ulaşacak.",
    satirlar: [
      { etiket: "Gönderim zamanı", deger: new Date().toLocaleString("tr-TR") },
      { etiket: "Gönderen", deger: process.env.BILDIRIM_GONDEREN ?? "—" },
      { etiket: "Alıcı", deger: process.env.BILDIRIM_EPOSTA ?? "—" },
    ],
    alinti: "Alıntı bloğu böyle görünüyor: gelen mesajlar ve talep açıklamaları burada gösteriliyor.",
  });

  const { gonderildi, hata } = await epostaGonder({
    akis: "tani-testi",
    konu: "Akademi paneli · test e-postası",
    metin,
    html,
  });

  // Resend'in hata metni doğrudan gösteriliyor: "domain not verified" gibi
  // cevaplar sorunu tek satırda anlatıyor, özetlemek bilgi kaybı olurdu.
  return gonderildi
    ? { iyi: true, mesaj: "Gönderildi — gelen kutunu (ve spam'i) kontrol et." }
    : { iyi: false, mesaj: hata ?? "Gönderilemedi." };
}
