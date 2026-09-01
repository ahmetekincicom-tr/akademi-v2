import { TR_ZAMAN } from "@/lib/zaman";

/**
 * Google Takvim'e yazma.
 *
 * Panelden bir görüşme ya da ders planlandığı anda etkinlik eğitmenin
 * takvimine düşüyor. Öncesinde plan yalnızca veritabanında ve katılımcıya
 * giden postada duruyordu; eğitmenin kendi takviminde hiçbir izi yoktu,
 * yani "o saatte doluyum" bilgisi hiçbir yerde görünmüyordu.
 *
 * KÜTÜPHANE KULLANILMIYOR (googleapis eklenmedi). İhtiyacımız olan iki uç
 * var — jeton tazeleme ve etkinlik yazma/silme — ve googleapis tek başına
 * bağımlılık ağacını onlarca megabayt büyütüyor; sunucusuz bir işlevde bu
 * doğrudan soğuk başlangıç süresi demek.
 *
 * Kimlik doğrulama YENİLEME ANAHTARI ile: hizmet hesabı yalnızca Workspace
 * alan adlarında başkasının takvimine yazabiliyor, kişisel bir Gmail
 * hesabında çalışmıyor. Anahtar bir kez alınıp ortam değişkenine konuyor,
 * süresiz geçerli (kullanıcı yetkiyi geri çekene kadar).
 */

const JETON_UCU = "https://oauth2.googleapis.com/token";
const TAKVIM_UCU = "https://www.googleapis.com/calendar/v3/calendars";

export type TakvimEtkinligi = {
  baslik: string;
  aciklama: string;
  /** UTC ISO; veritabanında saatler böyle duruyor. */
  baslangicUtc: string;
  sureDk: number;
  /** Toplantı bağlantısı; Google bunu etkinlikte "konum" olarak gösteriyor. */
  konum?: string | null;
};

export type TakvimSonucu = { etkinlikId: string } | { hata: string };

function ayar() {
  return {
    istemciId: process.env.GOOGLE_TAKVIM_ISTEMCI_ID ?? "",
    istemciSirri: process.env.GOOGLE_TAKVIM_ISTEMCI_SIRRI ?? "",
    yenilemeAnahtari: process.env.GOOGLE_TAKVIM_YENILEME_ANAHTARI ?? "",
    // Varsayılan "primary": yetkiyi veren hesabın ana takvimi. Ayrı bir
    // takvim kullanmak isteyen kimliğini buraya yazıyor.
    takvimId: process.env.GOOGLE_TAKVIM_ID?.trim() || "primary",
  };
}

/**
 * Üç değişken de tanımlı mı?
 *
 * Eksikken çağrılar sessizce başarısız olmasın diye ayrı bir soru: panelde
 * "takvim kapalı" yazmakla "takvim açık ama yazamadı" demek farklı şeyler
 * ve ikisi aynı hataya bakarak ayırt edilemiyordu.
 */
export function takvimYapilandirildiMi(): boolean {
  const a = ayar();
  return Boolean(a.istemciId && a.istemciSirri && a.yenilemeAnahtari);
}

/**
 * Erişim jetonu.
 *
 * Önbelleğe alınmıyor: sunucusuz işlevler zaten kısa ömürlü ve iki planlama
 * arasında aynı örneğin yaşadığına güvenilemez. Jeton isteği ~200ms, bir
 * panel işleminde fark edilmiyor.
 */
async function erisimJetonu(): Promise<{ jeton: string } | { hata: string }> {
  const a = ayar();
  if (!takvimYapilandirildiMi()) return { hata: "Takvim ayarları eksik (GOOGLE_TAKVIM_*)." };

  try {
    const cevap = await fetch(JETON_UCU, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: a.istemciId,
        client_secret: a.istemciSirri,
        refresh_token: a.yenilemeAnahtari,
        grant_type: "refresh_token",
      }),
      cache: "no-store",
    });

    const govde = (await cevap.json().catch(() => null)) as
      | { access_token?: string; error?: string; error_description?: string }
      | null;

    if (!cevap.ok || !govde?.access_token) {
      /*
        invalid_grant'ı ayrıca açıklıyoruz: en sık görülen hata bu ve ham
        hâliyle hiçbir şey anlatmıyor. Anahtar iptal edilmiş, Google
        hesabının parolası değişmiş ya da uygulama "test" modunda kalmış
        olabilir (test modundaki yenileme anahtarları 7 günde ölüyor).
      */
      const kod = govde?.error ?? `HTTP ${cevap.status}`;
      const ek =
        govde?.error === "invalid_grant"
          ? " — yenileme anahtarı geçersiz; yetkiyi yeniden vermek gerekiyor."
          : govde?.error_description
            ? ` — ${govde.error_description}`
            : "";
      return { hata: `Google jetonu alınamadı (${kod})${ek}` };
    }

    return { jeton: govde.access_token };
  } catch (hata) {
    return { hata: hata instanceof Error ? hata.message : "Google'a ulaşılamadı." };
  }
}

/** Etkinlik gövdesi. Saf işlev: ağ olmadan sınanabiliyor. */
export function etkinlikGovdesi(e: TakvimEtkinligi) {
  const baslangic = new Date(e.baslangicUtc);
  const bitis = new Date(baslangic.getTime() + Math.max(1, e.sureDk) * 60000);

  return {
    summary: e.baslik,
    description: e.aciklama || undefined,
    location: e.konum?.trim() || undefined,
    /*
      Saat UTC ISO olarak gönderiliyor ama saat dilimi de yazılıyor: Google
      etkinliği kimin takviminde görüntülediğinden bağımsız olarak doğru ana
      koyuyor, timeZone alanı ise tekrar eden etkinliklerde ve takvimin
      görüntüleme diliminde kullanılıyor.
    */
    start: { dateTime: baslangic.toISOString(), timeZone: TR_ZAMAN },
    end: { dateTime: bitis.toISOString(), timeZone: TR_ZAMAN },
    reminders: {
      useDefault: false,
      // Bir gün önce ve on dakika önce: ders saatini kaçırmamak için biri
      // hazırlığa, diğeri masaya oturmaya yetiyor.
      overrides: [
        { method: "popup", minutes: 24 * 60 },
        { method: "popup", minutes: 10 },
      ],
    },
  };
}

/**
 * Etkinliği oluşturur ya da — kimlik verildiyse — günceller.
 *
 * Tek işlev, çünkü çağıran taraf için soru hep aynı: "bu planlama takvimde
 * doğru saatte dursun". Kimliğin olup olmaması bir uygulama ayrıntısı.
 *
 * Kimlik verilmiş ama etkinlik takvimde yoksa (elle silinmiş olabilir)
 * yeniden oluşturuluyor: aksi hâlde silinen bir etkinlik yüzünden panel
 * kalıcı olarak hata verirdi.
 */
export async function takvimEtkinligiYaz(
  e: TakvimEtkinligi,
  etkinlikId?: string | null,
): Promise<TakvimSonucu> {
  const jeton = await erisimJetonu();
  if ("hata" in jeton) return jeton;

  const a = ayar();
  const govde = etkinlikGovdesi(e);
  const kok = `${TAKVIM_UCU}/${encodeURIComponent(a.takvimId)}/events`;

  const istek = async (yol: string, yontem: "POST" | "PATCH") =>
    fetch(yol, {
      method: yontem,
      headers: { Authorization: `Bearer ${jeton.jeton}`, "Content-Type": "application/json" },
      body: JSON.stringify(govde),
      cache: "no-store",
    });

  try {
    let cevap = etkinlikId
      ? await istek(`${kok}/${encodeURIComponent(etkinlikId)}`, "PATCH")
      : await istek(kok, "POST");

    // 404/410: etkinlik takvimden silinmiş. Yeniden kur.
    if (etkinlikId && (cevap.status === 404 || cevap.status === 410)) {
      cevap = await istek(kok, "POST");
    }

    const veri = (await cevap.json().catch(() => null)) as
      | { id?: string; error?: { message?: string } }
      | null;

    if (!cevap.ok || !veri?.id) {
      return { hata: veri?.error?.message ?? `Takvime yazılamadı (HTTP ${cevap.status})` };
    }
    return { etkinlikId: veri.id };
  } catch (hata) {
    return { hata: hata instanceof Error ? hata.message : "Takvime ulaşılamadı." };
  }
}

/**
 * Etkinliği siler.
 *
 * Zaten yoksa BAŞARILI sayılıyor (404/410): "takvimde bu etkinlik olmasın"
 * isteği zaten karşılanmış durumda ve çağıran tarafa hata döndürmek,
 * iptal işlemini gereksiz yere şüpheli gösterirdi.
 */
export async function takvimEtkinliginiSil(etkinlikId: string): Promise<{ hata?: string }> {
  if (!etkinlikId) return {};
  const jeton = await erisimJetonu();
  if ("hata" in jeton) return { hata: jeton.hata };

  const a = ayar();
  try {
    const cevap = await fetch(
      `${TAKVIM_UCU}/${encodeURIComponent(a.takvimId)}/events/${encodeURIComponent(etkinlikId)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${jeton.jeton}` },
        cache: "no-store",
      },
    );

    if (cevap.ok || cevap.status === 404 || cevap.status === 410) return {};
    return { hata: `Takvimden silinemedi (HTTP ${cevap.status})` };
  } catch (hata) {
    return { hata: hata instanceof Error ? hata.message : "Takvime ulaşılamadı." };
  }
}
