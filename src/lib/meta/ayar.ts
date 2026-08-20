import "server-only";

import { createClient } from "@/lib/supabase/server";
import { gorevIstemcisi } from "@/lib/supabase/gorev";

/**
 * Meta ayarları (Pixel ID, CAPI token, test kodu).
 *
 * settings tablosunun `meta` satırında duruyorlar ve o satır ziyaretçiye
 * KAPALI: içinde CAPI token'ı var. Pixel ID zaten sayfa kaynağında görünen
 * bir tanımlayıcı, token değil — token'la Meta hesabına olay yazılabiliyor.
 *
 * Bu yüzden pixel'i tarayıcıya basmak için ayrı bir yol var: olcumleme
 * görünümüne benzer şekilde yalnızca ID'yi okuyan bir sorgu. Token hiçbir
 * koşulda tarayıcıya gitmiyor.
 */

export type MetaAyar = {
  pixelId: string | null;
  token: string | null;
  testKodu: string | null;
};

const BOS: MetaAyar = { pixelId: null, token: null, testKodu: null };

/**
 * Pixel ID biçimi: 15-16 haneli sayı.
 *
 * Doğrulanıyor çünkü bu değer satır içi script'e gömülüyor. Panele yanlışlıkla
 * ya da kötü niyetle yapıştırılan bir şey sayfaya kod olarak sızmasın —
 * olcumleme.ts'teki kuralın aynısı.
 */
const PIXEL_BICIMI = /^\d{10,20}$/;
/** Test kodu Meta'da "TEST12345" biçiminde veriliyor. */
const TEST_BICIMI = /^[\w-]{1,32}$/;

function ayikla(deger: unknown): MetaAyar {
  if (!deger || typeof deger !== "object") return BOS;
  const d = deger as Record<string, unknown>;

  const pixelId = typeof d.pixelId === "string" ? d.pixelId.trim() : "";
  const token = typeof d.capiToken === "string" ? d.capiToken.trim() : "";
  const testKodu = typeof d.testKodu === "string" ? d.testKodu.trim() : "";

  return {
    pixelId: PIXEL_BICIMI.test(pixelId) ? pixelId : null,
    token: token || null,
    testKodu: TEST_BICIMI.test(testKodu) ? testKodu : null,
  };
}

/** Zamanlanmış görev için: oturum yok, servis anahtarıyla okunuyor. */
export async function metaAyariGorev(): Promise<MetaAyar> {
  const servis = gorevIstemcisi();
  if (!servis) return BOS;
  const { data } = await servis.from("settings").select("deger").eq("anahtar", "meta").maybeSingle();
  return ayikla(data?.deger);
}

/** Yönetim ekranı için: oturumla, RLS is_admin() üzerinden. */
export async function metaAyari(): Promise<MetaAyar> {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("deger").eq("anahtar", "meta").maybeSingle();
  return ayikla(data?.deger);
}

/**
 * Gönderim yapılabilir mi?
 *
 * Test kodu gerekmiyor — o yalnızca doğrulama içindir ve canlıda boş olmalı.
 */
export function metaYapilandirildiMi(ayar: MetaAyar): boolean {
  return Boolean(ayar.pixelId && ayar.token);
}
