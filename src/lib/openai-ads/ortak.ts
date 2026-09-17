/**
 * OpenAI (ChatGPT) Ads — tarayıcı ve sunucunun PAYLAŞTIĞI sabitler.
 *
 * Ayrı ve yönergesiz (ne "use client" ne "server-only") bir dosya: kimlik hem
 * istemci pikselinde (lib/oaiq.ts, "use client") hem sunucu göndericisinde
 * (openai-ads/sunucu.ts, "server-only") gerekiyor. Birine koymak diğerini
 * yanlış tarafa bağlar; buradan ikisi de güvenle okuyabiliyor.
 */

/**
 * Piksel kimliği — herkese açık tanımlayıcı (sayfa kaynağında görünür).
 * Dönüşüm yazan Conversions API anahtarı ayrı ve yalnızca sunucuda
 * (settings.openai_ads).
 */
export const OAIQ_PIXEL_ID = "4JjkdYZzB2UpAPk7xTXAS5";

/** WhatsApp teması bu olay tipiyle "lead" sayılıyor (hem piksel hem CAPI). */
export const OAIQ_LEAD_OLAYI = "lead_created";
