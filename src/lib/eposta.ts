import "server-only";

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
}): Promise<{ gonderildi: boolean; hata?: string }> {
  const ayar = ayarlariOku();
  if (!ayar) return { gonderildi: false, hata: "E-posta yapılandırılmadı." };

  try {
    const cevap = await fetch(UC_NOKTA, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ayar.anahtar}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: ayar.gonderen,
        to: ayar.alici,
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
