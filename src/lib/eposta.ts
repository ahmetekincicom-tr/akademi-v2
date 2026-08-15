import "server-only";

import { bildirimSablonu, type BildirimSatiri } from "@/lib/eposta-sablon";

/**
 * E-posta gönderimi (Resend).
 *
 * Bağımlılık kurulmadı: Resend'in yaptığı iş tek bir JSON POST ve SDK'sı
 * bunun üzerine tip tanımından fazlasını eklemiyor.
 *
 * SMTP yerine HTTP tercih edildi: sunucusuz ortamda SMTP bağlantısı kurup
 * kapatmak hem yavaş hem de bazı bölgelerde 25/587 portları kapalı.
 */

const UC_NOKTA = "https://api.resend.com/emails";

type Ayar = { anahtar: string; gonderen: string; alici: string[] };

function ayarlariOku(): Ayar | null {
  const anahtar = process.env.RESEND_API_KEY?.trim();
  // Doğrulanmış alan adından bir adres olmalı; "Ad <adres>" biçimi de geçerli.
  const gonderen = process.env.BILDIRIM_GONDEREN?.trim();
  const alici = (process.env.BILDIRIM_EPOSTA ?? "")
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);

  if (!anahtar || !gonderen || alici.length === 0) return null;
  return { anahtar, gonderen, alici };
}

export function epostaYapilandirildiMi(): boolean {
  return ayarlariOku() !== null;
}

/**
 * Bildirim e-postası gönderir.
 *
 * ASLA hata fırlatmıyor. Çağıran yerlerin hepsi (ödeme onayı gibi) e-postadan
 * çok daha önemli bir işi yeni bitirmiş oluyor; postanın gitmemesi o işi geri
 * almamalı. Sonuç boolean olarak dönüyor, isteyen bakar.
 */
export async function epostaGonder(girdi: {
  konu: string;
  metin: string;
  /** Verilmezse metin satır sonlarından basit bir HTML üretilir. */
  html?: string;
  /**
   * Alıcı. Verilmezse BILDIRIM_EPOSTA'ya, yani yöneticiye gider.
   * Öğrenciye giden mailler (hoş geldin gibi) burayı doldurur.
   */
  alici?: string;
}): Promise<{ gonderildi: boolean; hata?: string }> {
  const ayar = ayarlariOku();
  if (!ayar) return { gonderildi: false, hata: "E-posta yapılandırılmadı." };

  const alicilar = girdi.alici ? [girdi.alici] : ayar.alici;

  try {
    const cevap = await fetch(UC_NOKTA, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ayar.anahtar}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: ayar.gonderen,
        to: alicilar,
        subject: girdi.konu,
        text: girdi.metin,
        html: girdi.html ?? basitHtml(girdi.metin),
      }),
      cache: "no-store",
    });

    if (!cevap.ok) {
      const govde = await cevap.text();
      return { gonderildi: false, hata: `HTTP ${cevap.status}: ${govde.slice(0, 200)}` };
    }
    return { gonderildi: true };
  } catch (e) {
    return { gonderildi: false, hata: e instanceof Error ? e.message : "Bilinmeyen hata" };
  }
}

/**
 * Panelin adresi — maildeki düğmenin gideceği yer.
 *
 * headers() istek bağlamında çalışıyor ve doğru alan adını veriyor; zamanlanmış
 * görev gibi bağlam dışı çağrılarda hata fırlattığı için ortam değişkenine
 * düşülüyor. Hiçbiri yoksa düğme basılmıyor — kırık bir bağlantı koymaktansa
 * koymamak iyi.
 */
async function panelKoku(): Promise<string | null> {
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const sema = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
      return `${sema}://${host}`;
    }
  } catch {
    // İstek bağlamı yok; aşağıdaki yedeğe düşülüyor.
  }
  const yedek = process.env.PANEL_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  return yedek ? yedek.replace(/\/$/, "") : null;
}

/**
 * Yöneticiye biçimli bildirim gönderir.
 *
 * Çağıranların hepsi kullanıcıya ait bir işi yeni bitirmiş oluyor (mesaj
 * kaydedildi, talep açıldı). Bu yüzden burada da hata fırlatılmıyor ve dönüşe
 * bakılmıyor: postanın gitmemesi o işi geçersiz kılmaz.
 */
export async function yoneticiBildirimi(girdi: {
  konu: string;
  ustEtiket: string;
  baslik: string;
  ozet?: string;
  satirlar?: BildirimSatiri[];
  alinti?: string;
  /** Panel içi yol: "/admin/mesajlar" gibi. Kök adres otomatik ekleniyor. */
  yol?: string;
  eylemEtiketi?: string;
}): Promise<void> {
  if (!epostaYapilandirildiMi()) return;

  const kok = girdi.yol ? await panelKoku() : null;
  const { html, metin } = bildirimSablonu({
    // Yönetici bildirimleri panelin kimliğiyle geliyor; öğrenciye giden
    // mailler markanın kendisiyle.
    marka: "Akademi Yönetim",
    ustEtiket: girdi.ustEtiket,
    baslik: girdi.baslik,
    ozet: girdi.ozet,
    satirlar: girdi.satirlar,
    alinti: girdi.alinti,
    eylem: kok && girdi.yol ? { etiket: girdi.eylemEtiketi ?? "Panelde aç", adres: `${kok}${girdi.yol}` } : undefined,
  });

  await epostaGonder({ konu: girdi.konu, metin, html });
}

/** Bazı posta istemcileri düz metni göstermiyor; iskelet HTML her zaman gidiyor. */
function basitHtml(metin: string): string {
  const kacir = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const satirlar = metin
    .split("\n")
    .map((s) => (s.trim() ? `<p style="margin:0 0 10px">${kacir(s)}</p>` : ""))
    .join("");
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.6;color:#1a1d26">${satirlar}</div>`;
}
