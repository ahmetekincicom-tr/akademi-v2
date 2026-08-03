"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { pushGonder } from "@/lib/apns";

async function yoneticiMi() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return data?.role === "admin" ? { supabase, user } : null;
}

/**
 * Bildirimi bir öğrenciye ya da kayıtlı tüm cihazlara gönderir.
 *
 * Yetki burada ayrıca kontrol ediliyor: sunucu eylemleri kendi başlarına
 * çağrılabilir uç noktalar, layout'taki yönetici kontrolü onları kapsamıyor.
 */
export async function bildirimGonder(formData: FormData) {
  const oturum = await yoneticiMi();
  if (!oturum) return { error: "Yetkisiz işlem." };
  const { supabase, user } = oturum;

  const baslik = String(formData.get("baslik") ?? "").trim();
  const govde = String(formData.get("govde") ?? "").trim();
  const hedef = String(formData.get("hedef") ?? "").trim();

  if (!baslik || !govde) return { error: "Başlık ve mesaj zorunlu." };
  // iOS uzun metni zaten kırpıyor; sınırı burada koymak sürprizi önlüyor.
  if (baslik.length > 80) return { error: "Başlık en fazla 80 karakter olabilir." };
  if (govde.length > 300) return { error: "Mesaj en fazla 300 karakter olabilir." };

  let sorgu = supabase.from("push_cihazlar").select("token, user_id").is("gecersiz_tarihi", null);
  if (hedef) sorgu = sorgu.eq("user_id", hedef);

  const { data: cihazlar, error: okumaHatasi } = await sorgu;
  if (okumaHatasi) return { error: okumaHatasi.message };

  const tokenlar = (cihazlar ?? []).map((c) => c.token as string);
  if (tokenlar.length === 0) {
    return { error: "Kayıtlı cihaz yok. Öğrencinin uygulamadan bildirim iznini vermesi gerekiyor." };
  }

  const sonuc = await pushGonder(tokenlar, baslik, govde);

  // Ölmüş token'lar silinmiyor, işaretleniyor: sonraki gönderim onları atlıyor
  // ama kaç cihazın düştüğü görünür kalıyor.
  if (sonuc.gecersizTokenlar.length > 0) {
    await supabase
      .from("push_cihazlar")
      .update({ gecersiz_tarihi: new Date().toISOString() })
      .in("token", sonuc.gecersizTokenlar);
  }

  await supabase.from("push_gonderimler").insert({
    baslik,
    govde,
    hedef_user_id: hedef || null,
    cihaz_sayisi: tokenlar.length,
    basarili: sonuc.gonderilen,
    hata_metni: sonuc.hata ?? null,
    gonderen_id: user.id,
  });

  revalidatePath("/admin/bildirimler");

  if (sonuc.gonderilen === 0) {
    return { error: sonuc.hata ?? "Hiçbir cihaza ulaşılamadı." };
  }

  return {
    mesaj: `${sonuc.gonderilen}/${tokenlar.length} cihaza gönderildi.${
      sonuc.gecersizTokenlar.length ? ` ${sonuc.gecersizTokenlar.length} cihaz geçersiz olarak işaretlendi.` : ""
    }`,
  };
}
