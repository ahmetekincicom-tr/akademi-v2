import { createClient } from "@/lib/supabase/server";
import { panelKullanicisi } from "@/lib/panel-kapsam";

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
    profiles: { ad: string | null; soyad: string | null; email: string | null } | null;
  }[];
};

const TICKET_SELECT =
  "id, user_id, baslik, durum, course_id, created_at, updated_at, profiles(ad, soyad, email), courses(baslik), support_messages(id, gonderen_id, ic_not, metin, created_at, profiles(ad, soyad, email))";

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
          };
        }),
    };
  });
}

/** Admin destek masası sağ paneli için: seçili kullanıcıların profili + eğitimleri. */
export type DestekKullanici = {
  telefon: string | null;
  kaynak: string | null;
  kayitTarihi: string;
  egitimler: string[];
};
export async function destekKullanicilari(userIds: string[]): Promise<Record<string, DestekKullanici>> {
  const uniq = [...new Set(userIds)];
  if (uniq.length === 0) return {};
  const supabase = await createClient();
  const [{ data: profiller }, { data: kayitlar }] = await Promise.all([
    supabase.from("profiles").select("id, telefon, kaynak, created_at").in("id", uniq),
    supabase.from("enrollments").select("user_id, courses(baslik)").in("user_id", uniq),
  ]);

  const egitim: Record<string, string[]> = {};
  for (const k of (kayitlar ?? []) as unknown as { user_id: string; courses: { baslik: string } | null }[]) {
    if (!k.courses?.baslik) continue;
    (egitim[k.user_id] ??= []).push(k.courses.baslik);
  }
  const sonuc: Record<string, DestekKullanici> = {};
  for (const p of (profiller ?? []) as { id: string; telefon: string | null; kaynak: string | null; created_at: string }[]) {
    sonuc[p.id] = { telefon: p.telefon, kaynak: p.kaynak, kayitTarihi: p.created_at, egitimler: egitim[p.id] ?? [] };
  }
  return sonuc;
}
