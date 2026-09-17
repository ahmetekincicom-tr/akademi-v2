"use client";

import { IZIN_CEREZI, cerezdenOku, izniCoz, reklamIzniVar } from "@/lib/izin";

/**
 * OpenAI (ChatGPT) Ads ölçüm pikseli — tarayıcı tarafı.
 *
 * Meta pixel'iyle (lib/meta/tarayici.ts) AYNI mantık: reklam izni verilmeden
 * hiçbir şey yüklenmiyor, script bile. Fark, Google'ın Consent Mode'u OpenAI'yi
 * KAPSAMIYOR — Google etiketleri izin bilinmeden yüklenip modelleme yapabilir,
 * OpenAI yapamaz. Bu yüzden izin burada FİZİKSEL bir kapı: yoksa oaiq hiç
 * tanımlanmıyor.
 *
 * İzin sonradan verilirse OpenAiPixel bileşeni bu dosyayı yeniden çağırıyor;
 * sayfayı yenilemek gerekmiyor.
 */

type Oaiq = ((...args: unknown[]) => void) & { q?: unknown[] };

declare global {
  interface Window {
    oaiq?: Oaiq;
  }
}

/**
 * Piksel kimliği. Herkese açık bir tanımlayıcı (sayfa kaynağında görünür),
 * gizli değil — dönüşüm yazan Conversions API anahtarı ayrı ve sunucuda kalır.
 *
 * Meta/Google kimlikleri panelden geliyor; OpenAI Ads yeni olduğu için şimdilik
 * sabit. Panel alanı gerektiğinde settings'e taşınabilir (Meta'daki gibi).
 */
export const OAIQ_PIXEL_ID = "4JjkdYZzB2UpAPk7xTXAS5";

/**
 * init yalnızca bir kez. Modül seviyesinde, bileşen state'inde değil:
 * gezinmede bileşen yeniden çizilse de sekmede tek bir init kalıyor. İkinci
 * init olayları iki kez saydırabilir.
 */
let baslatildi = false;

/**
 * Reklam izni var mı? Tek karar: izin çerezi + Global Privacy Control.
 * (lib/meta/tarayici.ts'teki izinVarMi ile aynı kural.)
 */
export function oaiqIzinVar(): boolean {
  if (typeof document === "undefined") return false;
  if (window.navigator?.globalPrivacyControl === true) return false;
  return reklamIzniVar(izniCoz(cerezdenOku(document.cookie, IZIN_CEREZI)));
}

/**
 * OpenAI'nin resmi yükleyicisi (kurulum kodundan, olduğu gibi).
 *
 * window.oaiq stub'ını SENKRON kuruyor ve SDK'yı async indiriyor; SDK inene
 * kadar yapılan çağrılar oaiq.q kuyruğunda bekleyip yüklenince işleniyor.
 * `debug` verilmiyor (varsayılan kapalı) — canlıda konsolu kirletmesin.
 */
function yukleyiciyiCalistir() {
  if (window.oaiq) return;
  (function (w: Window, d: Document, s: "script", u: string) {
    if (w.oaiq) return;
    const q = function (...args: unknown[]) {
      (q.q = q.q ?? []).push(args);
    } as Oaiq;
    q.q = [];
    w.oaiq = q;
    const j = d.createElement(s);
    j.async = true;
    j.src = u;
    const f = d.getElementsByTagName(s)[0];
    f.parentNode?.insertBefore(j, f);
  })(window, document, "script", "https://bzrcdn.openai.com/sdk/oaiq.min.js");
}

/** Pikseli açar (yalnızca izin varsa, yalnızca bir kez). */
export function oaiqBaslat(): boolean {
  if (!oaiqIzinVar()) return false;
  if (!baslatildi) {
    yukleyiciyiCalistir();
    window.oaiq?.("init", { pixelId: OAIQ_PIXEL_ID });
    baslatildi = true;
  }
  return true;
}

/**
 * Bir dönüşüm/olay bildirir (oaiq "measure").
 *
 * Piksel açılmadıysa (izin yok) sessizce atlanır — izinsiz kuyruğa bile
 * yazılmaz. SDK henüz inmediyse çağrı oaiq.q kuyruğunda bekler.
 */
export function oaiqOlcum(tur: string, veri?: Record<string, unknown>): void {
  if (!baslatildi || !oaiqIzinVar()) return;
  try {
    window.oaiq?.("measure", tur, veri ?? {});
  } catch {
    // Ölçümleme yan iş; kullanıcı akışını hiçbir koşulda bozmamalı.
  }
}
