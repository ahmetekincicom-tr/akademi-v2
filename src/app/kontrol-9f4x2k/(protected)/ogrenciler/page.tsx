import { createClient } from "@/lib/supabase/server";
import {
  OgrenciYonetimi,
  type AdminOgrenci,
  type AdminKurs,
  type AdminEgitimOturumu,
  type AdminKayitArsivi,
} from "@/components/admin/OgrenciYonetimi";
import type { RizaKaydi } from "@/lib/riza-tipleri";
import { getOturumlar, paylasimSinyali, type OturumKaydi } from "@/lib/oturum";

export default async function OgrencilerPage() {
  const supabase = await createClient();

  const [
    { data: profiles },
    { data: enrollments },
    { data: courses },
    { data: progress },
    { data: egitimOturumlari },
    { data: kayitArsivi },
    { data: rizalar },
    oturumlar,
  ] = await Promise.all([
    // En yeni kayıt en üstte: listeye bakma sebebi çoğunlukla "kim yeni
    // katıldı" sorusu. Eskiden artan sıradaydı ve yeni üye listenin dibine
    // düşüyordu; kişi sayısı arttıkça her seferinde sona kaydırmak gerekiyordu.
    supabase
      .from("profiles")
      .select(
        "id, ad, soyad, email, telefon, role, created_at, silme_talebi_tarihi, temas_kodu, kaynak, on_degerlendirme_tarihi",
      )
      .order("created_at", { ascending: false }),
    supabase.from("enrollments").select("user_id, course_id, atanma_tarihi"),
    supabase.from("courses").select("id, slug, baslik, modules(lessons(id))").order("created_at"),
    supabase.from("lesson_progress").select("user_id, lesson_id").eq("tamamlandi", true),
    // Birebir eğitim takvimi artık öğrenci detayından yönetiliyor.
    supabase
      .from("egitim_oturumlari")
      .select("id, user_id, baslangic, sure_dk, konu, toplanti_link, kayit_link, durum")
      .order("baslangic", { ascending: false }),
    // Kayıt klasörleri takvimden ayrı: kişiye bağlı, oturuma değil.
    supabase
      .from("egitim_kayit_arsivi")
      .select("id, user_id, course_id, baslik, link, aciklama")
      .order("sira", { ascending: true })
      .order("created_at", { ascending: true }),
    // Onay kayıtları: RLS yöneticiye hepsini açıyor, kişi başına aşağıda
    // gruplanıyor.
    supabase
      .from("riza_kayitlari")
      .select("id, user_id, belge, baglam, belge_basligi, belge_guncelleme, belge_ozeti, created_at")
      .order("created_at", { ascending: false }),
    // Yönetici RLS politikası tüm kullanıcıların kayıtlarını görmesine izin verir.
    getOturumlar(supabase),
  ]);

  const kisiEgitimleri = new Map<string, AdminEgitimOturumu[]>();
  for (const o of egitimOturumlari ?? []) {
    const kayit: AdminEgitimOturumu = {
      id: o.id,
      baslangic: o.baslangic,
      sureDk: o.sure_dk,
      konu: o.konu ?? "",
      toplantiLink: o.toplanti_link ?? "",
      kayitLink: o.kayit_link ?? "",
      durum: o.durum as AdminEgitimOturumu["durum"],
    };
    const mevcut = kisiEgitimleri.get(o.user_id);
    if (mevcut) mevcut.push(kayit);
    else kisiEgitimleri.set(o.user_id, [kayit]);
  }

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

  const kisiArsivi = new Map<string, AdminKayitArsivi[]>();
  for (const a of kayitArsivi ?? []) {
    const kayit: AdminKayitArsivi = {
      id: a.id,
      baslik: a.baslik ?? "",
      link: a.link,
      aciklama: a.aciklama ?? "",
      courseId: a.course_id ?? "",
      program: a.course_id ? (kursAdi.get(a.course_id) ?? "") : "",
    };
    const mevcut = kisiArsivi.get(a.user_id);
    if (mevcut) mevcut.push(kayit);
    else kisiArsivi.set(a.user_id, [kayit]);
  }

  const kisiOnaylari = new Map<string, RizaKaydi[]>();
  for (const r of rizalar ?? []) {
    const kayit: RizaKaydi = {
      id: r.id,
      belge: r.belge,
      baglam: r.baglam as RizaKaydi["baglam"],
      baslik: (r.belge_basligi as string) || r.belge,
      tarih: r.created_at,
      belgeGuncelleme: r.belge_guncelleme ?? null,
      ozet: r.belge_ozeti ?? null,
    };
    const mevcut = kisiOnaylari.get(r.user_id);
    if (mevcut) mevcut.push(kayit);
    else kisiOnaylari.set(r.user_id, [kayit]);
  }

  const ogrenciler: AdminOgrenci[] = (profiles ?? []).map((p) => {
    const kendiKayitlari = (enrollments ?? []).filter((e) => e.user_id === p.id);
    const ad = [p.ad, p.soyad].filter(Boolean).join(" ");
    const kendiOturumlari = kisiOturumlari.get(p.id) ?? [];
    return {
      id: p.id,
      isim: ad || (p.email ?? "İsimsiz kayıt"),
      eposta: p.email ?? "",
      telefon: p.telefon ?? "",
      admin: p.role === "admin",
      kayitTarihi: p.created_at,
      silmeTalebi: p.silme_talebi_tarihi ?? null,
      temasKodu: p.temas_kodu ?? null,
      onDegerlendirme: p.on_degerlendirme_tarihi ?? null,
      kaynak: p.kaynak ?? null,
      egitimler: kisiEgitimleri.get(p.id) ?? [],
      arsiv: kisiArsivi.get(p.id) ?? [],
      onaylar: kisiOnaylari.get(p.id) ?? [],
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
