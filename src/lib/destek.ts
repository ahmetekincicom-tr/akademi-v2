import { createClient } from "@/lib/supabase/server";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { panelKullanicisi } from "@/lib/panel-kapsam";
import type { DestekEk } from "@/lib/destek-ek";
import { medyanIlkYanit } from "@/lib/destek-sure";

/** Arayüzde gösterilen ek: dosya kendi alan adımızdan, yetki kontrolüyle akıyor. */
export type DestekMesajEki = { ad: string; tip: string; boyut: number; url: string };

export type DestekMesaj = {
  id: string;
  gonderenId: string;
  gonderenAd: string;
  /**
   * Derived from the ticket owner rather than the sender's role column: a
   * student cannot read the admin's profile row under RLS, so asking the
   * database "is this person an admin" comes back empty on the panel side.
   * Anyone who is not the person who opened the ticket is answering it.
   */
  egitmenMi: boolean;
  /** İç not: yalnız ekip görür (öğrenci kapsamında zaten elenmiş olur). */
  icNot: boolean;
  metin: string;
  tarih: string;
  /** /destek-ek/<mesaj>/<sıra> — depo yolu istemciye hiç gitmiyor. */
  ekler: DestekMesajEki[];
};

export type DestekTalep = {
  id: string;
  userId: string;
  kisiAd: string;
  kisiEposta: string | null;
  baslik: string;
  program: string;
  courseId: string | null;
  durum: "acik" | "inceleniyor" | "yanitlandi" | "kapandi";
  tarih: string;
  guncelleme: string;
  mesajlar: DestekMesaj[];
};

type TicketRow = {
  id: string;
  user_id: string;
  baslik: string;
  durum: "acik" | "inceleniyor" | "yanitlandi" | "kapandi";
  created_at: string;
  updated_at: string;
  profiles: { ad: string | null; soyad: string | null; email: string | null } | null;
  courses: { baslik: string } | null;
  course_id: string | null;
  support_messages: {
    id: string;
    gonderen_id: string;
    ic_not: boolean;
    metin: string;
    created_at: string;
    ekler: DestekEk[] | null;
    profiles: { ad: string | null; soyad: string | null; email: string | null } | null;
  }[];
};

const TICKET_SELECT =
  "id, user_id, baslik, durum, course_id, created_at, updated_at, profiles(ad, soyad, email), courses(baslik), support_messages(id, gonderen_id, ic_not, metin, created_at, ekler, profiles(ad, soyad, email))";

function kisiAdi(p: { ad: string | null; soyad: string | null; email: string | null } | null) {
  return [p?.ad, p?.soyad].filter(Boolean).join(" ") || p?.email || "—";
}

/**
 * Talepler.
 *
 * kapsam="kendi" verildiğinde yalnızca giriş yapan kişinin talepleri
 * dönüyor. Panel bunu kullanıyor: RLS "kendi satırın veya yöneticiysen
 * hepsi" diyor ve yönetici aynı zamanda bir katılımcı — süzgeç olmadan
 * yönetici kendi soru-cevap sayfasında herkesin talebini görüyordu
 * (bkz. lib/panel-kapsam.ts). Yönetim ekranı kapsamı vermiyor, hepsini
 * görmesi gerekiyor.
 */
export async function getTalepler(kapsam: "hepsi" | "kendi" = "hepsi"): Promise<DestekTalep[]> {
  const supabase = await createClient();

  let sorgu = supabase.from("support_tickets").select(TICKET_SELECT).order("updated_at", { ascending: false });

  if (kapsam === "kendi") {
    const kullanici = await panelKullanicisi();
    if (!kullanici) return [];
    sorgu = sorgu.eq("user_id", kullanici);
  }

  const { data } = await sorgu;
  // Öğrenci kapsamında iç notlar HİÇ görünmemeli.
  const icNotlariEle = kapsam === "kendi";

  return ((data ?? []) as unknown as TicketRow[]).map((t) => {
    const sahipAd = kisiAdi(t.profiles);

    return {
      id: t.id,
      userId: t.user_id,
      kisiAd: sahipAd,
      kisiEposta: t.profiles?.email ?? null,
      baslik: t.baslik,
      program: t.courses?.baslik ?? "Genel",
      courseId: t.course_id,
      durum: t.durum,
      tarih: t.created_at,
      guncelleme: t.updated_at,
      mesajlar: [...t.support_messages]
        .filter((m) => !(icNotlariEle && m.ic_not))
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((m) => {
          const egitmenMi = m.gonderen_id !== t.user_id;
          const okunanAd = kisiAdi(m.profiles);
          // Okunamayan profil "—" döner; öğrenciye tire göstermek yerine rolü yaz.
          const ad = okunanAd !== "—" ? okunanAd : egitmenMi ? "Eğitmen" : sahipAd;

          return {
            id: m.id,
            gonderenId: m.gonderen_id,
            gonderenAd: ad,
            egitmenMi,
            icNot: m.ic_not,
            metin: m.metin,
            tarih: m.created_at,
            ekler: (Array.isArray(m.ekler) ? m.ekler : []).map((e, i) => ({
              ad: e.ad,
              tip: e.tip,
              boyut: e.boyut,
              url: `/destek-ek/${m.id}/${i}`,
            })),
          };
        }),
    };
  });
}

/** Admin destek masası sağ paneli için: seçili kullanıcıların profili + eğitimleri ve ilerlemesi. */
export type DestekEgitim = { baslik: string; yuzde: number; dersSayisi: number; tamamlanan: number; iptal: boolean };
export type DestekKullanici = {
  telefon: string | null;
  kaynak: string | null;
  kayitTarihi: string;
  egitimler: DestekEgitim[];
};
export async function destekKullanicilari(userIds: string[]): Promise<Record<string, DestekKullanici>> {
  const uniq = [...new Set(userIds)];
  if (uniq.length === 0) return {};
  const supabase = await createClient();
  const [{ data: profiller }, { data: kayitlar }, { data: ilerleme }] = await Promise.all([
    supabase.from("profiles").select("id, telefon, kaynak, created_at").in("id", uniq),
    supabase
      .from("enrollments")
      .select("user_id, durum, courses(baslik, modules(lessons(id)))")
      .in("user_id", uniq),
    supabase.from("lesson_progress").select("user_id, lesson_id").eq("tamamlandi", true).in("user_id", uniq),
  ]);

  // Kişi başına tamamlanan dersler; yüzde, eğitimin GÜNCEL ders listesine göre
  // (öğrenci panelindeki hesapla aynı — bkz. lib/panel.ts).
  const biten: Record<string, Set<string>> = {};
  for (const p of (ilerleme ?? []) as { user_id: string; lesson_id: string }[]) {
    (biten[p.user_id] ??= new Set()).add(p.lesson_id);
  }

  type KayitSatiri = {
    user_id: string;
    durum: string | null;
    courses: { baslik: string; modules: { lessons: { id: string }[] }[] } | null;
  };
  const egitim: Record<string, DestekEgitim[]> = {};
  for (const k of (kayitlar ?? []) as unknown as KayitSatiri[]) {
    if (!k.courses?.baslik) continue;
    const dersler = k.courses.modules.flatMap((m) => m.lessons.map((l) => l.id));
    const tamamlanan = dersler.filter((id) => biten[k.user_id]?.has(id)).length;
    (egitim[k.user_id] ??= []).push({
      baslik: k.courses.baslik,
      dersSayisi: dersler.length,
      tamamlanan,
      yuzde: dersler.length ? Math.round((tamamlanan / dersler.length) * 100) : 0,
      iptal: k.durum === "iptal",
    });
  }
  const sonuc: Record<string, DestekKullanici> = {};
  for (const p of (profiller ?? []) as { id: string; telefon: string | null; kaynak: string | null; created_at: string }[]) {
    sonuc[p.id] = { telefon: p.telefon, kaynak: p.kaynak, kayitTarihi: p.created_at, egitimler: egitim[p.id] ?? [] };
  }
  return sonuc;
}

/**
 * Tahmini yanıt süresi — UYDURMA DEĞİL: son 90 günde açılan taleplerde
 * talebin açılışından ekibin ilk (iç not olmayan) yanıtına kadar geçen
 * sürenin medyanı (dakika). 3'ten az örnek varsa null → arayüz hiç
 * göstermiyor.
 *
 * Servis istemcisiyle okunuyor: öğrenci RLS altında yalnız kendi
 * taleplerini görür, bu da "genel" süre için anlamsız bir örneklem olurdu.
 * Dışarı yalnız tek bir sayı çıkıyor; kimsenin mesajı/kimliği değil.
 */
export async function destekYanitSuresi(): Promise<number | null> {
  const servis = gorevIstemcisi();
  if (!servis) return null;
  const esik = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await servis
    .from("support_tickets")
    .select("user_id, created_at, support_messages(gonderen_id, ic_not, created_at)")
    .gte("created_at", esik)
    .limit(500);

  type Satir = {
    user_id: string;
    created_at: string;
    support_messages: { gonderen_id: string; ic_not: boolean; created_at: string }[];
  };
  return medyanIlkYanit((data ?? []) as unknown as Satir[]);
}
