import "server-only";

/**
 * Meta Graph API çağrıları (WhatsApp Cloud API).
 *
 * Sürüm tek yerde: Embedded Signup belgesi "en güncel sürümü kullan" diyor;
 * JS SDK (FB.init) de aynı değeri kullanıyor (lib/whatsapp/ortak).
 */
import { GRAPH_SURUM } from "@/lib/whatsapp/ortak";

const KOK = `https://graph.facebook.com/${GRAPH_SURUM}`;

export type GraphSonuc<T> = { ok: true; veri: T } | { ok: false; hata: string };

async function istek<T>(yol: string, secenek: { yontem?: "GET" | "POST"; anahtar?: string; govde?: unknown; sorgu?: Record<string, string> } = {}): Promise<GraphSonuc<T>> {
  const url = new URL(`${KOK}/${yol.replace(/^\//, "")}`);
  for (const [k, v] of Object.entries(secenek.sorgu ?? {})) url.searchParams.set(k, v);
  try {
    const cevap = await fetch(url, {
      method: secenek.yontem ?? "GET",
      headers: {
        ...(secenek.anahtar ? { Authorization: `Bearer ${secenek.anahtar}` } : {}),
        ...(secenek.govde ? { "Content-Type": "application/json" } : {}),
      },
      body: secenek.govde ? JSON.stringify(secenek.govde) : undefined,
      cache: "no-store",
    });
    const veri = (await cevap.json().catch(() => ({}))) as T & { error?: { message?: string; code?: number } };
    if (!cevap.ok || veri?.error) {
      // Meta'nın hata metni kullanıcıya gösterilebilir; gizli değer içermiyor.
      return { ok: false, hata: veri?.error?.message ?? `Meta yanıtı ${cevap.status}` };
    }
    return { ok: true, veri };
  } catch (e) {
    return { ok: false, hata: e instanceof Error ? e.message : "Meta'ya ulaşılamadı" };
  }
}

/** Embedded Signup'ın 30 saniyelik kodunu işletme erişim anahtarına çevirir. */
export function koduAnahtaraCevir(appId: string, appSecret: string, kod: string) {
  return istek<{ access_token: string }>("oauth/access_token", {
    sorgu: { client_id: appId, client_secret: appSecret, code: kod },
  });
}

/** Uygulamayı WhatsApp işletme hesabının bildirimlerine abone eder. */
export function uygulamayiAboneEt(wabaId: string, anahtar: string) {
  return istek<{ success: boolean }>(`${wabaId}/subscribed_apps`, { yontem: "POST", anahtar });
}

/** Hesaptaki numaralar (bağlantı olayı numara kimliğini getirmediğinde). */
export function numaralar(wabaId: string, anahtar: string) {
  return istek<{ data: { id: string; display_phone_number?: string; verified_name?: string }[] }>(
    `${wabaId}/phone_numbers`,
    { anahtar, sorgu: { fields: "id,display_phone_number,verified_name" } },
  );
}

/**
 * Erişim anahtarının sahibi uygulama ve erişebildiği varlıklar.
 * Uygulama anahtarıyla (app_id|app_secret) soruluyor; yanıtta anahtarın
 * kendisi yok.
 */
export function anahtarBilgisi(appId: string, appSecret: string, anahtar: string) {
  return istek<{
    data?: { app_id?: string; is_valid?: boolean; scopes?: string[]; granular_scopes?: unknown };
  }>("debug_token", { sorgu: { input_token: anahtar, access_token: `${appId}|${appSecret}` } });
}

/**
 * Hesaptaki numaralar, telefondaki uygulamayla birlikte kullanılıp
 * kullanılmadığıyla (is_on_biz_app). Bu alanı tanımayan bir yanıtta alan
 * olmadan tekrar soruluyor.
 */
export async function hesapNumaralari(wabaId: string, anahtar: string) {
  type Numara = { id: string; display_phone_number?: string; verified_name?: string; is_on_biz_app?: boolean };
  const ilk = await istek<{ data: Numara[] }>(`${wabaId}/phone_numbers`, {
    anahtar,
    sorgu: { fields: "id,display_phone_number,verified_name,is_on_biz_app" },
  });
  if (ilk.ok) return ilk;
  return istek<{ data: Numara[] }>(`${wabaId}/phone_numbers`, {
    anahtar,
    sorgu: { fields: "id,display_phone_number,verified_name" },
  });
}

export function numaraBilgisi(telefonNumaraId: string, anahtar: string) {
  return istek<{ id: string; display_phone_number?: string; verified_name?: string }>(telefonNumaraId, {
    anahtar,
    sorgu: { fields: "id,display_phone_number,verified_name" },
  });
}

/**
 * Telefondaki WhatsApp Business uygulamasından kişi listesi ve sohbet geçmişi
 * aktarımı (coexistence). Her biri bağlantıdan sonraki 24 saat içinde ve
 * YALNIZCA BİR KEZ çağrılabiliyor; sonuç webhook'tan (smb_app_state_sync,
 * history) geliyor.
 */
export function uygulamaVerisiniSenkronla(telefonNumaraId: string, anahtar: string, tur: "smb_app_state_sync" | "history") {
  return istek<{ request_id?: string }>(`${telefonNumaraId}/smb_app_data`, {
    yontem: "POST",
    anahtar,
    govde: { messaging_product: "whatsapp", sync_type: tur },
  });
}
