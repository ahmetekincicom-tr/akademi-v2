import { notFound } from "next/navigation";
import { getCourseBySlug } from "@/lib/courses";
import { CourseEditor, type CourseEditorInitial } from "@/components/admin/CourseEditor";

export default async function EgitimDuzenlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = getCourseBySlug(slug);
  if (!course) notFound();

  const bul = (etiket: string) => course.hizli.find((h) => h.etiket === etiket)?.deger ?? "";

  const initial: CourseEditorInitial = {
    ad: course.baslik,
    sure: bul("Süre"),
    format: bul("Format"),
    seviye: bul("Seviye"),
    url: course.slug,
    modules: course.modules.map((m) => ({
      ad: m.baslik,
      dersler: m.dersler.map((d) => ({ ad: d.ad, sure: d.sure })),
    })),
  };

  return <CourseEditor mode="duzenle" initial={initial} />;
}
