import "server-only";

import { bildirimSablonu, type BildirimSatiri } from "@/lib/eposta-sablon";
import { AKISLAR, type EpostaAkisi } from "@/lib/eposta-akislari";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { metniBirlestir, type AkisMetni } from "@/lib/eposta-icerik";

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

/**
 * Gelen kutusunda görünen gönderici adı.
 *
 * Tek yerde duruyor ve ortam değişkeninden gelmiyor. Gönderici adı
 * BILDIRIM_GONDEREN'in içinde taşınıyordu; orası bir dağıtım ayarı ve
 * "Akademi", "Bildirim", boş — her dağıtımda başka bir şey yazılabiliyordu.
 * Alıcı için bu tutarsızlık markanın kendisiyle ilgili: aynı akademiden gelen
 * iki mail gelen kutusunda iki farklı gönderici gibi sıralanıyordu.
 */
export const GONDERICI_ADI = "Ahmet Ekinci Akademi";

/**
 * "Ad <adres>" ya da düz "adres" biçimindeki değerden yalnızca adresi alır.
 *
 * Ortam değişkeni iki biçimde de yazılabiliyor; adı biz koyduğumuz için
 * içindekini atıp adresi almak gerekiyor.
 */
function adresiAyikla(deger: string): string {
  const kose = deger.match(/<([^>]+)>/);
  return (kose ? kose[1] : deger).trim();
}

function ayarlariOku(): Ayar | null {
  const anahtar = process.env.RESEND_API_KEY?.trim();
  // Doğrulanmış alan adından bir adres olmalı; "Ad <adres>" biçimi de geçerli
  // ama içindeki ad yok sayılıyor, gönderici adını burası belirliyor.
  const ham = process.env.BILDIRIM_GONDEREN?.trim();
  const alici = (process.env.BILDIRIM_EPOSTA ?? "")
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);

  if (!anahtar || !ham || alici.length === 0) return null;

  const adres = adresiAyikla(ham);
  if (!adres.includes("@")) return null;

  return { anahtar, gonderen: `${GONDERICI_ADI} <${adres}>`, alici };
}

export function epostaYapilandirildiMi(): boolean {
  return ayarlariOku() !== null;
}

const ZORUNLU_AKISLAR = new Set<string>(
  AKISLAR.filter((a) => "zorunlu" in a && a.zorunlu).map((a) => a.anahtar),
);

/**
 * Akış panelden kapatılmış mı?
 *
 * Zorunlu akışlar tabloya hiç bakmıyor: işleyişi bozacak ya da tanılama için
 * gereken mailler kapatılamıyor. Kapatılabilir olsalardı, kapalı oldukları
 * unutulup "sistem bozuldu" diye aranan şey aslında bu anahtar olurdu.
 *
 * Sorgu başarısız olursa AÇIK varsayılıyor. Yanlış tarafa düşmek gerekiyorsa
 * fazladan bir mail gitmesi, gitmesi gereken bir mailin sessizce kaybolmasından
 * iyi.
 */
async function akisAcikMi(akis: EpostaAkisi): Promise<boolean> {
  if (ZORUNLU_AKISLAR.has(akis)) return true;

  const servis = gorevIstemcisi();
  if (!servis) return true;

  const { data, error } = await servis
    .from("eposta_akislari")
    .select("acik")
    .eq("anahtar", akis)
    .maybeSingle();

  if (error) return true;
  // Satır yoksa akış hiç kapatılmamış demek.
  return data?.acik !== false;
}

/**
 * Gönderim günlüğüne yaz.
 *
 * Başarısızlık da yazılıyor, hatta asıl işe yarayan o: "gitmedi"nin sebebi
 * burada duruyor. Kendi hatası yutuluyor — günlük yazılamadı diye mail
 * gönderimi bozulmamalı.
 */
async function gunlugeYaz(kayit: {
  akis: string;
  alici: string | null;
  konu: string;
  durum: "gonderildi" | "basarisiz" | "kapali" | "yapilandirilmadi";
  sebep?: string | null;
}): Promise<void> {
  try {
    const servis = gorevIstemcisi();
    if (!servis) return;
    await servis.from("eposta_gunlugu").insert({
      akis: kayit.akis,
      alici: kayit.alici,
      konu: kayit.konu.slice(0, 300),
      durum: kayit.durum,
      sebep: kayit.sebep?.slice(0, 500) ?? null,
    });
  } catch {
    // Günlük ikincil; gönderimi engellemesin.
  }
}

/**
 * Bildirim e-postası gönderir.
 *
 * ASLA hata fırlatmıyor. Çağıran yerlerin hepsi (ödeme onayı gibi) e-postadan
 * çok daha önemli bir işi yeni bitirmiş oluyor; postanın gitmemesi o işi geri
 * almamalı. Sonuç boolean olarak dönüyor, isteyen bakar.
 */
export async function epostaGonder(girdi: {
  /**
   * Hangi bildirim olduğu. Tek boğaz noktası burası: açık/kapalı kontrolü ve
   * günlük kaydı bu alandan yürüyor, her çağrı yerinde ayrı ayrı değil.
   */
  akis: EpostaAkisi;
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
  if (!ayar) {
    await gunlugeYaz({
      akis: girdi.akis,
      alici: girdi.alici ?? null,
      konu: girdi.konu,
      durum: "yapilandirilmadi",
      sebep: "RESEND_API_KEY / BILDIRIM_GONDEREN / BILDIRIM_EPOSTA eksik.",
    });
    return { gonderildi: false, hata: "E-posta yapılandırılmadı." };
  }

  if (!(await akisAcikMi(girdi.akis))) {
    /*
      Kapalı akış da günlüğe yazılıyor. "Neden mail gelmedi" sorusunun cevabı
      "çünkü sen kapatmıştın" ise, o cevabın bir yerde durması gerekiyor —
      yoksa kapatıldığı unutulup hata aranır.
    */
    await gunlugeYaz({
      akis: girdi.akis,
      alici: girdi.alici ?? null,
      konu: girdi.konu,
      durum: "kapali",
      sebep: "Bu bildirim yönetim panelinden kapatılmış.",
    });
    return { gonderildi: false, hata: "Bu bildirim kapalı." };
  }

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
      const hata = `HTTP ${cevap.status}: ${govde.slice(0, 200)}`;
      await gunlugeYaz({
        akis: girdi.akis,
        alici: alicilar.join(", "),
        konu: girdi.konu,
        durum: "basarisiz",
        sebep: hata,
      });
      return { gonderildi: false, hata };
    }

    await gunlugeYaz({
      akis: girdi.akis,
      alici: alicilar.join(", "),
      konu: girdi.konu,
      durum: "gonderildi",
    });
    return { gonderildi: true };
  } catch (e) {
    const hata = e instanceof Error ? e.message : "Bilinmeyen hata";
    await gunlugeYaz({
      akis: girdi.akis,
      alici: alicilar.join(", "),
      konu: girdi.konu,
      durum: "basarisiz",
      sebep: hata,
    });
    return { gonderildi: false, hata };
  }
}

/**
 * E-posta başlığındaki logo.
 *
 * Ayrı bir marka alanından okunuyor (marka.eposta_logo), sitedeki logodan
 * değil: sitedeki logolar SVG olabiliyor ve e-posta istemcileri SVG
 * çizmiyor — mailin tepesinde kırık bir görsel çıkardı. Alan boşsa null
 * dönüyor ve şablon yazı işaretine düşüyor.
 *
 * Hata yutuluyor: logo okunamadı diye mail gönderilmemesi saçma olurdu.
 */
async function epostaLogosu(): Promise<string | null> {
  try {
    const { getMarka } = await import("@/lib/marka");
    const marka = await getMarka();
    return marka.epostaLogo;
  } catch {
    return null;
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
 * Öğrenciye biçimli bildirim gönderir.
 *
 * yoneticiBildirimi ile aynı iskelet, iki farkla: alıcı belirtiliyor ve marka
 * kimliği akademinin kendisi ("Akademi Yönetim" değil). Yönetim bildirimleri
 * iç yazışma gibi görünmeli, öğrenciye giden mail markanın yüzü.
 */
/**
 * Akışın panelden yazılmış metnini okur.
 *
 * Satır yoksa ya da alanlar boşsa null dönüyor ve koddaki varsayılan geçerli
 * kalıyor. Sorgu başarısız olursa da null: özelleştirme okunamadı diye mail
 * hiç gitmemesindense varsayılanla gitmesi iyi.
 */
async function akisMetniniOku(akis: EpostaAkisi): Promise<AkisMetni | null> {
  try {
    const servis = gorevIstemcisi();
    if (!servis) return null;

    const { data, error } = await servis
      .from("eposta_akislari")
      .select("konu, ust_etiket, baslik, ozet, eylem_etiketi")
      .eq("anahtar", akis)
      .maybeSingle();

    if (error || !data) return null;
    return {
      konu: data.konu,
      ustEtiket: data.ust_etiket,
      baslik: data.baslik,
      ozet: data.ozet,
      eylemEtiketi: data.eylem_etiketi,
    };
  } catch {
    return null;
  }
}

export async function ogrenciBildirimi(girdi: {
  akis: EpostaAkisi;
  alici: string;
  konu: string;
  ustEtiket: string;
  baslik: string;
  ozet?: string;
  satirlar?: BildirimSatiri[];
  alinti?: string;
  /** Panel içi yol: "/panel/odemelerim" gibi. Kök adres otomatik ekleniyor. */
  yol?: string;
  eylemEtiketi?: string;
  /**
   * Panelden yazılan metindeki `{ad}` gibi yer tutucuların karşılıkları.
   * Varsayılan metinler bunları kullanmıyor — onlar zaten cümleyi kendisi
   * kuruyor; bu yalnızca özelleştirilmiş metinler için.
   */
  degiskenler?: Record<string, string | null | undefined>;
}): Promise<{ gonderildi: boolean; hata?: string }> {
  if (!girdi.alici) return { gonderildi: false, hata: "Alıcı adresi yok." };

  const [kok, logo, ozel] = await Promise.all([
    girdi.yol ? panelKoku() : null,
    epostaLogosu(),
    akisMetniniOku(girdi.akis),
  ]);

  const metinler = metniBirlestir(
    {
      konu: girdi.konu,
      ustEtiket: girdi.ustEtiket,
      baslik: girdi.baslik,
      ozet: girdi.ozet,
      eylemEtiketi: girdi.eylemEtiketi,
    },
    ozel,
    girdi.degiskenler ?? {},
  );

  const { html, metin } = bildirimSablonu({
    logo,
    ustEtiket: metinler.ustEtiket,
    baslik: metinler.baslik,
    ozet: metinler.ozet,
    satirlar: girdi.satirlar,
    alinti: girdi.alinti,
    eylem:
      kok && girdi.yol
        ? { etiket: metinler.eylemEtiketi ?? "Panele git", adres: `${kok}${girdi.yol}` }
        : undefined,
  });

  return epostaGonder({ akis: girdi.akis, konu: metinler.konu, metin, html, alici: girdi.alici });
}

/**
 * Yöneticiye biçimli bildirim gönderir.
 *
 * Çağıranların hepsi kullanıcıya ait bir işi yeni bitirmiş oluyor (mesaj
 * kaydedildi, talep açıldı). Bu yüzden burada da hata fırlatılmıyor ve dönüşe
 * bakılmıyor: postanın gitmemesi o işi geçersiz kılmaz.
 */
export async function yoneticiBildirimi(girdi: {
  akis: EpostaAkisi;
  konu: string;
  ustEtiket: string;
  baslik: string;
  ozet?: string;
  satirlar?: BildirimSatiri[];
  alinti?: string;
  /** Panel içi yol: "/kontrol-9f4x2k/mesajlar" gibi. Kök adres otomatik ekleniyor. */
  yol?: string;
  eylemEtiketi?: string;
}): Promise<{ gonderildi: boolean; hata?: string }> {
  const [kok, logo] = await Promise.all([girdi.yol ? panelKoku() : null, epostaLogosu()]);
  const { html, metin } = bildirimSablonu({
    logo,
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

  return epostaGonder({ akis: girdi.akis, konu: girdi.konu, metin, html });
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
