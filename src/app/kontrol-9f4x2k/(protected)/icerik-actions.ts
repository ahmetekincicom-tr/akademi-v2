"use server";

import sharp from "sharp";
import { revalidatePath } from "next/cache";
import type { Ekle } from "@/lib/supabase/tipler";
import { createClient } from "@/lib/supabase/server";

// Public pages that surface testimonials or logos.
const HERKESE_ACIK = ["/", "/yorumlar", "/referanslar", "/kurumsal", "/egitimler"];

function tazele() {
  for (const yol of HERKESE_ACIK) revalidatePath(yol);
  revalidatePath("/kontrol-9f4x2k/yorumlar");
  revalidatePath("/kontrol-9f4x2k/referanslar");
}

export type YorumInput = {
  id?: string;
  metin: string;
  isim: string;
  rol: string;
  courseId: string;
  sira: string;
  yayinda: boolean;
};

export async function yorumKaydet(input: YorumInput) {
  if (!input.metin.trim()) return { error: "Yorum metni zorunlu." };
  if (!input.isim.trim()) return { error: "İsim zorunlu." };

  const supabase = await createClient();
  const satir = {
    metin: input.metin.trim(),
    isim: input.isim.trim(),
    rol: input.rol.trim() || null,
    course_id: input.courseId || null,
    sira: Number(input.sira) || 0,
    yayinda: input.yayinda,
  };

  const { error } = input.id
    ? await supabase.from("yorumlar").update(satir).eq("id", input.id)
    : await supabase.from("yorumlar").insert(satir);

  if (error) return { error: error.message };
  tazele();
  return {};
}

export async function yorumSil(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("yorumlar").delete().eq("id", id);
  if (error) return { error: error.message };
  tazele();
  return {};
}

export type ReferansInput = {
  id?: string;
  ad: string;
  sektor: string;
  siteUrl: string;
  sira: string;
  yayinda: boolean;
  logoYolu?: string;
};

export async function referansKaydet(input: ReferansInput) {
  if (!input.ad.trim()) return { error: "Kurum adı zorunlu." };

  const supabase = await createClient();
  // Record<string, unknown> yerine tablonun kendi ekleme tipi: yanlış yazılmış
  // bir sütun adı artık derlemede yakalanıyor, çalışma zamanında değil.
  const satir: Ekle<"referanslar"> = {
    ad: input.ad.trim(),
    sektor: input.sektor.trim() || null,
    site_url: input.siteUrl.trim() || null,
    sira: Number(input.sira) || 0,
    yayinda: input.yayinda,
  };
  // Only overwrite the logo when a new one was uploaded in this save.
  if (input.logoYolu !== undefined) satir.logo_yolu = input.logoYolu || null;

  const { error } = input.id
    ? await supabase.from("referanslar").update(satir).eq("id", input.id)
    : await supabase.from("referanslar").insert(satir);

  if (error) return { error: error.message };
  tazele();
  return {};
}

/* --------------------------------------------------------- logo işleme --- */

/**
 * Yüklenen logoyu ekranda TUTARLI boyda göstermenin anahtarı: şeffaf kenarları
 * kırpmak.
 *
 * Logolar referans ızgarasında SABİT yükseklikte gösteriliyor. Ama dosyaların
 * içindeki doluluk farklıydı: kimi logo tuvalinin %98'ini, kimi yalnızca
 * %50'sini kaplıyordu (üstünde-altında şeffaf boşlukla). Sabit yükseklik dosya
 * kutusuna uygulandığı için, yarı dolu bir logo ekranda yarı boyda kalıyordu —
 * kullanıcı "kenara yasladım" dese bile gözle tutturması zor.
 *
 * Kırpınca "içerik" ile "kutu" aynı şey oluyor; doluluk ne olursa olsun hepsi
 * eşitleniyor. Böylece hazırlık yükü kullanıcıdan kalkıyor: ne yüklerse yüklesin
 * sonuç aynı.
 *
 * Çıktı hep PNG (şeffaflık korunur). 240px yüksekliğe indiriliyor: ekranda ~40px
 * gösteriliyor, retina için bile fazlasıyla yeterli, dosya küçük kalıyor.
 * threshold antialias kenarındaki yarı saydam pikselleri de boşluk sayıyor.
 */
async function logoyuKirp(buf: Buffer, svgMi: boolean): Promise<Buffer> {
  const secenek = svgMi ? { density: 384 } : undefined;
  try {
    return await sharp(buf, secenek)
      .trim({ threshold: 10 })
      .resize({ height: 240, fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
  } catch {
    // trim tek renkli/tamamen dolu bir görselde "boşluk yok" diye hata verebiliyor;
    // o zaman kırpmadan, yalnızca boyutlandırıp geçiyoruz.
    return await sharp(buf, secenek)
      .resize({ height: 240, fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
  }
}

function logoAdi(kaynakAd: string, ek = ""): string {
  const taban =
    kaynakAd
      .replace(/^\d+-/, "")
      .replace(/\.[^.]+$/, "")
      .replace(/[^\w.\-]/g, "_")
      .slice(0, 60) || "logo";
  return `${Date.now()}${ek}-${taban}.png`;
}

/**
 * Logoyu kırpıp `logolar` kovasına yükler, yolunu döndürür. İstemci artık
 * doğrudan depoya yüklemiyor; kırpma yalnızca sunucuda (sharp) yapılabiliyor.
 * Yazma yetkisi zaten RLS'te is_admin'e bağlı.
 */
export async function logoYukle(formData: FormData): Promise<{ yol?: string; error?: string }> {
  const dosya = formData.get("dosya");
  if (!(dosya instanceof File) || dosya.size === 0) return { error: "Dosya bulunamadı." };
  if (dosya.size > 5 * 1024 * 1024) return { error: "Logo 5 MB'tan küçük olmalı." };

  const svgMi = dosya.type.includes("svg") || dosya.name.toLowerCase().endsWith(".svg");
  let png: Buffer;
  try {
    png = await logoyuKirp(Buffer.from(await dosya.arrayBuffer()), svgMi);
  } catch {
    return { error: "Logo işlenemedi. Geçerli bir görsel dosyası mı?" };
  }

  const supabase = await createClient();
  const yol = logoAdi(dosya.name);
  const { error } = await supabase.storage.from("logolar").upload(yol, png, {
    contentType: "image/png",
    cacheControl: "3600",
  });
  if (error) return { error: error.message };
  return { yol };
}

/**
 * Daha önce kırpma olmadan yüklenmiş mevcut logoları tek seferde düzeltir.
 *
 * `logolar` kovasında üzerine yazma (UPDATE) izni yok — yalnızca INSERT/DELETE.
 * Bu yüzden kırpılmış sürüm YENİ yola yükleniyor, kayıt güncelleniyor, eski dosya
 * siliniyor. Kayıt güncellenemezse yeni dosya geri alınıyor ki çöp birikmesin.
 */
export async function mevcutLogolariNormalizeEt(): Promise<{
  islenen?: number;
  toplam?: number;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: yonetici } = await supabase.rpc("is_admin");
  if (!yonetici) return { error: "Bu işlem için yönetici yetkisi gerekir." };

  const { data: kayitlar, error } = await supabase
    .from("referanslar")
    .select("id, logo_yolu")
    .not("logo_yolu", "is", null);
  if (error) return { error: error.message };

  let islenen = 0;
  let i = 0;
  for (const r of kayitlar ?? []) {
    i += 1;
    const eski = r.logo_yolu as string;

    const { data: indir } = await supabase.storage.from("logolar").download(eski);
    if (!indir) continue;

    let png: Buffer;
    try {
      png = await logoyuKirp(Buffer.from(await indir.arrayBuffer()), eski.toLowerCase().endsWith(".svg"));
    } catch {
      continue;
    }

    const yeni = logoAdi(eski, `-${i}`);
    const { error: yukHata } = await supabase.storage.from("logolar").upload(yeni, png, {
      contentType: "image/png",
      cacheControl: "3600",
    });
    if (yukHata) continue;

    const { error: guncelleHata } = await supabase.from("referanslar").update({ logo_yolu: yeni }).eq("id", r.id);
    if (guncelleHata) {
      await supabase.storage.from("logolar").remove([yeni]);
      continue;
    }

    if (eski !== yeni) await supabase.storage.from("logolar").remove([eski]);
    islenen += 1;
  }

  tazele();
  return { islenen, toplam: (kayitlar ?? []).length };
}

export async function referansSil(id: string, logoYolu: string | null) {
  const supabase = await createClient();
  const { error } = await supabase.from("referanslar").delete().eq("id", id);
  if (error) return { error: error.message };

  if (logoYolu) await supabase.storage.from("logolar").remove([logoYolu]);

  tazele();
  return {};
}
