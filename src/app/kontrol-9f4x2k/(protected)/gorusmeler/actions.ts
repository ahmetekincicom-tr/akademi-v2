"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { trSaatiniUtcYap } from "@/lib/zaman";
import type { GorusmeDurum } from "@/lib/gorusme";
import { metaOlayiKuyrukla } from "@/lib/meta/kuyruk";
import { profildenKimlik } from "@/lib/meta/toplama";
import { gorusmePlanlandiBildir } from "@/lib/egitim-eposta";

const GECERLI_DURUMLAR: GorusmeDurum[] = ["talep", "odeme_bekliyor", "planlandi", "tamamlandi", "iptal"];

function tazele() {
  revalidatePath("/kontrol-9f4x2k/gorusmeler");
  revalidatePath("/panel/gorusmeler");
}

/** RLS engellediğinde hata değil sıfır satır döner; onu da yakala. */
async function guncelle(id: string, alanlar: Record<string, unknown>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gorusmeler")
    .update({ ...alanlar, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "Kaydedilemedi. Yönetici yetkisi doğrulanamadı (RLS)." };
  }
  tazele();
  return {};
}

export async function gorusmePlanla(input: {
  id: string;
  baslangic: string;
  sureDk: string;
  toplantiLink: string;
  adminNotu: string;
}) {
  if (!input.baslangic) return { error: "Tarih ve saat gir." };

  // Formdaki saat Türkiye saati. Sunucu UTC çalıştığı için new Date() ile
  // çevirmek saati olduğu gibi UTC sanıyor ve kayıt 3 saat ileri kalıyordu.
  const baslangicUtc = trSaatiniUtcYap(input.baslangic);
  if (!baslangicUtc) return { error: "Tarih ve saat okunamadı." };

  const sonuc = await guncelle(input.id, {
    baslangic: baslangicUtc,
    sure_dk: Number(input.sureDk) || 45,
    toplanti_link: input.toplantiLink.trim() || null,
    admin_notu: input.adminNotu.trim() || null,
    durum: "planlandi",
  });

  if (sonuc.error) return sonuc;

  // Meta'ya Schedule. Kimlik profilden: planlamayı yönetici yapıyor, istekte
  // katılımcının değil onun kimliği var.
  await planlamaOlayi(input.id);

  /*
    Kişiye tarih ve saati bildiren mail.

    Buraya kadar planlama yalnızca panele yazılıyordu; kişinin bunu görmesi
    için panele girmesi gerekiyordu ve kimse her gün girmiyor. Postanın
    gitmemesi planlamayı geri almıyor ama yöneticinin ekranında da sessiz
    kalmıyor: uyarı olarak dönüyor.
  */
  const posta = await planlamaPostasi(input.id, baslangicUtc, Number(input.sureDk) || 45, input.toplantiLink);
  if (posta && !posta.gonderildi) {
    return { uyari: `Görüşme planlandı ama bilgilendirme maili gönderilemedi: ${posta.sebep}` };
  }
  return sonuc;
}

async function planlamaPostasi(
  gorusmeId: string,
  baslangic: string,
  sureDk: number,
  toplantiLink: string,
) {
  const supabase = await createClient();
  const { data } = await supabase.from("gorusmeler").select("user_id, konu").eq("id", gorusmeId).maybeSingle();
  if (!data?.user_id) return null;

  return gorusmePlanlandiBildir(supabase, data.user_id as string, {
    baslangic,
    sureDk,
    konu: (data.konu as string) ?? null,
    toplantiLink: toplantiLink.trim() || null,
  });
}

async function planlamaOlayi(gorusmeId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("gorusmeler").select("user_id, konu").eq("id", gorusmeId).maybeSingle();
    if (!data?.user_id) return;

    const kimlik = await profildenKimlik(supabase, data.user_id);
    if (!kimlik) return;

    await metaOlayiKuyrukla({
      olay: "Schedule",
      eventId: `schedule-${gorusmeId}`,
      kimlik: kimlik.kimlik,
      ozel: { content_name: data.konu ?? "Danışmanlık" },
      aksiyon: "other",
      userId: data.user_id,
      izin: kimlik.izin,
    });
  } catch (hata) {
    console.error("[meta] planlama olayı yazılamadı", hata);
  }
}

/**
 * Planlanmış bir görüşmenin bildirimini YENİDEN gönderir.
 *
 * Planlama anında gönderiliyor ama gitmeyebiliyor. Yeniden göndermek için
 * tarihi tekrar kaydetmek gerekiyordu; o da kayda gereksiz bir güncelleme
 * yazıyor ve Meta'ya ikinci bir Schedule olayı düşürüyordu.
 */
export async function gorusmeBildiriminiGonder(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("gorusmeler")
    .select("user_id, konu, baslangic, sure_dk, toplanti_link, durum")
    .eq("id", id)
    .maybeSingle();

  if (!data?.user_id) return { error: "Görüşme bulunamadı." };
  // Tarihi olmayan bir görüşme için "planlandı" maili göndermek, olmayan bir
  // saati haber vermek olurdu.
  if (!data.baslangic) return { error: "Görüşmenin tarihi yok; önce planla." };

  const sonuc = await gorusmePlanlandiBildir(supabase, data.user_id as string, {
    baslangic: data.baslangic as string,
    sureDk: (data.sure_dk as number) ?? 45,
    konu: (data.konu as string) ?? null,
    toplantiLink: (data.toplanti_link as string) ?? null,
  });

  if (!sonuc.gonderildi) return { error: `Gönderilemedi: ${sonuc.sebep}` };
  return {};
}

export async function gorusmeOdemeOnayla(id: string, referans: string) {
  // Ödeme onaylanınca talep tekrar planlama kuyruğuna düşer.
  return guncelle(id, {
    odendi: true,
    odeme_yontemi: "havale",
    odeme_referansi: referans.trim() || null,
    odendi_at: new Date().toISOString(),
    durum: "talep",
  });
}

export async function gorusmeDurumDegistir(id: string, durum: GorusmeDurum) {
  if (!GECERLI_DURUMLAR.includes(durum)) return { error: "Geçersiz durum." };
  return guncelle(id, { durum });
}

export async function gorusmeAyarKaydet(input: {
  ucretsizHak: string;
  ucret: string;
  sureDk: string;
  odemeAciklamasi: string;
  aktif: boolean;
}) {
  const hak = Number(input.ucretsizHak);
  const ucret = Number(input.ucret.replace(",", "."));
  const sure = Number(input.sureDk);

  if (!Number.isInteger(hak) || hak < 0) return { error: "Ücretsiz hak sayısı 0 veya daha büyük bir tam sayı olmalı." };
  if (!Number.isFinite(ucret) || ucret < 0) return { error: "Geçerli bir ücret gir." };
  if (!Number.isInteger(sure) || sure <= 0) return { error: "Süre dakika cinsinden pozitif olmalı." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gorusme_ayarlari")
    .update({
      ucretsiz_hak: hak,
      ucret,
      sure_dk: sure,
      odeme_aciklamasi: input.odemeAciklamasi.trim() || null,
      aktif: input.aktif,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "Kaydedilemedi. Yönetici yetkisi doğrulanamadı (RLS)." };
  }

  tazele();
  return {};
}
