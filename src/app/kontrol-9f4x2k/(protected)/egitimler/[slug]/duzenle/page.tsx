import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseEditor, type CourseEditorInitial } from "@/components/admin/CourseEditor";
import { ikonuDuzelt, VARSAYILAN_HAPLAR, VARSAYILAN_KAPSAM, type IkonluSatir } from "@/lib/courses";

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
  const icerik = course.content as {
    tanitimMetni?: string;
    sss?: { soru: string; cevap: string }[];
    haplar?: unknown;
    kapsam?: unknown;
    kontenjan?: string;
  } | null;

  // Kayıtta liste yoksa editöre VARSAYILAN geliyor — sayfada basılan da o.
  // Boş bir editör, sayfada dolu bir liste dururken yanıltıcı olurdu.
  const satirlar = (deger: unknown, varsayilan: IkonluSatir[]): IkonluSatir[] => {
    if (!Array.isArray(deger) || deger.length === 0) return varsayilan;
    return deger
      .map((s) => ({ ad: typeof s?.ad === "string" ? s.ad : "", ikon: ikonuDuzelt(s?.ikon) }))
      .filter((s) => s.ad);
  };

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
    haplar: satirlar(icerik?.haplar, VARSAYILAN_HAPLAR),
    kapsam: satirlar(icerik?.kapsam, VARSAYILAN_KAPSAM),
    kontenjan: icerik?.kontenjan ?? "",
    modules,
    siteGorunur: course.sitede_gorunur,
    satisaAcik: course.satisa_acik,
    fiyatGorunur: course.fiyat_gorunur,
    kapakGorsel: course.kapak_gorsel,
  };

  return <CourseEditor mode="duzenle" initial={initial} />;
}
