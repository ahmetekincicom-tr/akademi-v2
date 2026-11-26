import { createHmac, timingSafeEqual } from "node:crypto";
import { KOD_ALFABESI } from "@/lib/temas-kod";

/**
 * WhatsApp Cloud API webhook'unun saf kısmı: imza, çözümleme, takip kodu.
 *
 * Veritabanına dokunmuyor (o iş lib/whatsapp/kaydet); bu yüzden testle
 * sabitlenebiliyor. Biçimler Meta'nın başvuru sayfalarından:
 *  - messages:           value.contacts[], value.messages[] (from, id, timestamp, type, text.body, referral)
 *  - smb_message_echoes: value.message_echoes[] (from = işletme, to = kişi) — telefondaki
 *                        WhatsApp Business uygulamasından atılan yanıtlar (coexistence)
 *  - history:            value.history[].threads[] (id = kişinin numarası) .messages[] —
 *                        bağlantıdan sonra BİR KEZ gelen son ~180 günün sohbetleri
 *  - smb_app_state_sync: value.state_sync[] — telefon rehberindeki kişi adları
 */

/* ---------------------------------------------------------------- imza --- */

/**
 * X-Hub-Signature-256 doğrulaması: "sha256=" + HMAC-SHA256(app secret, ham gövde).
 *
 * HAM gövde şart: JSON'u çözüp yeniden yazmak boşluk ve sıra farkıyla imzayı
 * bozar. Karşılaştırma sabit sürede (timingSafeEqual): imzayı harf harf
 * tahmin etmeye yarayan zaman farkı bırakılmıyor.
 */
export function imzaGecerliMi(hamGovde: string, baslik: string | null, appSecret: string): boolean {
  if (!baslik?.startsWith("sha256=") || !appSecret) return false;
  const beklenen = createHmac("sha256", appSecret).update(hamGovde, "utf8").digest("hex");
  const gelen = baslik.slice("sha256=".length);
  if (gelen.length !== beklenen.length) return false;
  return timingSafeEqual(Buffer.from(gelen, "utf8"), Buffer.from(beklenen, "utf8"));
}

/**
 * Webhook abonelik doğrulamasının ifadesi (Meta → "Verify token").
 *
 * Ayrı bir gizli değer üretip ortam değişkenine koydurmak yerine app
 * secret'tan türetiliyor: kullanıcı yalnızca panelde gösterilen değeri Meta'ya
 * kopyalıyor. Türetilmiş değerden app secret geri hesaplanamaz.
 */
export function dogrulamaIfadesi(appSecret: string): string {
  return createHmac("sha256", appSecret).update("aea-whatsapp-webhook-dogrulama", "utf8").digest("hex").slice(0, 32);
}

/* --------------------------------------------------------- takip kodu --- */

/**
 * Mesajdaki takip kodu: sitedeki düğmenin mesajın sonuna eklediği "(Ref: XXXXXX)".
 *
 * Yalnızca "Ref:" etiketinden sonra aranıyor. Mesajın herhangi bir yerinde
 * geçen 6 harflik bir kelimeyi kod saymak ("MERHABA" gibi) yanlış kişiyle
 * eşleşme demek olurdu. Eski 5 haneli kodlar da geçerli (temas-kod).
 */
export function takipKoduBul(metin: string | null | undefined): string | null {
  if (!metin) return null;
  const m = /\bref\s*[:：]\s*([a-z0-9]{5,6})\b/i.exec(metin);
  if (!m) return null;
  const kod = m[1]!.toUpperCase();
  return [...kod].every((h) => KOD_ALFABESI.includes(h)) ? kod : null;
}

/* ------------------------------------------------------- çözümleme --- */

export type WhatsappMesaji = {
  waMesajId: string;
  yon: "gelen" | "giden";
  /** Karşı tarafın numarası (ülke kodlu rakamlar). */
  waId: string;
  /** Kişinin WhatsApp profil adı (yalnızca gelen mesajda). */
  ad: string | null;
  telefonNumaraId: string | null;
  tur: string;
  metin: string | null;
  zaman: Date;
  temasKodu: string | null;
  ctwaClid: string | null;
  referral: Record<string, unknown> | null;
  ham: Record<string, unknown>;
};

type Nesne = Record<string, unknown>;
const nesne = (v: unknown): Nesne | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Nesne) : null);
const dizi = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const yazi = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);
/** Numara: yalnızca rakamlar. */
const numara = (v: unknown): string | null => {
  const r = typeof v === "string" ? v.replace(/\D/g, "") : "";
  return r.length >= 8 && r.length <= 15 ? r : null;
};

function zamanCoz(v: unknown): Date {
  const sn = Number(v);
  return Number.isFinite(sn) && sn > 0 ? new Date(sn * 1000) : new Date();
}

/** Mesaj türüne göre okunabilir metin: metin, düğme yanıtı ya da medya açıklaması. */
function metinCoz(m: Nesne): string | null {
  const tur = yazi(m.type);
  const govde = nesne(m[tur ?? ""]);
  if (tur === "text") return yazi(nesne(m.text)?.body);
  if (tur === "button") return yazi(nesne(m.button)?.text);
  if (tur === "interactive") {
    const i = nesne(m.interactive);
    return yazi(nesne(i?.button_reply)?.title) ?? yazi(nesne(i?.list_reply)?.title);
  }
  // image, video, document: isteğe bağlı açıklama (caption).
  return yazi(govde?.caption);
}

function mesajKur(m: Nesne, yon: "gelen" | "giden", waId: string, ad: string | null, telefonNumaraId: string | null): WhatsappMesaji | null {
  const id = yazi(m.id);
  if (!id) return null;
  const metin = metinCoz(m);
  const referral = nesne(m.referral);
  return {
    waMesajId: id,
    yon,
    waId,
    ad,
    telefonNumaraId,
    tur: yazi(m.type) ?? "unknown",
    metin,
    zaman: zamanCoz(m.timestamp),
    // Takip kodu yalnızca kişinin yazdığı mesajda anlamlı.
    temasKodu: yon === "gelen" ? takipKoduBul(metin) : null,
    ctwaClid: yazi(referral?.ctwa_clid),
    referral,
    ham: m,
  };
}

/**
 * Webhook gövdesindeki mesajları ortak biçime çevirir.
 *
 * Bilinmeyen alanlar (statuses, history, account_update…) sessizce atlanıyor:
 * Meta yeni alanlar ekledikçe uç hata vermemeli; hata alan bir webhook'u Meta
 * bir süre sonra kapatıyor.
 */
export function webhookMesajlari(govde: unknown): WhatsappMesaji[] {
  const kok = nesne(govde);
  if (kok?.object !== "whatsapp_business_account") return [];
  const sonuc: WhatsappMesaji[] = [];

  for (const giris of dizi(kok.entry)) {
    for (const degisim of dizi(nesne(giris)?.changes)) {
      const d = nesne(degisim);
      const deger = nesne(d?.value);
      if (!d || !deger) continue;
      const telefonNumaraId = yazi(nesne(deger.metadata)?.phone_number_id);

      if (d.field === "messages") {
        const adlar = new Map<string, string | null>();
        for (const k of dizi(deger.contacts)) {
          const kisi = nesne(k);
          const waId = numara(kisi?.wa_id);
          if (waId) adlar.set(waId, yazi(nesne(kisi?.profile)?.name));
        }
        for (const ham of dizi(deger.messages)) {
          const m = nesne(ham);
          const waId = numara(m?.from);
          if (!m || !waId) continue;
          const mesaj = mesajKur(m, "gelen", waId, adlar.get(waId) ?? null, telefonNumaraId);
          if (mesaj) sonuc.push(mesaj);
        }
      } else if (d.field === "history") {
        /*
          Geçmiş: yalnızca bir kez istenebiliyor, kaçırılırsa geri gelmiyor.
          Yön, gönderenin işletme numarası olup olmamasından ("to" yalnız bazı
          mesajlarda var, güvenilmez). Kişi reddettiyse history[].errors geliyor.
        */
        const isletme = numara(nesne(deger.metadata)?.display_phone_number);
        for (const parca of dizi(deger.history)) {
          const p = nesne(parca);
          for (const h of dizi(p?.errors)) console.warn("[whatsapp] geçmiş aktarımı:", yazi(nesne(h)?.message) ?? "hata");
          for (const konu of dizi(p?.threads)) {
            const k = nesne(konu);
            const waId = numara(k?.id);
            if (!waId) continue;
            for (const ham of dizi(k?.messages)) {
              const m = nesne(ham);
              if (!m) continue;
              const yon = isletme && numara(m.from) === isletme ? "giden" : "gelen";
              const mesaj = mesajKur(m, yon, waId, null, telefonNumaraId);
              if (mesaj) sonuc.push(mesaj);
            }
          }
        }
      } else if (d.field === "smb_message_echoes") {
        for (const ham of dizi(deger.message_echoes)) {
          const m = nesne(ham);
          const waId = numara(m?.to);
          if (!m || !waId) continue;
          const mesaj = mesajKur(m, "giden", waId, null, telefonNumaraId);
          if (mesaj) sonuc.push(mesaj);
        }
      }
    }
  }
  return sonuc;
}

/** Telefon rehberindeki kişi adları (smb_app_state_sync). Silinen kişiler atlanıyor. */
export function webhookRehberi(govde: unknown): { waId: string; ad: string }[] {
  const kok = nesne(govde);
  if (kok?.object !== "whatsapp_business_account") return [];
  const sonuc: { waId: string; ad: string }[] = [];
  for (const giris of dizi(kok.entry)) {
    for (const degisim of dizi(nesne(giris)?.changes)) {
      const d = nesne(degisim);
      if (d?.field !== "smb_app_state_sync") continue;
      for (const oge of dizi(nesne(d.value)?.state_sync)) {
        const o = nesne(oge);
        if (o?.type !== "contact" || o.action === "remove") continue;
        const c = nesne(o.contact);
        const waId = numara(c?.phone_number);
        const ad = yazi(c?.full_name) ?? yazi(c?.first_name);
        if (waId && ad) sonuc.push({ waId, ad });
      }
    }
  }
  return sonuc;
}
