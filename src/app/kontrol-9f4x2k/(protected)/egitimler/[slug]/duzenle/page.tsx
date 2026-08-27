import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseEditor, type CourseEditorInitial } from "@/components/admin/CourseEditor";

export default async function EgitimDuzenlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select(
      "slug, baslik, baslik_vurgu, aciklama, sure, format, seviye, kapak_gorsel, sitede_gorunur, satisa_acik, fiyat_gorunur, content, modules(id, sira, baslik, lessons(id, sira, baslik, sure))",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!course) notFound();

  const modules = [...course.modules]
    .sort((a, b) => a.sira - b.sira)
    .map((m) => ({
      id: m.id,
      ad: m.baslik,
      dersler: [...m.lessons]
        .sort((a, b) => a.sira - b.sira)
        .map((d) => ({ id: d.id, ad: d.baslik, sure: d.sure ?? "" })),
    }));

  // content serbest JSON; editöre yalnızca oradan yönetilen alanlar taşınıyor.
  const icerik = course.content as { tanitimMetni?: string; sss?: { soru: string; cevap: string }[] } | null;

  const initial: CourseEditorInitial = {
    ad: course.baslik,
    vurgu: course.baslik_vurgu ?? "",
    sure: course.sure ?? "",
    format: course.format ?? "",
    seviye: course.seviye ?? "",
    url: course.slug,
    aciklama: course.aciklama ?? "",
    tanitimMetni: icerik?.tanitimMetni ?? "",
    sss: icerik?.sss ?? [],
    modules,
    siteGorunur: course.sitede_gorunur,
    satisaAcik: course.satisa_acik,
    fiyatGorunur: course.fiyat_gorunur,
    kapakGorsel: course.kapak_gorsel,
  };

  return <CourseEditor mode="duzenle" initial={initial} />;
}
