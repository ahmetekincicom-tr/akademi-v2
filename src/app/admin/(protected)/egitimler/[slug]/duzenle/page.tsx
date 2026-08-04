import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseEditor, type CourseEditorInitial } from "@/components/admin/CourseEditor";

export default async function EgitimDuzenlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select(
      "slug, baslik, aciklama, sure, format, seviye, kapak_gorsel, sitede_gorunur, satisa_acik, fiyat_gorunur, modules(id, sira, baslik, lessons(id, sira, baslik, sure))",
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

  const initial: CourseEditorInitial = {
    ad: course.baslik,
    sure: course.sure ?? "",
    format: course.format ?? "",
    seviye: course.seviye ?? "",
    url: course.slug,
    aciklama: course.aciklama ?? "",
    modules,
    siteGorunur: course.sitede_gorunur,
    satisaAcik: course.satisa_acik,
    fiyatGorunur: course.fiyat_gorunur,
    kapakGorsel: course.kapak_gorsel,
  };

  return <CourseEditor mode="duzenle" initial={initial} />;
}
