import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/tipler";

export type OturumKaydi = {
  id: string;
  userId: string;
  ip: string;
  ulke: string;
  sehir: string;
  bolge: string;
  tarayici: string;
  isletimSistemi: string;
  cihaz: string;
  tarih: string;
};

const SELECT = "id, user_id, ip, ulke, sehir, bolge, tarayici, isletim_sistemi, cihaz, created_at";

type Row = {
  id: string;
  user_id: string;
  ip: string | null;
  ulke: string | null;
  sehir: string | null;
  bolge: string | null;
  tarayici: string | null;
  isletim_sistemi: string | null;
  cihaz: string | null;
  created_at: string;
};

function map(r: Row): OturumKaydi {
  return {
    id: r.id,
    userId: r.user_id,
    ip: r.ip ?? "",
    ulke: r.ulke ?? "",
    sehir: r.sehir ?? "",
    bolge: r.bolge ?? "",
    tarayici: r.tarayici ?? "",
    isletimSistemi: r.isletim_sistemi ?? "",
    cihaz: r.cihaz ?? "",
    tarih: r.created_at,
  };
}

/** Konumu tek satırda okunur hâle getirir. */
export function konumEtiketi(k: OturumKaydi): string {
  const parcalar = [k.sehir, k.ulke].filter(Boolean);
  return parcalar.length ? parcalar.join(", ") : "Konum bilinmiyor";
}

export function cihazEtiketi(k: OturumKaydi): string {
  const parcalar = [k.tarayici, k.isletimSistemi].filter(Boolean);
  if (!parcalar.length) return k.cihaz || "Bilinmeyen cihaz";
  return `${parcalar.join(" · ")}${k.cihaz ? ` (${k.cihaz})` : ""}`;
}

/**
 * RLS decides the scope: a student only ever gets their own rows, an admin
 * gets everyone's. Passing a userId narrows an admin query to one person.
 */
export async function getOturumlar(
  client: SupabaseClient<Database>,
  opts: { userId?: string; limit?: number } = {},
): Promise<OturumKaydi[]> {
  let sorgu = client.from("oturum_kayitlari").select(SELECT).order("created_at", { ascending: false });

  if (opts.userId) sorgu = sorgu.eq("user_id", opts.userId);
  if (opts.limit) sorgu = sorgu.limit(opts.limit);

  const { data, error } = await sorgu;
  if (error) {
    console.error("[oturum] kayıtlar okunamadı:", error.message);
    return [];
  }
  return ((data ?? []) as Row[]).map(map);
}

export type PaylasimSinyali = {
  girisSayisi: number;
  ipSayisi: number;
  sehirSayisi: number;
  sonGiris: string | null;
  supheli: boolean;
  gerekce: string;
};

/**
 * Shared-credential heuristic, not proof. Mobile networks rotate addresses and
 * people travel, so a single odd city means nothing — several distinct cities
 * or a wide spread of addresses in the same short window is what stands out.
 */
export function paylasimSinyali(kayitlar: OturumKaydi[], gunSayisi = 30): PaylasimSinyali {
  const esik = Date.now() - gunSayisi * 24 * 60 * 60 * 1000;
  const yakin = kayitlar.filter((k) => new Date(k.tarih).getTime() >= esik);

  const ipler = new Set(yakin.map((k) => k.ip).filter(Boolean));
  const sehirler = new Set(yakin.map((k) => k.sehir).filter(Boolean));

  const cokSehir = sehirler.size >= 3;
  const cokIp = ipler.size >= 6;

  const gerekce = cokSehir
    ? `Son ${gunSayisi} günde ${sehirler.size} farklı şehirden giriş yapılmış.`
    : cokIp
      ? `Son ${gunSayisi} günde ${ipler.size} farklı IP adresinden giriş yapılmış.`
      : "Olağandışı bir şey yok.";

  return {
    girisSayisi: yakin.length,
    ipSayisi: ipler.size,
    sehirSayisi: sehirler.size,
    sonGiris: kayitlar[0]?.tarih ?? null,
    supheli: cokSehir || cokIp,
    gerekce,
  };
}
