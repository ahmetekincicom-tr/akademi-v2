"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { trSaatiniUtcYap } from "@/lib/zaman";
import type { GorusmeDurum } from "@/lib/gorusme";
import { metaOlayiKuyrukla } from "@/lib/meta/kuyruk";
import { profildenKimlik } from "@/lib/meta/toplama";
import { gorusmePlanlandiBildir } from "@/lib/egitim-eposta";
import { takvimeYaz, takvimdenSil, uyariBirlestir } from "@/lib/takvim-kayit";

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
  const postaUyarisi =
    posta && !posta.gonderildi ? `Bilgilendirme maili gönderilemedi: ${posta.sebep}` : null;

  // Eğitmenin kendi takvimi. Planlamayı geri almıyor; sorun olursa uyarı
  // olarak dönüyor — gerekçesi lib/takvim-kayit.ts içinde.
  const takvimUyarisi = await takvimeKaydet(input.id, baslangicUtc, Number(input.sureDk) || 45, input.toplantiLink);

  const uyari = uyariBirlestir(postaUyarisi, takvimUyarisi);
  return uyari ? { uyari: `Görüşme planlandı ama: ${uyari}` } : sonuc;
}

/**
 * Görüşmeyi eğitmenin Google Takvimi'ne yazar.
 *
 * Katılımcı e-postası etkinliğin AÇIKLAMASINDA, davetli olarak değil:
 * davetli eklemek Google'a kişiye kendiliğinden davet postası gönderttiriyor
 * ve bu, panelden çıkan ikinci bir postayla üst üste binerdi. Katılımcıya
 * ne gittiğini panel belirliyor, Google değil.
 */
async function takvimeKaydet(
  gorusmeId: string,
  baslangic: string,
  sureDk: number,
  toplantiLink: string,
) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("gorusmeler")
    .select("konu, aciklama, takvim_etkinlik_id, profiles(ad, soyad, email)")
    .eq("id", gorusmeId)
    .maybeSingle();
  if (!data) return null;

  const kisi = data.profiles as { ad: string | null; soyad: string | null; email: string | null } | null;
  const adSoyad = [kisi?.ad, kisi?.soyad].filter(Boolean).join(" ").trim();
  const konu = (data.konu as string) || "Danışmanlık görüşmesi";

  return takvimeYaz(
    supabase,
    "gorusmeler",
    [gorusmeId],
    {
      baslik: adSoyad ? `${konu} · ${adSoyad}` : konu,
      aciklama: [
        adSoyad ? `Katılımcı: ${adSoyad}` : null,
        kisi?.email ? `E-posta: ${kisi.email}` : null,
        (data.aciklama as string | null)?.trim() || null,
        `Panel: ${panelAdresi()}/kontrol-9f4x2k/gorusmeler`,
      ]
        .filter(Boolean)
        .join("\n"),
      baslangicUtc: baslangic,
      sureDk,
      konum: toplantiLink.trim() || null,
    },
    data.takvim_etkinlik_id as string | null,
  );
}

/** Etkinlik açıklamasındaki panel bağlantısının kökü. */
function panelAdresi() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://panel.ahmetekinciakademi.com").replace(/\/$/, "");
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
  const sonuc = await guncelle(id, { durum });
  if (sonuc.error) return sonuc;

  /*
    İptal edilen görüşme takvimden de kalkıyor.

    Yalnızca durumu değiştirmek yetmezdi: etkinlik takvimde durmaya devam
    eder ve o saat dolu görünürdü. "Tamamlandı" etkinliği silmiyor — geçmiş
    bir dersin takvimde kalması doğru, o bir kayıt.
  */
  if (durum === "iptal") {
    const supabase = await createClient();
    const { data } = await supabase
      .from("gorusmeler")
      .select("takvim_etkinlik_id")
      .eq("id", id)
      .maybeSingle();

    const uyari = await takvimdenSil(
      supabase,
      "gorusmeler",
      [id],
      data?.takvim_etkinlik_id as string | null,
    );
    if (uyari) return { uyari: `Görüşme iptal edildi ama ${uyari}` };
  }
  return sonuc;
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
