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
