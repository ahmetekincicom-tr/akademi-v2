import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicClient } from "@/lib/supabase/public";
import { kapakUrl } from "@/lib/kapak";

export type CurriculumModule = {
  baslik: string;
  meta: string;
  dersler: { ad: string; sure: string }[];
};

export type FaqItem = { soru: string; cevap: string };
export type Testimonial = { metin: string; isim: string; rol: string };

export type Course = {
  id: string;
  slug: string;
  /** Kapak görselinin tam adresi; yüklenmemişse null. */
  kapak: string | null;
  etiket: string;
  sure: string;
  modul: string;
  dersSayisi: number;
  baslik: string;
  baslikVurgu: string;
  aciklama: string;
  heroAciklama: string;
  maddeler: string[];
  hizli: { etiket: string; deger: string }[];
  kazanimlar: string[];
  modules: CurriculumModule[];
  uygun: string[];
  uygunDegil: string[];
  format: { etiket: string; deger: string; not: string }[];
  yorumlar: Testimonial[];
  sss: FaqItem[];
  kutuSatir: { etiket: string; deger: string }[];
  online: boolean;
  yuzYuze: boolean;
};

export const egitmenStats = [
  { n: "5 yıl", t: "birebir eğitim" },
  { n: "400+", t: "katılımcı" },
  { n: "Ankara", t: "yüz yüze & online" },
];

/**
 * Eğitim başlığını üç parçaya ayırır: vurgudan önce, vurgu, vurgudan sonra.
 *
 * Amaç başlığın bir kısmını marka rengiyle göstermek — ama başlığın KENDİSİNİ
 * bozmadan. Önceden hero'da başlık parça parça kuruluyordu ("Birebir" sabiti +
 * vurgu + tek bir eğitim için elle eklenen "Eğitimi"), dolayısıyla ekranda
 * görünen ad ile eğitimin gerçek adı tutmuyordu; sekme başlığı, kırıntı yolu
 * ve yapısal veri tam adı kullandığı için aynı sayfada iki farklı isim vardı.
 *
 * Vurgu boşsa, tam başlığa eşitse ya da başlıkta geçmiyorsa vurgu yapılmıyor:
 * bu durumların hepsinde doğru davranış, adı olduğu gibi yazmak.
 */
export function basligiParcala(baslik: string, vurgu: string) {
  const tam = baslik.trim();
  const aranan = vurgu.trim();
  if (!aranan || aranan.toLocaleLowerCase("tr") === tam.toLocaleLowerCase("tr")) {
    return { once: tam, vurgu: "", sonra: "" };
  }

  const yer = tam.toLocaleLowerCase("tr").indexOf(aranan.toLocaleLowerCase("tr"));
  if (yer === -1) return { once: tam, vurgu: "", sonra: "" };

  return {
    once: tam.slice(0, yer),
    // Büyük/küçük harf başlıktaki hâliyle korunuyor.
    vurgu: tam.slice(yer, yer + aranan.length),
    sonra: tam.slice(yer + aranan.length),
  };
}

export const kutuNot = [
  "Ders kayıtları ve dokümanlar üye alanınızda",
  "Ömür boyu soru-cevap desteği",
  "Bireysel ve kurumsal faturalandırma",
];

const COURSE_SELECT =
  "id, slug, baslik, baslik_vurgu, aciklama, hero_aciklama, sure, kapak_gorsel, content, modules(sira, baslik, meta, lessons(sira, baslik, sure))";

type CourseRow = {
  id: string;
  slug: string;
  kapak_gorsel: string | null;
  baslik: string;
  baslik_vurgu: string;
  aciklama: string | null;
  hero_aciklama: string | null;
  sure: string | null;
  content: {
    etiket: string;
    modul: string;
    dersSayisi: number;
    maddeler: string[];
    hizli: { etiket: string; deger: string }[];
    kazanimlar: string[];
    uygun: string[];
    uygunDegil: string[];
    format: { etiket: string; deger: string; not: string }[];
    yorumlar: Testimonial[];
    sss: FaqItem[];
    kutuSatir: { etiket: string; deger: string }[];
    online: boolean;
    yuzYuze: boolean;
  };
  modules: {
    sira: number;
    baslik: string;
    meta: string | null;
    lessons: { sira: number; baslik: string; sure: string | null }[];
  }[];
};

function mapCourse(row: CourseRow): Course {
  const modules: CurriculumModule[] = [...row.modules]
    .sort((a, b) => a.sira - b.sira)
    .map((m) => ({
      baslik: m.baslik,
      meta: m.meta ?? "",
      dersler: [...m.lessons]
        .sort((a, b) => a.sira - b.sira)
        .map((d) => ({ ad: d.baslik, sure: d.sure ?? "" })),
    }));

  return {
    id: row.id,
    slug: row.slug,
    kapak: kapakUrl(row.kapak_gorsel),
    etiket: row.content.etiket,
    sure: row.sure ?? "",
    modul: row.content.modul,
    dersSayisi: row.content.dersSayisi,
    baslik: row.baslik,
    baslikVurgu: row.baslik_vurgu,
    aciklama: row.aciklama ?? "",
    heroAciklama: row.hero_aciklama ?? "",
    maddeler: row.content.maddeler,
    hizli: row.content.hizli,
    kazanimlar: row.content.kazanimlar,
    modules,
    uygun: row.content.uygun,
    uygunDegil: row.content.uygunDegil,
    format: row.content.format,
    yorumlar: row.content.yorumlar,
    sss: row.content.sss,
    kutuSatir: row.content.kutuSatir,
    online: row.content.online,
    yuzYuze: row.content.yuzYuze,
  };
}

export async function getCourses(client?: SupabaseClient): Promise<Course[]> {
  const supabase = client ?? createPublicClient();
  const { data, error } = await supabase
    .from("courses")
    .select(COURSE_SELECT)
    .order("created_at", { ascending: true });

  if (error) {
    // Silently returning [] here made an RLS or schema failure look exactly
    // like "no courses exist", which cost a lot of debugging time.
    console.error("[courses] getCourses başarısız:", error.message, error.details ?? "", error.hint ?? "");
    return [];
  }
  if (!data) return [];
  return (data as unknown as CourseRow[]).map(mapCourse);
}

export async function getCourseBySlug(slug: string, client?: SupabaseClient): Promise<Course | undefined> {
  const supabase = client ?? createPublicClient();
  const { data, error } = await supabase.from("courses").select(COURSE_SELECT).eq("slug", slug).maybeSingle();

  if (error) {
    console.error("[courses] getCourseBySlug başarısız:", slug, error.message, error.details ?? "");
    return undefined;
  }
  if (!data) return undefined;
  return mapCourse(data as unknown as CourseRow);
}
