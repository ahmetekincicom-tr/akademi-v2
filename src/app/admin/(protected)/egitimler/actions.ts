"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SaveCourseInput = {
  originalSlug?: string;
  slug: string;
  baslik: string;
  sure: string;
  format: string;
  seviye: string;
  aciklama: string;
  modules: { ad: string; dersler: { ad: string; sure: string }[] }[];
  siteGorunur: boolean;
  satisaAcik: boolean;
  fiyatGorunur: boolean;
  durum: "taslak" | "yayinda";
};

type ExistingContent = {
  etiket?: string;
  maddeler?: string[];
  kazanimlar?: string[];
  uygun?: string[];
  uygunDegil?: string[];
  format?: { etiket: string; deger: string; not: string }[];
  yorumlar?: { metin: string; isim: string; rol: string }[];
  sss?: { soru: string; cevap: string }[];
  kutuSatir?: { etiket: string; deger: string }[];
  online?: boolean;
  yuzYuze?: boolean;
};

export async function saveCourse(input: SaveCourseInput): Promise<{ error?: string }> {
  if (!input.baslik.trim() || !input.slug.trim()) {
    return { error: "Program adı ve URL zorunludur." };
  }

  const supabase = await createClient();

  let courseId: string | null = null;
  let baslikVurgu = input.baslik;
  let heroAciklama = input.aciklama;
  let existingContent: ExistingContent = {};

  if (input.originalSlug) {
    const { data: existing } = await supabase
      .from("courses")
      .select("id, baslik_vurgu, hero_aciklama, content")
      .eq("slug", input.originalSlug)
      .maybeSingle();
    if (existing) {
      courseId = existing.id;
      baslikVurgu = existing.baslik_vurgu ?? input.baslik;
      heroAciklama = existing.hero_aciklama ?? input.aciklama;
      existingContent = (existing.content as ExistingContent) ?? {};
    }
  }

  const modulSayisi = input.modules.length;
  const dersSayisi = input.modules.reduce((n, m) => n + m.dersler.length, 0);

  const content = {
    etiket: existingContent.etiket ?? "",
    modul: `${modulSayisi} modül`,
    dersSayisi,
    maddeler: existingContent.maddeler ?? [],
    hizli: [
      { etiket: "Süre", deger: input.sure },
      { etiket: "Format", deger: input.format },
      { etiket: "Modül", deger: `${modulSayisi} modül · ${dersSayisi} ders` },
      { etiket: "Seviye", deger: input.seviye },
    ],
    kazanimlar: existingContent.kazanimlar ?? [],
    uygun: existingContent.uygun ?? [],
    uygunDegil: existingContent.uygunDegil ?? [],
    format: existingContent.format ?? [],
    yorumlar: existingContent.yorumlar ?? [],
    sss: existingContent.sss ?? [],
    kutuSatir: existingContent.kutuSatir ?? [],
    online: existingContent.online ?? true,
    yuzYuze: existingContent.yuzYuze ?? true,
  };

  const row = {
    slug: input.slug,
    baslik: input.baslik,
    baslik_vurgu: baslikVurgu,
    aciklama: input.aciklama,
    hero_aciklama: heroAciklama,
    sure: input.sure,
    format: input.format,
    seviye: input.seviye,
    durum: input.durum,
    sitede_gorunur: input.siteGorunur,
    satisa_acik: input.satisaAcik,
    fiyat_gorunur: input.fiyatGorunur,
    content,
  };

  let savedId = courseId;

  if (courseId) {
    const { error } = await supabase.from("courses").update(row).eq("id", courseId);
    if (error) return { error: error.code === "23505" ? "Bu URL zaten kullanılıyor." : error.message };
    await supabase.from("modules").delete().eq("course_id", courseId);
  } else {
    const { data: inserted, error } = await supabase.from("courses").insert(row).select("id").single();
    if (error) return { error: error.code === "23505" ? "Bu URL zaten kullanılıyor." : error.message };
    savedId = inserted.id;
  }

  if (!savedId) return { error: "Kayıt oluşturulamadı." };

  for (let mi = 0; mi < input.modules.length; mi++) {
    const m = input.modules[mi];
    const { data: modRow, error: modErr } = await supabase
      .from("modules")
      .insert({ course_id: savedId, sira: mi + 1, baslik: m.ad, meta: `${m.dersler.length} ders` })
      .select("id")
      .single();
    if (modErr || !modRow) return { error: modErr?.message ?? "Modül kaydedilemedi." };

    if (m.dersler.length > 0) {
      const { error: lesErr } = await supabase
        .from("lessons")
        .insert(m.dersler.map((d, di) => ({ module_id: modRow.id, sira: di + 1, baslik: d.ad, sure: d.sure })));
      if (lesErr) return { error: lesErr.message };
    }
  }

  redirect("/admin/egitimler");
}

export async function arsivleCourse(slug: string) {
  const supabase = await createClient();
  await supabase.from("courses").update({ durum: "arsivlendi", satisa_acik: false }).eq("slug", slug);
  redirect("/admin/egitimler");
}
