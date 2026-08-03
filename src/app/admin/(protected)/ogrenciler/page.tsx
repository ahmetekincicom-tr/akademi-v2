import { createClient } from "@/lib/supabase/server";
import { OgrenciYonetimi, type AdminOgrenci, type AdminKurs } from "@/components/admin/OgrenciYonetimi";
import { getOturumlar, paylasimSinyali, type OturumKaydi } from "@/lib/oturum";

export default async function OgrencilerPage() {
  const supabase = await createClient();

  const [{ data: profiles }, { data: enrollments }, { data: courses }, { data: progress }, oturumlar] =
    await Promise.all([
      supabase.from("profiles").select("id, ad, soyad, email, role, created_at, silme_talebi_tarihi").order("created_at"),
      supabase.from("enrollments").select("user_id, course_id, atanma_tarihi"),
      supabase.from("courses").select("id, slug, baslik, modules(lessons(id))").order("created_at"),
      supabase.from("lesson_progress").select("user_id, lesson_id").eq("tamamlandi", true),
      // Yönetici RLS politikası tüm kullanıcıların kayıtlarını görmesine izin verir.
      getOturumlar(supabase),
    ]);

  // Kişi başına grupla; liste zaten tarihe göre azalan sırada.
  const kisiOturumlari = new Map<string, OturumKaydi[]>();
  for (const k of oturumlar) {
    const mevcut = kisiOturumlari.get(k.userId);
    if (mevcut) mevcut.push(k);
    else kisiOturumlari.set(k.userId, [k]);
  }

  type CourseRow = { id: string; slug: string; baslik: string; modules: { lessons: { id: string }[] }[] };
  const courseRows = (courses ?? []) as unknown as CourseRow[];

  // lesson → course, so a student's progress rows can be attributed per course.
  const dersKursu = new Map<string, string>();
  const kursDersSayisi = new Map<string, number>();
  for (const c of courseRows) {
    let n = 0;
    for (const m of c.modules) {
      for (const l of m.lessons) {
        dersKursu.set(l.id, c.id);
        n++;
      }
    }
    kursDersSayisi.set(c.id, n);
  }

  const tamamlanan = new Map<string, number>();
  for (const p of progress ?? []) {
    const courseId = dersKursu.get(p.lesson_id as string);
    if (!courseId) continue;
    const key = `${p.user_id}:${courseId}`;
    tamamlanan.set(key, (tamamlanan.get(key) ?? 0) + 1);
  }

  const kurslar: AdminKurs[] = courseRows.map((c) => ({ id: c.id, slug: c.slug, baslik: c.baslik }));
  const kursAdi = new Map(courseRows.map((c) => [c.id, c.baslik]));

  const ogrenciler: AdminOgrenci[] = (profiles ?? []).map((p) => {
    const kendiKayitlari = (enrollments ?? []).filter((e) => e.user_id === p.id);
    const ad = [p.ad, p.soyad].filter(Boolean).join(" ");
    const kendiOturumlari = kisiOturumlari.get(p.id) ?? [];
    return {
      id: p.id,
      isim: ad || (p.email ?? "İsimsiz kayıt"),
      eposta: p.email ?? "",
      admin: p.role === "admin",
      kayitTarihi: p.created_at,
      silmeTalebi: p.silme_talebi_tarihi ?? null,
      oturumlar: kendiOturumlari,
      sinyal: paylasimSinyali(kendiOturumlari),
      kayitlar: kendiKayitlari.map((e) => {
        const toplam = kursDersSayisi.get(e.course_id) ?? 0;
        const bitti = tamamlanan.get(`${p.id}:${e.course_id}`) ?? 0;
        return {
          courseId: e.course_id,
          baslik: kursAdi.get(e.course_id) ?? "Silinmiş eğitim",
          atanmaTarihi: e.atanma_tarihi,
          dersSayisi: toplam,
          tamamlanan: bitti,
          yuzde: toplam ? Math.round((bitti / toplam) * 100) : 0,
        };
      }),
    };
  });

  return <OgrenciYonetimi ogrenciler={ogrenciler} kurslar={kurslar} />;
}
