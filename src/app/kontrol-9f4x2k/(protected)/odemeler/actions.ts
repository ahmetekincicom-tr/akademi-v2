"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { iyzicoAyari } from "@/lib/iyzico";
import { denemeyiCoz } from "@/lib/odeme-sonuc";
import { odemeAcildiBildir, odemeTamamlandiBildir } from "@/lib/odeme-eposta";
import { yoneticiMi } from "@/lib/panel-kapsam";
import { satinAlmaOlayi } from "@/lib/meta/satis";

/**
 * Ödeme değiştiğinde tazelenmesi gereken her yer.
 *
 * Panel tarafı eksikti: yalnızca yönetim ekranları tazeleniyordu. Katılımcının
 * yan menüsündeki bekleyen ödeme işareti ve genel bakıştaki bildirim kutusu
 * panelin DÜZENİNDE duruyor, yani ödeme sayfasında değil; sayfa yolu
 * tazelenince o katman yenilenmiyordu ve işaret bir sonraki tam yüklemeye
 * kadar gecikiyordu.
 */
function odemeTazele() {
  revalidatePath("/kontrol-9f4x2k/odemeler");
  revalidatePath("/kontrol-9f4x2k");
  revalidatePath("/panel/odemelerim");
  revalidatePath("/panel", "layout");
}

export type OdemeInput = {
  userId: string;
  courseId: string;
  tutar: string;
  yontem: string;
  durum: "odendi" | "bekliyor" | "iade";
  odemeTarihi: string;
  faturaNo: string;
  /** Öğrenci bu kaydı panelden kartla ödeyebilsin mi? */
  onlineOdeme: boolean;
};

export async function odemeEkle(input: OdemeInput) {
  const tutar = Number(input.tutar.replace(",", "."));
  if (!input.userId) return { error: "Öğrenci seçmelisin." };
  if (!Number.isFinite(tutar) || tutar <= 0) return { error: "Geçerli bir tutar gir." };

  const supabase = await createClient();
  const { data: eklenen, error } = await supabase.from("payments").insert({
    user_id: input.userId,
    course_id: input.courseId || null,
    tutar,
    yontem: input.yontem.trim() || null,
    durum: input.durum,
    odeme_tarihi: input.odemeTarihi ? new Date(input.odemeTarihi).toISOString() : new Date().toISOString(),
    fatura_no: input.faturaNo.trim() || null,
    online_odeme: input.onlineOdeme,
  }).select("id").maybeSingle();

  if (error) return { error: error.message };

  // Öğrenciye haber: bekleyen ödemede "ödemen tanımlandı", peşin
  // işaretlenmişse doğrudan "ödemen alındı" (ve ön değerlendirme daveti).
  // Kaydı görsün diye panele girmesini beklemenin anlamı yok.
  let uyari: string | undefined;
  if (eklenen?.id) {
    const sonuc =
      input.durum === "bekliyor"
        ? await odemeAcildiBildir(supabase, eklenen.id)
        : input.durum === "odendi"
          ? await odemeTamamlandiBildir(supabase, eklenen.id)
          : { gonderildi: true };

    // Kayıt oluştu ama bildirim gitmediyse bunu söylemek gerekiyor: sessiz
    // kalırsa öğrencinin haberi olduğu varsayılıyor ve ödeme günlerce bekliyor.
    if (!sonuc.gonderildi) uyari = `Ödeme kaydedildi ancak bildirim gönderilemedi. ${sonuc.sebep ?? ""}`.trim();

    // Peşin işaretlenerek açılan kayıt da bir satıştır; kartla ödenmiş
    // olmadığı için kaynağı "other".
    if (input.durum === "odendi") await satinAlmaOlayi(supabase, eklenen.id, "other");
  }

  odemeTazele();
  return uyari ? { uyari } : {};
}

/**
 * Bildirimi yeniden gönderir.
 *
 * Ödeme maili şimdiye kadar yalnızca kayıt AÇILDIĞI ANDA gidiyordu. O an
 * gitmediyse — katılımcının profilinde adres yoktu, Resend hata verdi, akış
 * kapalıydı — ya da kişi maili silmişse, sonradan göndermenin hiçbir yolu
 * yoktu. Elde kalan tek seçenek kaydı silip yeniden açmaktı; o da ödeme
 * tarihini bozuyor.
 *
 * Hangi mailin gideceğini KAYDIN DURUMU belirliyor, çağıran değil: bekleyen
 * kayıtta "ödemen tanımlandı", ödenmiş kayıtta "ödemen alındı" (ve ön
 * değerlendirme daveti). Durumu istemciden almak, ödenmiş bir kayda "ödemeni
 * tamamla" maili göndermeyi mümkün kılardı.
 */
export async function odemeBildiriminiGonder(id: string) {
  /*
    Bu eylem dışarıya çıkan bir iş yapıyor: gerçek bir kişiye mail atıyor.
    Düğmenin yalnızca yönetim ekranında çizilmesi yetmez, server action'lar
    herkese açık uç noktalar.
  */
  if (!(await yoneticiMi())) return { error: "Bu işlem için yetkin yok." };

  const supabase = await createClient();
  const { data: kayit } = await supabase.from("payments").select("durum").eq("id", id).maybeSingle();

  if (!kayit) return { error: "Ödeme kaydı bulunamadı." };
  if (kayit.durum === "iade") {
    // İade edilmiş kayıt için anlamlı bir bildirim yok; sessizce bir şey
    // göndermektense söylemek doğru.
    return { error: "İade edilmiş kayıt için gönderilecek bir bildirim yok." };
  }

  const sonuc =
    kayit.durum === "bekliyor"
      ? await odemeAcildiBildir(supabase, id)
      : await odemeTamamlandiBildir(supabase, id);

  if (!sonuc.gonderildi) return { error: `Bildirim gönderilemedi. ${sonuc.sebep ?? ""}`.trim() };

  // Gönderim gunlugune epostaGonder içinde yazıldı; ekranı tazelemeye gerek
  // yok ama ödemeler sayfası günlüğü de gösterebilir hale gelirse dursun.
  odemeTazele();
  return { gonderilen: kayit.durum === "bekliyor" ? ("acildi" as const) : ("tamamlandi" as const) };
}

/**
 * Kartla ödemeyi kayıt bazında açıp kapatır.
 *
 * Havaleyle anlaşılmış bir kayıt için gereklidir: öğrenci aynı borcu bir de
 * karttan ödeyip iki kez tahsilat oluşturmasın.
 */
export async function odemeOnlineDegistir(id: string, acik: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("payments").update({ online_odeme: acik }).eq("id", id);
  if (error) return { error: error.message };
  odemeTazele();
  return {};
}

export async function odemeDurumDegistir(id: string, durum: "odendi" | "bekliyor" | "iade") {
  const supabase = await createClient();

  // Önceki durum okunuyor: "odendi" zaten yazılıysa tekrar mail gitmesin.
  const { data: onceki } = await supabase.from("payments").select("durum").eq("id", id).maybeSingle();

  const { error } = await supabase.from("payments").update({ durum }).eq("id", id);
  if (error) return { error: error.message };

  let uyari: string | undefined;
  if (durum === "odendi" && onceki?.durum !== "odendi") {
    const sonuc = await odemeTamamlandiBildir(supabase, id);
    if (!sonuc.gonderildi) uyari = `Durum güncellendi ancak bildirim gönderilemedi. ${sonuc.sebep ?? ""}`.trim();
    /*
      Havale burada kesinleşiyor: kişi o an hiçbir sayfada değil, yönetici
      işaretliyor. action_source bu yüzden "other" — "website" yazmak Meta'ya
      olmayan bir site trafiği bildirmek olurdu.
    */
    await satinAlmaOlayi(supabase, id, "other");
  }
  odemeTazele();
  return uyari ? { uyari } : {};
}

export async function odemeSil(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) return { error: error.message };
  odemeTazele();
  return {};
}

/**
 * Askıda kalmış bir denemenin sonucunu iyzico'ya sorar.
 *
 * Dönüş isteği kaybolduğunda (ağ, kapatılan sekme, engellenen yönlendirme)
 * para çekilmiş ama kayıt "bekliyor" kalmış olabiliyor. Tek doğru kaynak
 * iyzico; burada ona soruluyor.
 */
export async function denemeSorgula(denemeId: string) {
  const supabase = await createClient();
  // Servis anahtarı RLS'i atlıyor: yöneticiliği burada elle doğrulamazsak
  // eylem, oturumu olan herkes için çalışır.
  const { data: yonetici } = await supabase.rpc("is_admin");
  if (yonetici !== true) return { error: "Yetkin yok." };

  const ayar = iyzicoAyari();
  if (!ayar) return { error: "iyzico anahtarları tanımlı değil." };

  const servis = gorevIstemcisi();
  if (!servis) return { error: "Servis anahtarı tanımlı değil." };

  const { data: deneme } = await servis
    .from("odeme_denemeleri")
    .select("token")
    .eq("id", denemeId)
    .maybeSingle();

  if (!deneme?.token) {
    return { error: "Bu denemenin token'ı yok — iyzico sayfası hiç açılmamış." };
  }

  const sonuc = await denemeyiCoz(servis, ayar, deneme.token);
  odemeTazele();
  revalidatePath("/kontrol-9f4x2k/tani");

  const mesaj: Record<string, string> = {
    basarili: "iyzico ödemeyi onayladı; kayıt “Ödendi” yapıldı.",
    basarisiz: "iyzico ödemenin tamamlanmadığını söyledi.",
    eslesmedi: "iyzico bu token'a karşılık bir ödeme bulamadı.",
    belirsiz: "iyzico'ya ulaşılamadı, kayıt değiştirilmedi.",
  };
  return { sonuc, mesaj: mesaj[sonuc] };
}
