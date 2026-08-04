import { createClient } from "@/lib/supabase/server";
import { oynatmaCoz, type Oynatma } from "@/lib/oynatma";
import { kapakUrl } from "@/lib/kapak";

export type PanelLesson = {
  id: string;
  ad: string;
  sure: string;
  tamamlandi: boolean;
  // Already resolved and (for Bunny) signed on the server; the raw reference
  // is deliberately not sent to the client.
  oynatma: Oynatma | null;
  aciklama: string;
};

export type PanelModule = {
  id: string;
  baslik: string;
  dersler: PanelLesson[];
  tamamlanan: number;
  yuzde: number;
};

export type PanelCourse = {
  id: string;
  slug: string;
  baslik: string;
  etiket: string;
  sure: string;
  atanmaTarihi: string;
  modules: PanelModule[];
  dersSayisi: number;
  tamamlanan: number;
  yuzde: number;
  sonrakiDers: { id: string; ad: string; modulBaslik: string } | null;
};

export type PanelProfile = {
  id: string;
  ad: string;
  soyad: string;
  email: string;
  telefon: string;
  sirket: string;
  tamAd: string;
  basHarfler: string;
  admin: boolean;
};

type EnrollmentRow = {
  atanma_tarihi: string;
  courses: {
    id: string;
    slug: string;
    baslik: string;
    sure: string | null;
    content: { etiket?: string } | null;
    modules: {
      id: string;
      sira: number;
      baslik: string;
      lessons: {
        id: string;
        sira: number;
        baslik: string;
        sure: string | null;
        video_url: string | null;
        aciklama: string | null;
      }[];
    }[];
  } | null;
};

export async function getPanelProfile(): Promise<PanelProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, ad, soyad, email, telefon, sirket, role")
    .eq("id", user.id)
    .maybeSingle();

  const ad = data?.ad ?? "";
  const soyad = data?.soyad ?? "";
  const tamAd = [ad, soyad].filter(Boolean).join(" ");
  const email = data?.email ?? user.email ?? "";

  return {
    id: user.id,
    ad,
    soyad,
    email,
    telefon: data?.telefon ?? "",
    sirket: data?.sirket ?? "",
    // Falling back to the email keeps the sidebar from rendering blank for
    // accounts created before the name fields existed.
    tamAd: tamAd || email,
    basHarfler: [ad[0], soyad[0]].filter(Boolean).join("").toUpperCase() || email.slice(0, 2).toUpperCase(),
    admin: data?.role === "admin",
  };
}

export async function getPanelCourses(): Promise<PanelCourse[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(
      "atanma_tarihi, courses(id, slug, baslik, sure, content, modules(id, sira, baslik, lessons(id, sira, baslik, sure, video_url, aciklama)))",
    )
    .eq("user_id", user.id)
    .neq("durum", "iptal")
    .order("atanma_tarihi", { ascending: true });

  if (!enrollments?.length) return [];

  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("lesson_id, tamamlandi")
    .eq("user_id", user.id);

  const tamamlananlar = new Set(
    (progress ?? []).filter((p) => p.tamamlandi).map((p) => p.lesson_id as string),
  );

  return (enrollments as unknown as EnrollmentRow[])
    .filter((e) => e.courses !== null)
    .map((e) => {
      const c = e.courses!;
      let dersSayisi = 0;
      let tamamlanan = 0;
      let sonrakiDers: PanelCourse["sonrakiDers"] = null;

      const modules: PanelModule[] = [...c.modules]
        .sort((a, b) => a.sira - b.sira)
        .map((m) => {
          const dersler: PanelLesson[] = [...m.lessons]
            .sort((a, b) => a.sira - b.sira)
            .map((l) => {
              const bitti = tamamlananlar.has(l.id);
              if (!bitti && !sonrakiDers) {
                sonrakiDers = { id: l.id, ad: l.baslik, modulBaslik: m.baslik };
              }
              return {
                id: l.id,
                ad: l.baslik,
                sure: l.sure ?? "",
                tamamlandi: bitti,
                oynatma: oynatmaCoz(l.video_url),
                aciklama: l.aciklama ?? "",
              };
            });

          const modulTamamlanan = dersler.filter((d) => d.tamamlandi).length;
          dersSayisi += dersler.length;
          tamamlanan += modulTamamlanan;

          return {
            id: m.id,
            baslik: m.baslik,
            dersler,
            tamamlanan: modulTamamlanan,
            yuzde: dersler.length ? Math.round((modulTamamlanan / dersler.length) * 100) : 0,
          };
        });

      return {
        id: c.id,
        slug: c.slug,
        baslik: c.baslik,
        etiket: c.content?.etiket ?? "",
        sure: c.sure ?? "",
        atanmaTarihi: e.atanma_tarihi,
        modules,
        dersSayisi,
        tamamlanan,
        yuzde: dersSayisi ? Math.round((tamamlanan / dersSayisi) * 100) : 0,
        sonrakiDers,
      };
    });
}

/** Published, purchasable courses the user doesn't already own. */
export async function getOnerilenCourses() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: courses } = await supabase
    .from("courses")
    .select("slug, baslik, aciklama, sure, kapak_gorsel, content")
    .eq("durum", "yayinda")
    .eq("sitede_gorunur", true)
    .eq("satisa_acik", true)
    .order("created_at", { ascending: true });

  if (!courses?.length) return [];

  let sahipOlunan = new Set<string>();
  if (user) {
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("courses(slug)")
      .eq("user_id", user.id)
      .neq("durum", "iptal");
    sahipOlunan = new Set(
      (enrollments ?? [])
        .map((e) => (e.courses as unknown as { slug: string } | null)?.slug)
        .filter((s): s is string => Boolean(s)),
    );
  }

  return courses
    .filter((c) => !sahipOlunan.has(c.slug))
    .map((c) => ({
      slug: c.slug,
      kapak: kapakUrl(c.kapak_gorsel),
      baslik: c.baslik,
      aciklama: c.aciklama ?? "",
      sure: c.sure ?? "",
      etiket: (c.content as { etiket?: string } | null)?.etiket ?? "",
    }));
}
