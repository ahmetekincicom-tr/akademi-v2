"use server";

import { revalidatePath } from "next/cache";
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
  // ids are carried through the editor so an edit updates rows in place —
  // recreating them would cascade-delete every student's lesson progress.
  modules: { id?: string; ad: string; dersler: { id?: string; ad: string; sure: string }[] }[];
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
    // .select() matters: without it a write blocked by RLS returns no error and
    // zero affected rows, which is indistinguishable from success.
    const { data: guncellenen, error } = await supabase
      .from("courses")
      .update(row)
      .eq("id", courseId)
      .select("id");
    if (error) return { error: error.code === "23505" ? "Bu URL zaten kullanılıyor." : error.message };
    if (!guncellenen || guncellenen.length === 0) {
      return { error: "Değişiklik kaydedilemedi. Yönetici yetkisi doğrulanamadı (RLS)." };
    }
  } else {
    const { data: inserted, error } = await supabase.from("courses").insert(row).select("id").single();
    if (error) return { error: error.code === "23505" ? "Bu URL zaten kullanılıyor." : error.message };
    savedId = inserted.id;
  }

  if (!savedId) return { error: "Kayıt oluşturulamadı." };

  // Drop only the modules the editor no longer lists; survivors keep their ids.
  const keptModuleIds = input.modules.map((m) => m.id).filter((id): id is string => Boolean(id));
  const staleModules = supabase.from("modules").delete().eq("course_id", savedId);
  const { error: modDelErr } = await (keptModuleIds.length
    ? staleModules.not("id", "in", `(${keptModuleIds.join(",")})`)
    : staleModules);
  if (modDelErr) return { error: modDelErr.message };

  for (let mi = 0; mi < input.modules.length; mi++) {
    const m = input.modules[mi];
    const modRow = { sira: mi + 1, baslik: m.ad, meta: `${m.dersler.length} ders` };
    let moduleId = m.id;

    if (moduleId) {
      const { error: modErr } = await supabase.from("modules").update(modRow).eq("id", moduleId);
      if (modErr) return { error: modErr.message };
    } else {
      const { data: created, error: modErr } = await supabase
        .from("modules")
        .insert({ ...modRow, course_id: savedId })
        .select("id")
        .single();
      if (modErr || !created) return { error: modErr?.message ?? "Modül kaydedilemedi." };
      moduleId = created.id;
    }

    const keptLessonIds = m.dersler.map((d) => d.id).filter((id): id is string => Boolean(id));
    const staleLessons = supabase.from("lessons").delete().eq("module_id", moduleId);
    const { error: lesDelErr } = await (keptLessonIds.length
      ? staleLessons.not("id", "in", `(${keptLessonIds.join(",")})`)
      : staleLessons);
    if (lesDelErr) return { error: lesDelErr.message };

    for (let di = 0; di < m.dersler.length; di++) {
      const d = m.dersler[di];
      const lesRow = { sira: di + 1, baslik: d.ad, sure: d.sure };
      const { error: lesErr } = d.id
        ? await supabase.from("lessons").update(lesRow).eq("id", d.id)
        : await supabase.from("lessons").insert({ ...lesRow, module_id: moduleId });
      if (lesErr) return { error: lesErr.message };
    }
  }

  redirect("/kontrol-9f4x2k/egitimler");
}

export async function arsivleCourse(slug: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .update({ durum: "arsivlendi", satisa_acik: false })
    .eq("slug", slug)
    .select("id");

  if (error) return { error: error.message };
  // RLS rejects silently by matching zero rows rather than erroring, so an
  // empty result here means the write was blocked, not that it succeeded.
  if (!data || data.length === 0) {
    return { error: "Kayıt güncellenemedi. Yönetici yetkisi doğrulanamadı (RLS)." };
  }

  redirect("/kontrol-9f4x2k/egitimler");
}

/**
 * Eğitimin kapak görselini bağlar ya da kaldırır.
 *
 * Görsel istemciden doğrudan depoya yükleniyor (marka ve logolarda olduğu
 * gibi); burada yalnızca yol kaydediliyor. Eski dosya siliniyor, yoksa her
 * değişiklikte kovada bir kopya birikir.
 */
export async function kursKapakGuncelle(slug: string, yol: string | null): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: mevcut } = await supabase
    .from("courses")
    .select("kapak_gorsel")
    .eq("slug", slug)
    .maybeSingle();

  const { error } = await supabase.from("courses").update({ kapak_gorsel: yol }).eq("slug", slug);
  if (error) return { error: error.message };

  const eski = mevcut?.kapak_gorsel as string | null | undefined;
  if (eski && eski !== yol) {
    await supabase.storage.from("kapaklar").remove([eski]);
  }

  revalidatePath("/kontrol-9f4x2k/egitimler");
  revalidatePath("/egitimler");
  revalidatePath(`/egitimler/${slug}`);
  return {};
}
