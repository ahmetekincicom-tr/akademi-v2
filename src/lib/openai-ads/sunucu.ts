import "server-only";

import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { OAIQ_LEAD_OLAYI, OAIQ_PIXEL_ID } from "@/lib/openai-ads/ortak";

/**
 * OpenAI (ChatGPT) Ads — sunucu tarafı dönüşüm (Conversions API).
 *
 * Meta CAPI ile AYNI yol: WhatsApp beacon'ı /api/temas'a düşüyor, temasiKaydet
 * hem Meta olayını kuyrukluyor hem burayı çağırıyor. Sunucu tarafı, reklam
 * engelleyicilerin blokladığı tarayıcı pikselinden daha güvenilir.
 *
 * Anahtar settings.openai_ads.apiKey'de; ziyaretçiye kapalı, yalnızca servis
 * anahtarıyla okunuyor ve yalnızca OpenAI'ye giderken kullanılıyor.
 */

const UC = `https://bzr.openai.com/v1/events?pid=${OAIQ_PIXEL_ID}`;

async function apiAnahtari(): Promise<string | null> {
  const servis = gorevIstemcisi();
  if (!servis) return null;
  const { data } = await servis.from("settings").select("deger").eq("anahtar", "openai_ads").maybeSingle();
  const deger = data?.deger as { apiKey?: unknown } | null;
  const anahtar = typeof deger?.apiKey === "string" ? deger.apiKey.trim() : "";
  return anahtar || null;
}

/**
 * WhatsApp temasını "lead" olarak OpenAI'ye gönderir.
 *
 * event_id = WhatsApp takip kodu (kod). Tarayıcı pikseli de measure çağrısında
 * AYNI event_id'yi gönderiyor (lib/oaiq.ts) → OpenAI ikisini tek dönüşüm
 * sayıyor (dedup). Kod her tıklamada benzersiz ve iki tarafta da aynı değer.
 *
 * İzin yoksa hiç gönderilmiyor — Meta CAPI ile aynı kural.
 */
export async function openaiLeadGonder(iz: { kod: string; izin: boolean; kaynakUrl: string }): Promise<void> {
  if (!iz.izin) return;

  const anahtar = await apiAnahtari();
  if (!anahtar) return;

  try {
    const cevap = await fetch(UC, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${anahtar}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        validate_only: false,
        events: [
          {
            id: iz.kod,
            type: OAIQ_LEAD_OLAYI,
            timestamp_ms: Date.now(),
            source_url: iz.kaynakUrl,
            action_source: "web",
            data: { type: "customer_action" },
          },
        ],
      }),
    });
    // Anahtar/biçim hatasını görebilmek için: gövdeyi okumuyoruz, durum yeter.
    if (!cevap.ok) console.error("[openai-ads] lead reddedildi:", cevap.status);
  } catch (hata) {
    // Ölçümleme yan iş; temas kaydını ve Meta olayını hiçbir koşulda bozmasın.
    console.error("[openai-ads] lead gönderilemedi:", hata);
  }
}
