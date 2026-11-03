/**
 * WhatsApp entegrasyonunun hem sunucuda hem tarayıcıda kullanılan sabitleri.
 *
 * Graph API sürümü: Meta'nın Embedded Signup belgesi FB.init'te ve sunucu
 * çağrılarında en güncel sürümün kullanılmasını istiyor; ikisi aynı değeri
 * görsün diye tek yerde.
 */
export const GRAPH_SURUM = "v26.0";

/** Embedded Signup'ın tamamlanma olayları (window "message", type WA_EMBEDDED_SIGNUP). */
export const BITIS_OLAYLARI = [
  "FINISH",
  "FINISH_ONLY_WABA",
  "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING",
  "FINISH_GRANT_ONLY_API_ACCESS",
] as const;

/** Telefondaki WhatsApp Business uygulamasıyla birlikte kullanım (coexistence) olayı. */
export const UYGULAMAYLA_BIRLIKTE_OLAYI = "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING";

/** Meta kimlikleri yalnızca rakam. */
export const kimlikGecerliMi = (v: unknown): v is string => typeof v === "string" && /^\d{5,25}$/.test(v);

/**
 * Sistem kullanıcısı anahtarının erişebildiği WhatsApp işletme hesapları
 * (debug_token → granular_scopes). whatsapp_business_management kapsamının
 * target_ids listesi, sistem kullanıcısına atanmış hesaplar.
 */
export function anahtarHesaplari(kapsamlar: unknown): string[] {
  if (!Array.isArray(kapsamlar)) return [];
  const sonuc = new Set<string>();
  for (const k of kapsamlar) {
    const o = k as { scope?: unknown; target_ids?: unknown };
    if (o?.scope !== "whatsapp_business_management" || !Array.isArray(o.target_ids)) continue;
    for (const id of o.target_ids) if (kimlikGecerliMi(id)) sonuc.add(id);
  }
  return [...sonuc];
}

export type HesapNumarasi = {
  wabaId: string;
  id: string;
  display_phone_number?: string;
  verified_name?: string;
  is_on_biz_app?: boolean;
};

/**
 * Bağlanacak numara: tek numara varsa o; birden fazlaysa telefondaki
 * WhatsApp Business uygulamasıyla birlikte kullanılan (is_on_biz_app) tek
 * numara. Belirsizse hiçbiri — yanlış numarayı bağlamaktansa sormak iyi.
 */
export function baglanacakNumara(liste: HesapNumarasi[]): HesapNumarasi | null {
  if (liste.length === 1) return liste[0]!;
  const uygulamadaki = liste.filter((n) => n.is_on_biz_app === true);
  return uygulamadaki.length === 1 ? uygulamadaki[0]! : null;
}
