import type { SupabaseClient } from "@supabase/supabase-js";

export type GorusmeDurum = "talep" | "odeme_bekliyor" | "planlandi" | "tamamlandi" | "iptal";

export type Gorusme = {
  id: string;
  /** Ücretli görüşmenin ödeme kaydı; ücretsizlerde null. */
  paymentId: string | null;
  userId: string;
  kisiAd: string;
  kisiEmail: string;
  konu: string;
  aciklama: string;
  tercihZaman: string;
  ucretsiz: boolean;
  ucret: number | null;
  odendi: boolean;
  odemeReferansi: string;
  baslangic: string | null;
  sureDk: number;
  toplantiLink: string;
  durum: GorusmeDurum;
  adminNotu: string;
  olusturma: string;
};

export type GorusmeAyarlari = {
  ucretsizHak: number;
  ucret: number;
  sureDk: number;
  odemeAciklamasi: string;
  aktif: boolean;
  /**
   * False when the settings row could not be read. Without this the fallback
   * values below are indistinguishable from real ones, so a broken read looks
   * exactly like "admin never changed anything".
   */
  okundu: boolean;
};

export const GORUSME_DURUM_ETIKET: Record<GorusmeDurum, string> = {
  talep: "Talep alındı",
  odeme_bekliyor: "Ödeme bekliyor",
  planlandi: "Planlandı",
  tamamlandi: "Tamamlandı",
  iptal: "İptal",
};

const SELECT = `
  id, user_id, payment_id, konu, aciklama, tercih_zaman, ucretsiz, ucret, odendi, odeme_referansi,
  baslangic, sure_dk, toplanti_link, durum, admin_notu, created_at,
  profiles(ad, soyad, email)
`;

type Row = {
  id: string;
  user_id: string;
  payment_id: string | null;
  konu: string;
  aciklama: string | null;
  tercih_zaman: string | null;
  ucretsiz: boolean;
  ucret: string | number | null;
  odendi: boolean;
  odeme_referansi: string | null;
  baslangic: string | null;
  sure_dk: number;
  toplanti_link: string | null;
  durum: GorusmeDurum;
  admin_notu: string | null;
  created_at: string;
  profiles: { ad: string | null; soyad: string | null; email: string | null } | null;
};

function map(r: Row): Gorusme {
  const kisi = r.profiles;
  return {
    id: r.id,
    paymentId: r.payment_id ?? null,
    userId: r.user_id,
    kisiAd: [kisi?.ad, kisi?.soyad].filter(Boolean).join(" ") || kisi?.email || "—",
    kisiEmail: kisi?.email ?? "",
    konu: r.konu,
    aciklama: r.aciklama ?? "",
    tercihZaman: r.tercih_zaman ?? "",
    ucretsiz: r.ucretsiz,
    ucret: r.ucret === null ? null : Number(r.ucret),
    odendi: r.odendi,
    odemeReferansi: r.odeme_referansi ?? "",
    baslangic: r.baslangic,
    sureDk: r.sure_dk,
    toplantiLink: r.toplanti_link ?? "",
    durum: r.durum,
    adminNotu: r.admin_notu ?? "",
    olusturma: r.created_at,
  };
}

/** RLS decides the scope: a student sees their own, an admin sees all. */
export async function getGorusmeler(client: SupabaseClient): Promise<Gorusme[]> {
  const { data, error } = await client
    .from("gorusmeler")
    .select(SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[gorusme] liste okunamadı:", error.message);
    return [];
  }
  return ((data ?? []) as unknown as Row[]).map(map);
}

export async function getGorusmeAyarlari(client: SupabaseClient): Promise<GorusmeAyarlari> {
  const { data, error } = await client
    .from("gorusme_ayarlari")
    .select("ucretsiz_hak, ucret, sure_dk, odeme_aciklamasi, aktif")
    .maybeSingle();

  if (error) console.error("[gorusme] ayarlar okunamadı:", error.message);
  else if (!data) console.error("[gorusme] ayar satırı yok — migration eksik olabilir.");

  return {
    ucretsizHak: data?.ucretsiz_hak ?? 3,
    ucret: Number(data?.ucret ?? 0),
    sureDk: data?.sure_dk ?? 45,
    odemeAciklamasi: data?.odeme_aciklamasi ?? "",
    aktif: data?.aktif ?? true,
    okundu: Boolean(data),
  };
}

/** Kişinin iptal edilmemiş en az bir eğitim kaydı var mı. */
export async function egitimKaydiVarMi(client: SupabaseClient): Promise<boolean> {
  const { count, error } = await client
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .neq("durum", "iptal");

  if (error) {
    console.error("[gorusme] eğitim kaydı okunamadı:", error.message);
    // Hata durumunda "kaydı yok" varsayılıyor: yanlış tarafa düşmek ücretsiz
    // hak dağıtmaktan iyi. Karar zaten sunucuda yeniden veriliyor.
    return false;
  }
  return (count ?? 0) > 0;
}

/**
 * Mirrors the rule the database enforces when a request is created — cancelled
 * meetings do not consume a right. Used for display only; the decision that
 * matters is made server-side in gorusme_talep_olustur().
 *
 * Ücretsiz hak eğitim kaydına bağlı: kaydı olmayan için kalan hak sıfır ve
 * her görüşme ücretli.
 */
export function hakDurumu(
  gorusmeler: Gorusme[],
  ayarlar: GorusmeAyarlari,
  egitimKaydiVar: boolean,
) {
  const kullanilan = gorusmeler.filter((g) => g.ucretsiz && g.durum !== "iptal").length;
  const kalan = egitimKaydiVar ? Math.max(ayarlar.ucretsizHak - kullanilan, 0) : 0;
  const bekleyen = gorusmeler.some((g) => g.durum === "talep" || g.durum === "odeme_bekliyor");

  return { kullanilan, kalan, bekleyen, sonrakiUcretli: kalan === 0, egitimKaydiVar };
}
