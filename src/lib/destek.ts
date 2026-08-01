import { createClient } from "@/lib/supabase/server";

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
  metin: string;
  tarih: string;
};

export type DestekTalep = {
  id: string;
  userId: string;
  kisiAd: string;
  baslik: string;
  program: string;
  durum: "acik" | "yanitlandi" | "kapandi";
  tarih: string;
  guncelleme: string;
  mesajlar: DestekMesaj[];
};

type TicketRow = {
  id: string;
  user_id: string;
  baslik: string;
  durum: "acik" | "yanitlandi" | "kapandi";
  created_at: string;
  updated_at: string;
  profiles: { ad: string | null; soyad: string | null; email: string | null } | null;
  courses: { baslik: string } | null;
  support_messages: {
    id: string;
    gonderen_id: string;
    metin: string;
    created_at: string;
    profiles: { ad: string | null; soyad: string | null; email: string | null } | null;
  }[];
};

const TICKET_SELECT =
  "id, user_id, baslik, durum, created_at, updated_at, profiles(ad, soyad, email), courses(baslik), support_messages(id, gonderen_id, metin, created_at, profiles(ad, soyad, email))";

function kisiAdi(p: { ad: string | null; soyad: string | null; email: string | null } | null) {
  return [p?.ad, p?.soyad].filter(Boolean).join(" ") || p?.email || "—";
}

/** RLS decides scope: an admin gets every ticket, a student only their own. */
export async function getTalepler(): Promise<DestekTalep[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("support_tickets").select(TICKET_SELECT).order("updated_at", { ascending: false });

  return ((data ?? []) as unknown as TicketRow[]).map((t) => {
    const sahipAd = kisiAdi(t.profiles);

    return {
      id: t.id,
      userId: t.user_id,
      kisiAd: sahipAd,
      baslik: t.baslik,
      program: t.courses?.baslik ?? "Genel",
      durum: t.durum,
      tarih: t.created_at,
      guncelleme: t.updated_at,
      mesajlar: [...t.support_messages]
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
            metin: m.metin,
            tarih: m.created_at,
          };
        }),
    };
  });
}
