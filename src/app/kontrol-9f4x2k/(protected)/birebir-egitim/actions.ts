"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/tipler";
import { createClient } from "@/lib/supabase/server";
import { trSaatiniUtcYap } from "@/lib/zaman";
import { guvenliUrl } from "@/lib/guvenli-url";
import { veriHatasi } from "@/lib/auth-hatalari";
import { kayitArsiviBildir, oturumPlanlandiBildir } from "@/lib/egitim-eposta";
import { takvimeYaz, takvimdenSil, uyariBirlestir } from "@/lib/takvim-kayit";

export async function oturumEkle(input: {
  userId: string;
  courseId: string;
  baslangic: string;
  sureDk: string;
  konu: string;
  toplantiLink: string;
  /** Eğitim sonrası Drive klasörü ya da video. Baştan verilebiliyor: kayıt
   *  elde hazırken önce oturumu kaydedip sonra geri dönmek gereksiz adım. */
  kayitLink?: string;
  /**
   * Kurumsal ortak oturum: aynı saat, aynı bağlantı, birkaç katılımcı.
   *
   * Her katılımcı için AYRI satır yazılıyor ve görünürlük kuralı hiç
   * değişmiyor — herkes yalnızca kendi user_id'sini görüyor. Alternatif tek
   * satır yazıp "bu ödemenin katılımcısıysan görürsün" demekti; bu projede
   * tam olarak o tür bir kural yüzünden yönetici bütün katılımcıların
   * kayıtlarını görebiliyordu. Kapsamı gevşetmek yerine satır çoğaltmak,
   * dört kişilik grupta bedava sayılır.
   */
  ekstraKatilimcilar?: string[];
}) {
  if (!input.userId) return { error: "Öğrenci seçmelisin." };
  if (!input.baslangic) return { error: "Tarih ve saat gir." };

  // Formdaki saat Türkiye saati. Sunucu UTC çalıştığı için new Date() ile
  // çevirmek saati olduğu gibi UTC sanıyor ve kayıt 3 saat ileri kalıyordu.
  const baslangicUtc = trSaatiniUtcYap(input.baslangic);
  if (!baslangicUtc) return { error: "Tarih ve saat okunamadı." };

  const sure = Number(input.sureDk) || 60;

  const supabase = await createClient();

  // Kendisi listeye girmesin; aynı kişiye iki satır yazılırdı.
  const ekstra = [...new Set(input.ekstraKatilimcilar ?? [])].filter((id) => id && id !== input.userId);
  const kisiler = [input.userId, ...ekstra];
  // Grup kimliği yalnızca gerçekten grup varken: bireysel oturumlarda null
  // kalması, "bu bir grup oturumu mu" sorusunu tek bakışta cevaplıyor.
  const grupId = ekstra.length > 0 ? crypto.randomUUID() : null;

  const ortak = {
    course_id: input.courseId || null,
    baslangic: baslangicUtc,
    sure_dk: sure,
    konu: input.konu.trim() || null,
    toplanti_link: input.toplantiLink.trim() || null,
    kayit_link: input.kayitLink?.trim() || null,
    grup_id: grupId,
  };

  /*
    Eklenen satırların kimlikleri geri isteniyor: takvim etkinliğinin
    kimliği bu satırlara yazılacak ve grup oturumunda satırları başka türlü
    tek tek bulmak gerekirdi.
  */
  const { data: eklenen, error } = await supabase
    .from("egitim_oturumlari")
    .insert(kisiler.map((id) => ({ ...ortak, user_id: id })))
    .select("id");

  if (error) return { error: veriHatasi(error) };

  /*
    Katılımcıya haber. Panele her gün girilmiyor; ders tarihini yalnızca
    panele koymak, çoğu zaman kimsenin görmemesi demek.

    Sonuç geri veriliyor ama hata sayılmıyor: oturum kaydedildi, postanın
    gitmemesi bunu geri almaz. Yönetici arayüzde uyarıyı görüyor.
  */
  const program = input.courseId ? await kursAdi(supabase, input.courseId) : null;

  /*
    Grup oturumunda haber HERKESE gidiyor.

    Yalnızca ilk kişiye gönderilseydi diğerleri tarihi ancak panele girdikleri
    gün öğrenirdi — ve bu maili göndermenin sebebi tam olarak "panele her gün
    girilmiyor" idi.

    Sırayla gönderiliyor, hepsi birden değil: Resend'in oran sınırına dört
    kişilik bir grupta takılmak zor ama sıra bozulduğunda hangi adrese
    gidilemediğini bilmek gerekiyor.
  */
  const basarisiz: string[] = [];
  for (const kisi of kisiler) {
    const posta = await oturumPlanlandiBildir(supabase, kisi, {
      baslangic: baslangicUtc,
      sureDk: sure,
      konu: input.konu.trim(),
      program,
      toplantiLink: input.toplantiLink.trim() || null,
    });
    if (!posta.gonderildi) basarisiz.push(posta.sebep ?? "bilinmeyen sebep");
  }

  /*
    Eğitmenin takvimi. Grup oturumunda TEK etkinlik kuruluyor, katılımcı
    sayısı kadar değil: takvimde aynı saatte dört kopya görünmesi, o saatin
    dolu olduğunu göstermekten çok karışıklık üretirdi. Etkinliğin kimliği
    grubun bütün satırlarına yazılıyor.
  */
  const katilimciAdlari = await adlariGetir(supabase, kisiler);
  const takvimUyarisi = await takvimeYaz(
    supabase,
    "egitim_oturumlari",
    (eklenen ?? []).map((o) => o.id as string),
    {
      baslik: [program ?? "Birebir eğitim", katilimciAdlari[0] ?? null].filter(Boolean).join(" · "),
      aciklama: [
        katilimciAdlari.length > 0 ? `Katılımcı: ${katilimciAdlari.join(", ")}` : null,
        input.konu.trim() ? `Konu: ${input.konu.trim()}` : null,
        program ? `Program: ${program}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      baslangicUtc: baslangicUtc,
      sureDk: sure,
      konum: input.toplantiLink.trim() || null,
    },
  );

  oturumTazele();
  const postaUyarisi =
    basarisiz.length === 0
      ? null
      : kisiler.length > 1
        ? `${basarisiz.length}/${kisiler.length} bildirim gitmedi: ${basarisiz[0]}`
        : `bildirim gitmedi: ${basarisiz[0]}`;

  const uyari = uyariBirlestir(postaUyarisi, takvimUyarisi);
  return uyari ? { uyari: `Oturum kaydedildi ama ${uyari}` } : {};
}

/** Takvim etkinliğinde görünecek katılımcı adları. */
async function adlariGetir(supabase: SupabaseClient<Database>, kisiler: string[]): Promise<string[]> {
  const { data } = await supabase.from("profiles").select("id, ad, soyad").in("id", kisiler);
  return (data ?? [])
    .map((p) => [p.ad, p.soyad].filter(Boolean).join(" ").trim())
    .filter((ad) => ad.length > 0);
}

async function kursAdi(supabase: SupabaseClient<Database>, courseId: string): Promise<string | null> {
  const { data } = await supabase.from("courses").select("baslik").eq("id", courseId).maybeSingle();
  return (data?.baslik as string) ?? null;
}

function oturumTazele() {
  revalidatePath("/kontrol-9f4x2k/birebir-egitim");
  revalidatePath("/kontrol-9f4x2k/ogrenciler");
  revalidatePath("/panel/birebir-egitim");
  // Rozet ve bildirim kutusu panelin her sayfasında duruyor.
  revalidatePath("/panel", "layout");
}

export async function oturumDurumDegistir(id: string, durum: "planlandi" | "tamamlandi" | "iptal") {
  const supabase = await createClient();
  const { error } = await supabase.from("egitim_oturumlari").update({ durum }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/kontrol-9f4x2k/birebir-egitim");
  revalidatePath("/kontrol-9f4x2k/ogrenciler");
  revalidatePath("/panel/birebir-egitim");

  /*
    İptalde etkinlik takvimden kalkıyor; "tamamlandı"da kalıyor — geçmiş
    ders takvimde bir kayıt olarak durmalı.

    Grup oturumunda tek katılımcı iptal edildiğinde etkinlik SİLİNMİYOR:
    ders hâlâ yapılıyor. Bunu, aynı etkinliğe bağlı iptal edilmemiş satır
    kaldı mı diye bakarak anlıyoruz.
  */
  if (durum === "iptal") {
    const uyari = await etkinligiKaldir(supabase, id);
    if (uyari) return { uyari: `Oturum iptal edildi ama ${uyari}` };
  }
  return {};
}

/**
 * Satıra bağlı takvim etkinliğini, artık ona bağlı canlı bir oturum
 * kalmadıysa siler.
 */
async function etkinligiKaldir(supabase: SupabaseClient<Database>, oturumId: string) {
  const { data: satir } = await supabase
    .from("egitim_oturumlari")
    .select("takvim_etkinlik_id")
    .eq("id", oturumId)
    .maybeSingle();

  const etkinlikId = satir?.takvim_etkinlik_id as string | null;
  if (!etkinlikId) return null;

  const { data: kalanlar } = await supabase
    .from("egitim_oturumlari")
    .select("id, durum")
    .eq("takvim_etkinlik_id", etkinlikId);

  const canli = (kalanlar ?? []).filter((o) => o.id !== oturumId && o.durum !== "iptal");
  if (canli.length > 0) {
    // Etkinlik duruyor; yalnızca bu satırın bağı kopuyor.
    await supabase.from("egitim_oturumlari").update({ takvim_etkinlik_id: null }).eq("id", oturumId);
    return null;
  }

  return takvimdenSil(
    supabase,
    "egitim_oturumlari",
    (kalanlar ?? []).map((o) => o.id as string),
    etkinlikId,
  );
}

/**
 * Seansın kişiye özel kaydı (Drive vb.). Boş gönderilirse bağlantı kaldırılır.
 * Biçim doğrulaması panelde değil oynatma tarafında yapılıyor; buraya
 * yapıştırılan her şey guvenliUrl ve videoGomme süzgecinden geçiyor.
 */
export async function oturumKayitLinki(id: string, link: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("egitim_oturumlari")
    .update({ kayit_link: link.trim() || null })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/kontrol-9f4x2k/birebir-egitim");
  revalidatePath("/kontrol-9f4x2k/ogrenciler");
  revalidatePath("/panel/birebir-egitim");
  return {};
}

/* ------------------------------------------------------- kayıt arşivi --- */

/**
 * Katılımcının kayıt klasörü. Oturuma değil kişiye bağlı: aynı Drive
 * klasörünü her derse tek tek yapıştırmak gerekmesin, klasöre yeni kayıt
 * eklendiğinde panelde bir şey değiştirmek gerekmesin.
 */
export async function arsivEkle(input: {
  userId: string;
  link: string;
  baslik?: string;
  aciklama?: string;
  courseId?: string;
}) {
  if (!input.userId) return { error: "Öğrenci seçmelisin." };

  // Bağlantı burada da süzülüyor. Panelde ayrıca guvenliUrl'den geçiyor ama
  // geçersiz bir değeri hiç kaydetmemek, sonra "neden görünmüyor" diye
  // aramaktan iyi.
  const link = guvenliUrl(input.link);
  if (!link) return { error: "Geçerli bir bağlantı gir (https://…)." };

  const supabase = await createClient();
  const { error } = await supabase.from("egitim_kayit_arsivi").insert({
    user_id: input.userId,
    course_id: input.courseId || null,
    baslik: input.baslik?.trim() || null,
    aciklama: input.aciklama?.trim() || null,
    link,
  });

  if (error) return { error: veriHatasi(error) };

  // Yalnızca ekleme haber veriyor; güncelleme vermiyor. Bir yazım hatasını
  // düzeltmek katılımcıya "kayıtların hazır" maili göndermemeli.
  const program = input.courseId ? await kursAdi(supabase, input.courseId) : null;
  const posta = await kayitArsiviBildir(supabase, input.userId, {
    baslik: input.baslik?.trim() || "Ders kayıtları",
    program,
  });

  arsivTazele();
  return posta.gonderildi ? {} : { uyari: `Klasör paylaşıldı ama bildirim gitmedi: ${posta.sebep}` };
}

export async function arsivGuncelle(id: string, input: { link: string; baslik?: string; aciklama?: string }) {
  const link = guvenliUrl(input.link);
  if (!link) return { error: "Geçerli bir bağlantı gir (https://…)." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("egitim_kayit_arsivi")
    .update({
      link,
      baslik: input.baslik?.trim() || null,
      aciklama: input.aciklama?.trim() || null,
    })
    .eq("id", id);

  if (error) return { error: veriHatasi(error) };
  arsivTazele();
  return {};
}

export async function arsivSil(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("egitim_kayit_arsivi").delete().eq("id", id);
  if (error) return { error: veriHatasi(error) };
  arsivTazele();
  return {};
}

function arsivTazele() {
  revalidatePath("/kontrol-9f4x2k/ogrenciler");
  revalidatePath("/panel/birebir-egitim");
  revalidatePath("/panel", "layout");
}

export async function oturumSil(id: string) {
  const supabase = await createClient();
  // Silmeden ÖNCE: satır gittikten sonra etkinlik kimliğine ulaşmanın yolu
  // kalmıyor ve etkinlik takvimde sahipsiz kalıyordu.
  const takvimUyarisi = await etkinligiKaldir(supabase, id);
  const { error } = await supabase.from("egitim_oturumlari").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/kontrol-9f4x2k/birebir-egitim");
  revalidatePath("/kontrol-9f4x2k/ogrenciler");
  revalidatePath("/panel/birebir-egitim");
  return takvimUyarisi ? { uyari: `Oturum silindi ama ${takvimUyarisi}` } : {};
}
