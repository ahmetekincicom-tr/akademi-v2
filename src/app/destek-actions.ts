"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { yoneticiBildirimi } from "@/lib/eposta";

/** Bildirimlerde kullanılan görünen ad. */
async function kisiAdi(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("ad, soyad, email")
    .eq("id", userId)
    .maybeSingle();
  return [data?.ad, data?.soyad].filter(Boolean).join(" ") || data?.email || "Bir katılımcı";
}

export async function talepAc(baslik: string, ilkMesaj: string, courseId?: string) {
  if (!baslik.trim() || !ilkMesaj.trim()) return { error: "Konu ve mesaj zorunludur." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({ user_id: user.id, baslik: baslik.trim(), course_id: courseId || null })
    .select("id")
    .single();
  if (error || !ticket) return { error: error?.message ?? "Talep açılamadı." };

  const { error: msgErr } = await supabase
    .from("support_messages")
    .insert({ ticket_id: ticket.id, gonderen_id: user.id, metin: ilkMesaj.trim() });
  if (msgErr) return { error: msgErr.message };

  const isim = await kisiAdi(supabase, user.id);
  await yoneticiBildirimi({
    akis: "destek-talebi",
    konu: `Yeni destek talebi · ${isim}`,
    ustEtiket: "Destek talebi",
    baslik: baslik.trim(),
    ozet: `${isim} yeni bir talep açtı.`,
    alinti: ilkMesaj.trim(),
    yol: "/kontrol-9f4x2k/destek",
    eylemEtiketi: "Talebi panelde aç",
  });

  revalidatePath("/panel/soru-cevap");
  revalidatePath("/kontrol-9f4x2k/destek");
  return {};
}

export async function mesajGonder(ticketId: string, metin: string) {
  if (!metin.trim()) return { error: "Mesaj boş olamaz." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const { error } = await supabase
    .from("support_messages")
    .insert({ ticket_id: ticketId, gonderen_id: user.id, metin: metin.trim() });
  if (error) return { error: error.message };

  const { data: profil } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const yoneticiYazdi = profil?.role === "admin";

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
      alinti: metin.trim(),
      yol: "/kontrol-9f4x2k/destek",
      eylemEtiketi: "Yazışmayı aç",
    });
  }

  revalidatePath("/panel/soru-cevap");
  revalidatePath("/kontrol-9f4x2k/destek");
  return {};
}

export async function talepDurumDegistir(ticketId: string, durum: "acik" | "inceleniyor" | "yanitlandi" | "kapandi") {
  const supabase = await createClient();
  const { error } = await supabase
    .from("support_tickets")
    .update({ durum, updated_at: new Date().toISOString() })
    .eq("id", ticketId);
  if (error) return { error: error.message };

  revalidatePath("/panel/soru-cevap");
  revalidatePath("/kontrol-9f4x2k/destek");
  return {};
}
