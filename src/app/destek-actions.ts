"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { yoneticiMi } from "@/lib/panel-kapsam";
import { veriHatasi } from "@/lib/auth-hatalari";
import { yoneticiBildirimi } from "@/lib/eposta";
import { ekleriDogrula } from "@/lib/destek-ek";

/** Bildirimlerde kullanılan görünen ad. */
async function kisiAdi(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("ad, soyad, email")
    .eq("id", userId)
    .maybeSingle();
  return [data?.ad, data?.soyad].filter(Boolean).join(" ") || data?.email || "Bir katılımcı";
}

/** Ek varsa bildirim alıntısına not düşülüyor; metinsiz yalnız-ek mesajlar boş görünmesin. */
function alintiMetni(metin: string, ekSayisi: number) {
  const ek = ekSayisi ? `[${ekSayisi} ek dosya]` : "";
  return [metin.trim(), ek].filter(Boolean).join("\n");
}

export async function talepAc(baslik: string, ilkMesaj: string, courseId?: string, ekler?: unknown) {
  if (!baslik.trim() || !ilkMesaj.trim()) return { error: "Konu ve mesaj zorunludur." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const dogrulama = ekleriDogrula(ekler, user.id);
  if ("hata" in dogrulama) return { error: dogrulama.hata };

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({ user_id: user.id, baslik: baslik.trim(), course_id: courseId || null })
    .select("id")
    .single();
  if (error || !ticket) return { error: error?.message ?? "Talep açılamadı." };

  const { error: msgErr } = await supabase
    .from("support_messages")
    .insert({ ticket_id: ticket.id, gonderen_id: user.id, metin: ilkMesaj.trim(), ekler: dogrulama.ekler });
  if (msgErr) return { error: msgErr.message };

  const isim = await kisiAdi(supabase, user.id);
  await yoneticiBildirimi({
    akis: "destek-talebi",
    konu: `Yeni destek talebi · ${isim}`,
    ustEtiket: "Destek talebi",
    baslik: baslik.trim(),
    ozet: `${isim} yeni bir talep açtı.`,
    alinti: alintiMetni(ilkMesaj, dogrulama.ekler.length),
    yol: "/kontrol-9f4x2k/destek",
    eylemEtiketi: "Talebi panelde aç",
  });

  revalidatePath("/panel/soru-cevap");
  revalidatePath("/kontrol-9f4x2k/destek");
  return { id: ticket.id as string };
}

/**
 * Mesaj gönder. `ekler` isteğe bağlı: tarayıcı dosyayı önce kişinin kendi
 * depo klasörüne yüklüyor, burada yalnız yol/ad/tür/boyut doğrulanıp mesaja
 * yazılıyor. Ekli mesajda metin boş olabilir (yalnız ekran görüntüsü).
 */
export async function mesajGonder(ticketId: string, metin: string, icNot = false, ekler?: unknown) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const dogrulama = ekleriDogrula(ekler, user.id);
  if ("hata" in dogrulama) return { error: dogrulama.hata };
  if (!metin.trim() && dogrulama.ekler.length === 0) return { error: "Mesaj boş olamaz." };

  const { data: profil } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const yoneticiYazdi = profil?.role === "admin";

  // İç not yalnızca yöneticiye özel; öğrenci iç not gönderemez.
  if (icNot && !yoneticiYazdi) return { error: "Bu işlem için yetkin yok." };

  const { error } = await supabase
    .from("support_messages")
    .insert({ ticket_id: ticketId, gonderen_id: user.id, metin: metin.trim(), ic_not: icNot, ekler: dogrulama.ekler });
  if (error) return { error: error.message };

  /*
    İç not: talebin durumunu ve öğrenciye giden bildirimi DEĞİŞTİRMEZ — yalnızca
    ekip görür. Sadece güncelleme zamanı ilerlesin (kuyruk sıralaması için).
  */
  if (icNot) {
    await supabase.from("support_tickets").update({ updated_at: new Date().toISOString() }).eq("id", ticketId);
    revalidatePath("/kontrol-9f4x2k/destek");
    return {};
  }

  // An admin reply moves the ticket to "yanitlandi"; a student reply reopens it.
  await supabase
    .from("support_tickets")
    .update({
      durum: yoneticiYazdi ? "yanitlandi" : "acik",
      updated_at: new Date().toISOString(),
    })
    .eq("id", ticketId);

  // Yalnızca ÖĞRENCİ yazdığında bildirim. Yönetici kendi cevabının mailini
  // almamalı; aksi halde her yazışma iki kat gürültü üretir ve bildirimler
  // okunmaz hale gelir.
  if (!yoneticiYazdi) {
    const { data: talep } = await supabase
      .from("support_tickets")
      .select("baslik")
      .eq("id", ticketId)
      .maybeSingle();
    const isim = await kisiAdi(supabase, user.id);

    await yoneticiBildirimi({
      akis: "destek-yanit",
      konu: `Destek yanıtı · ${isim}`,
      ustEtiket: "Destek talebi",
      baslik: talep?.baslik ?? "Destek talebi",
      ozet: `${isim} talebe yeni bir mesaj yazdı.`,
      alinti: alintiMetni(metin, dogrulama.ekler.length),
      yol: "/kontrol-9f4x2k/destek",
      eylemEtiketi: "Yazışmayı aç",
    });
  }

  revalidatePath("/panel/soru-cevap");
  revalidatePath("/kontrol-9f4x2k/destek");
  return {};
}

/**
 * Talebi bir eğitime bağlar (ya da bağını kaldırır). Yalnızca yönetici.
 * Mevcut support_tickets.course_id kolonunu kullanır.
 */
export async function talebeEgitimBagla(ticketId: string, courseId: string | null) {
  if (!(await yoneticiMi())) return { error: "Bu işlem için yetkin yok." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("support_tickets")
    .update({ course_id: courseId || null })
    .eq("id", ticketId);
  if (error) return { error: veriHatasi(error) };
  revalidatePath("/kontrol-9f4x2k/destek");
  return {};
}

/**
 * Öğrenci: "Sorun çözüldü mü?" → Evet. Yalnız KENDİ talebini ve yalnız
 * "kapandi"ya çekebilir; genel durum değiştirme (talepDurumDegistir) hâlâ
 * yalnız yöneticide. Yeniden açmak için yeni mesaj yazmak yeterli değil —
 * kapanan talepte yazma alanı yok; öğrenci yeni soru açıyor.
 */
export async function talebimiKapat(ticketId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const { data, error } = await supabase
    .from("support_tickets")
    .update({ durum: "kapandi", updated_at: new Date().toISOString() })
    .eq("id", ticketId)
    .eq("user_id", user.id)
    .neq("durum", "kapandi")
    .select("id");
  if (error) return { error: veriHatasi(error) };
  if (!data?.length) return { error: "Talep bulunamadı ya da zaten kapalı." };

  revalidatePath("/panel/soru-cevap");
  revalidatePath("/kontrol-9f4x2k/destek");
  return {};
}

/**
 * Öğrenci: kendi talebini, KAYITLI olduğu bir eğitime bağlar (ya da genel
 * yapar). Kayıtlı olmadığı eğitim seçilemiyor — yönetici tarafındaki
 * talebeEgitimBagla ise tüm eğitimlere açık kalıyor.
 */
export async function talebimiEgitimeBagla(ticketId: string, courseId: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  if (courseId) {
    const { data: kayit } = await supabase
      .from("enrollments")
      .select("course_id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .neq("durum", "iptal")
      .maybeSingle();
    if (!kayit) return { error: "Bu eğitime kayıtlı değilsin." };
  }

  const { data, error } = await supabase
    .from("support_tickets")
    .update({ course_id: courseId || null })
    .eq("id", ticketId)
    .eq("user_id", user.id)
    .select("id");
  if (error) return { error: veriHatasi(error) };
  if (!data?.length) return { error: "Talep bulunamadı." };

  revalidatePath("/panel/soru-cevap");
  revalidatePath("/kontrol-9f4x2k/destek");
  return {};
}

/**
 * Talep durumu.
 *
 * Yalnızca yönetici değiştirebiliyor ve bu artık SUNUCUDA da soruluyor.
 * Açılır liste zaten yalnızca yönetim arayüzünde çiziliyordu ama server
 * action'lar herkese açık uç noktalar; RLS de talebin SAHİBİNE güncelleme
 * izni veriyor (başlığını değiştirebilsin diye). İkisi birleşince katılımcı
 * kendi talebini "kapandı" ya da "yanıtlandı" işaretleyebiliyordu — destek
 * kuyruğu, üzerinde çalışılmamış talepleri bitmiş gösterirdi.
 */
export async function talepDurumDegistir(ticketId: string, durum: "acik" | "inceleniyor" | "yanitlandi" | "kapandi") {
  if (!(await yoneticiMi())) return { error: "Bu işlem için yetkin yok." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("support_tickets")
    .update({ durum, updated_at: new Date().toISOString() })
    .eq("id", ticketId);
  if (error) return { error: veriHatasi(error) };

  revalidatePath("/panel/soru-cevap");
  revalidatePath("/kontrol-9f4x2k/destek");
  return {};
}
