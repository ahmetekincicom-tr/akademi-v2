"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { yoneticiBildirimi } from "@/lib/eposta";

export type MesajInput = {
  tur: "iletisim" | "teklif";
  ad: string;
  email: string;
  telefon?: string;
  sirket?: string;
  konu?: string;
  mesaj: string;
  courseSlug?: string;
  // Hidden field a human never fills; a filled one means a bot.
  tuzak?: string;
};

const EPOSTA = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Üst sınırlar. Form herkese açık ve her kayıt bir de e-posta tetikliyor;
 * sınırsız bırakıldığında tek bir betik hem tabloyu hem posta kotasını
 * doldurabiliyor. Rakamlar gerçek bir mesajın çok üstünde, kimse duvara
 * çarpmıyor.
 */
const SINIR = { ad: 120, email: 254, telefon: 40, sirket: 160, konu: 200, mesaj: 5000 };

/** Aynı e-postadan bu pencerede en fazla bu kadar mesaj. */
const PENCERE_DAKIKA = 10;
const PENCERE_ADET = 3;

const kirp = (deger: string | undefined, sinir: number) => (deger ?? "").trim().slice(0, sinir);

/**
 * Basit boğma.
 *
 * iletisim_mesajlari'nı anon okuyamıyor (yalnızca insert), o yüzden sayım
 * servis anahtarıyla yapılıyor. Anahtar tanımlı değilse kontrol atlanıyor:
 * boğma, mesajın kaybolmasından daha önemli değil.
 */
async function cokHizliMi(email: string): Promise<boolean> {
  const servis = gorevIstemcisi();
  if (!servis) return false;

  const esik = new Date(Date.now() - PENCERE_DAKIKA * 60_000).toISOString();
  const { count } = await servis
    .from("iletisim_mesajlari")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", esik);

  return (count ?? 0) >= PENCERE_ADET;
}

export async function mesajGonder(input: MesajInput): Promise<{ error?: string }> {
  if (input.tuzak) return {};

  const ad = kirp(input.ad, SINIR.ad);
  const email = kirp(input.email, SINIR.email);
  const mesaj = kirp(input.mesaj, SINIR.mesaj);

  if (ad.length < 2) return { error: "Adını yazar mısın?" };
  if (!EPOSTA.test(email)) return { error: "Geçerli bir e-posta adresi gir." };
  if (mesaj.length < 10) return { error: "Mesajını biraz daha açar mısın? (en az 10 karakter)" };

  if (await cokHizliMi(email)) {
    return { error: "Kısa süre içinde birden fazla mesaj aldık. Biraz sonra tekrar dener misin?" };
  }

  const supabase = await createClient();

  let courseId: string | null = null;
  if (input.courseSlug) {
    const { data } = await supabase.from("courses").select("id").eq("slug", input.courseSlug).maybeSingle();
    courseId = data?.id ?? null;
  }

  const { error } = await supabase.from("iletisim_mesajlari").insert({
    tur: input.tur,
    ad,
    email,
    telefon: kirp(input.telefon, SINIR.telefon) || null,
    sirket: kirp(input.sirket, SINIR.sirket) || null,
    konu: kirp(input.konu, SINIR.konu) || null,
    mesaj,
    course_id: courseId,
  });

  if (error) return { error: "Mesaj gönderilemedi. Lütfen tekrar dener misin?" };

  // Bildirim mesaj KAYDEDİLDİKTEN sonra: postanın gitmemesi mesajı kaybetmesin.
  await yoneticiBildirimi({
    konu:
      input.tur === "teklif"
        ? `Teklif talebi · ${ad}`
        : `Yeni iletişim mesajı · ${ad}`,
    ustEtiket: input.tur === "teklif" ? "Teklif talebi" : "İletişim formu",
    baslik: `${ad} yazdı`,
    ozet: input.konu?.trim() || undefined,
    satirlar: [
      { etiket: "E-posta", deger: email },
      ...(input.telefon?.trim() ? [{ etiket: "Telefon", deger: input.telefon.trim() }] : []),
      ...(input.sirket?.trim() ? [{ etiket: "Şirket", deger: input.sirket.trim() }] : []),
      ...(input.courseSlug ? [{ etiket: "Eğitim", deger: input.courseSlug }] : []),
    ],
    alinti: mesaj,
    yol: "/kontrol-9f4x2k/mesajlar",
    eylemEtiketi: "Mesajı panelde aç",
  });

  revalidatePath("/kontrol-9f4x2k/mesajlar");
  revalidatePath("/kontrol-9f4x2k");
  return {};
}

export async function mesajOkunduIsaretle(id: string, okundu: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("iletisim_mesajlari").update({ okundu }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/kontrol-9f4x2k/mesajlar");
  revalidatePath("/kontrol-9f4x2k");
  return {};
}

export async function mesajSil(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("iletisim_mesajlari").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/kontrol-9f4x2k/mesajlar");
  revalidatePath("/kontrol-9f4x2k");
  return {};
}
