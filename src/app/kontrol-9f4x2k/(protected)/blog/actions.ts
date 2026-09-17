"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/tipler";

export type YaziKaydetGirdi = {
  /** Düzenlemede mevcut kaydı bulmak için; yeni yazıda yok. */
  originalSlug?: string;
  slug: string;
  baslik: string;
  ozet: string;
  icerikHtml: string;
  icerikJson: unknown;
  kapakYol: string | null;
  durum: "taslak" | "yayin";
  /** ISO tarih; boşsa ve yayına alınıyorsa now() damgalanır. */
  yayinTarihi: string | null;
  seoBaslik: string;
  seoAciklama: string;
  yazar: string;
};

export async function saveYazi(input: YaziKaydetGirdi): Promise<{ error?: string }> {
  if (!input.baslik.trim() || !input.slug.trim()) {
    return { error: "Başlık ve URL zorunludur." };
  }

  const supabase = await createClient();

  // Yayına alınıyor ve tarih girilmemişse: şimdi. Tarih bir kez konduysa
  // korunuyor (yeniden yayınlamak tarihi ileri atmasın).
  let yayinTarihi = input.yayinTarihi;
  if (input.durum === "yayin" && !yayinTarihi) yayinTarihi = new Date().toISOString();

  const row = {
    slug: input.slug.trim(),
    baslik: input.baslik.trim(),
    ozet: input.ozet.trim(),
    icerik_html: input.icerikHtml,
    icerik_json: (input.icerikJson ?? {}) as unknown as Json,
    kapak_gorsel: input.kapakYol,
    durum: input.durum,
    yayin_tarihi: yayinTarihi,
    seo_baslik: input.seoBaslik.trim(),
    seo_aciklama: input.seoAciklama.trim(),
    yazar: input.yazar.trim(),
    updated_at: new Date().toISOString(),
  };

  let id: string | null = null;
  if (input.originalSlug) {
    const { data } = await supabase.from("posts").select("id").eq("slug", input.originalSlug).maybeSingle();
    id = data?.id ?? null;
  }

  if (id) {
    // .select() şart: RLS engellenmiş bir yazma hata değil, sıfır satır döndürür
    // ve bu sessizce "başarılı" gibi görünür.
    const { data, error } = await supabase.from("posts").update(row).eq("id", id).select("id");
    if (error) return { error: error.code === "23505" ? "Bu URL zaten kullanılıyor." : error.message };
    if (!data || data.length === 0) {
      return { error: "Kaydedilemedi. Yönetici yetkisi doğrulanamadı (RLS)." };
    }
  } else {
    const { error } = await supabase.from("posts").insert(row).select("id").single();
    if (error) return { error: error.code === "23505" ? "Bu URL zaten kullanılıyor." : error.message };
  }

  // Ön yüz saatlik yeniden üretiliyor; kayıt anında görünsün diye tazeleniyor.
  revalidatePath("/blog");
  revalidatePath(`/blog/${input.slug}`);
  if (input.originalSlug && input.originalSlug !== input.slug) {
    revalidatePath(`/blog/${input.originalSlug}`);
  }
  revalidatePath("/sitemap.xml");

  redirect("/kontrol-9f4x2k/blog");
}

export async function silYazi(slug: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("posts").delete().eq("slug", slug).select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "Silinemedi. Yönetici yetkisi doğrulanamadı (RLS)." };
  }
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/sitemap.xml");
  redirect("/kontrol-9f4x2k/blog");
}
