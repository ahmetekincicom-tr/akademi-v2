import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/tipler";
import { metaAyariGorev, metaYapilandirildiMi, type MetaAyar } from "@/lib/meta/ayar";

/**
 * Kuyruktaki olayların Meta'ya gönderilmesi.
 *
 * Gönderim akışlardan AYRI: ödeme onayı Meta'nın cevabını beklemiyor, satırı
 * yazıp geçiyor. Buradaki her yavaşlık ya da kesinti yalnızca ölçümlemeyi
 * geciktiriyor, parayı değil.
 */

/**
 * Graph API sürümü.
 *
 * Sabitlenmiş: sürüm belirtilmezse Meta en yenisini kullanıyor ve alan
 * adları haber vermeden değişebiliyor. Bir sürüm yaklaşık iki yıl
 * destekleniyor; güncellemek bilinçli bir adım olmalı.
 */
const SURUM = "v21.0";

/** Bir olay kaç kez denenecek. */
const AZAMI_DENEME = 5;

/**
 * Meta 7 günden eski olayı reddediyor.
 *
 * Bu yaşı geçmiş satırları denemeye devam etmek, her turda kesin bir hatayı
 * tekrar üretmek demek — kuyruk tıkanır ve günlük gerçek hataları göstermez
 * hale gelir.
 */
const AZAMI_YAS_GUN = 7;

type KuyrukSatiri = {
  id: string;
  olay: string;
  event_id: string;
  olay_zamani: string;
  kaynak_url: string | null;
  kimlik: unknown;
  ozel: unknown;
  aksiyon: string;
  deneme: number;
  created_at: string;
};

export type GonderimOzeti = {
  bakilan: number;
  gonderildi: number;
  basarisiz: number;
  vazgecildi: number;
  /** Yapılandırma eksik ya da anahtar yok: kuyruğa hiç dokunulmadı. */
  atlandi?: string;
};

export async function kuyrugaGonder(
  servis: SupabaseClient<Database>,
  limit = 100,
): Promise<GonderimOzeti> {
  const bos: GonderimOzeti = { bakilan: 0, gonderildi: 0, basarisiz: 0, vazgecildi: 0 };

  const ayar = await metaAyariGorev();
  if (!metaYapilandirildiMi(ayar)) {
    /*
      Kuyruk BOŞALTILMIYOR, sadece dokunulmuyor.

      Pixel ID ya da token henüz girilmemiş olabilir. Satırları
      "yapilandirilmadi" diye kapatsaydık, ayarlar girildiğinde o günlerin
      dönüşümleri kalıcı olarak kaybolurdu. Meta 7 gün geriye kabul ediyor;
      o pencerede ayarlar girilirse kuyruk kendiliğinden akar.
    */
    return { ...bos, atlandi: "Meta pixel ID ya da CAPI token girilmemiş." };
  }

  const { data: satirlar, error } = await servis
    .from("meta_olaylari")
    .select("id, olay, event_id, olay_zamani, kaynak_url, kimlik, ozel, aksiyon, deneme, created_at")
    .eq("durum", "bekliyor")
    .order("created_at")
    .limit(limit);

  if (error || !satirlar?.length) return bos;

  const ozet = { ...bos, bakilan: satirlar.length };
  const eskiSinir = Date.now() - AZAMI_YAS_GUN * 24 * 60 * 60_000;

  for (const satir of satirlar as KuyrukSatiri[]) {
    if (new Date(satir.olay_zamani).getTime() < eskiSinir) {
      await servis
        .from("meta_olaylari")
        .update({
          durum: "vazgecildi",
          sebep: `Olay ${AZAMI_YAS_GUN} günden eski; Meta bu yaştaki olayı kabul etmiyor.`,
        })
        .eq("id", satir.id);
      ozet.vazgecildi += 1;
      continue;
    }

    const sonuc = await tekOlayGonder(ayar, satir);

    if (sonuc.tamam) {
      await servis
        .from("meta_olaylari")
        .update({
          durum: "gonderildi",
          gonderim_zamani: new Date().toISOString(),
          deneme: satir.deneme + 1,
          sebep: null,
        })
        .eq("id", satir.id);
      ozet.gonderildi += 1;
      continue;
    }

    const deneme = satir.deneme + 1;
    const bitti = deneme >= AZAMI_DENEME;
    await servis
      .from("meta_olaylari")
      .update({
        durum: bitti ? "vazgecildi" : "basarisiz",
        deneme,
        sebep: bitti ? `${deneme} denemede gönderilemedi. Son hata: ${sonuc.sebep}` : sonuc.sebep,
      })
      .eq("id", satir.id);

    if (bitti) ozet.vazgecildi += 1;
    else ozet.basarisiz += 1;
  }

  return ozet;
}

/**
 * Başarısız satırları tekrar sıraya alır.
 *
 * "basarisiz" durumu kendiliğinden yeniden denenmiyor: bir sonraki turda
 * otomatik denenseydi, kesin bir hata (yanlış token gibi) her beş dakikada
 * bir aynı yanıtı üretir ve günlüğü doldururdu. Tekrar denemek bilinçli bir
 * karar — düğmesi yönetim ekranında.
 */
export async function basarisizlariSiraya(
  servis: SupabaseClient<Database>,
): Promise<{ sayi: number }> {
  const { data } = await servis
    .from("meta_olaylari")
    .update({ durum: "bekliyor", sebep: null, deneme: 0 })
    .in("durum", ["basarisiz", "vazgecildi"])
    .select("id");

  const izinliler = await izniSonradanVerilenler(servis);
  return { sayi: (data?.length ?? 0) + izinliler };
}

/**
 * İzin sonradan verilmiş olayları serbest bırakır.
 *
 * "izinsiz" satırlar KÖRÜ KÖRÜNE sıraya alınmıyor — o, izin kontrolünü bir
 * düğmeyle iptal etmek olurdu. Yalnızca kişinin profilinde bugün `reklam_izni`
 * true olan satırlar geçiyor.
 *
 * Gerçek karşılığı var: kişi ödemeyi yapıyor, çerez bandını sonra kabul
 * ediyor. Olay o an izinsiz diye bekletiliyor ama izin verildiğinde artık
 * gönderilebilir. Kimin izni yoksa satırı olduğu yerde kalıyor.
 */
async function izniSonradanVerilenler(servis: SupabaseClient<Database>): Promise<number> {
  const { data: izinli } = await servis.from("profiles").select("id").eq("reklam_izni", true);
  if (!izinli?.length) return 0;

  const { data } = await servis
    .from("meta_olaylari")
    .update({ durum: "bekliyor", sebep: null, deneme: 0 })
    .eq("durum", "izinsiz")
    .in(
      "user_id",
      izinli.map((p) => p.id),
    )
    .select("id");

  return data?.length ?? 0;
}

async function tekOlayGonder(
  ayar: MetaAyar,
  satir: KuyrukSatiri,
): Promise<{ tamam: boolean; sebep: string }> {
  const govde: Record<string, unknown> = {
    data: [
      {
        event_name: satir.olay,
        // Meta saniye bekliyor, milisaniye değil. Milisaniye gönderilirse
        // olay 50 bin yıl sonrasına düşüyor ve sessizce reddediliyor.
        event_time: Math.floor(new Date(satir.olay_zamani).getTime() / 1000),
        event_id: satir.event_id,
        action_source: satir.aksiyon,
        ...(satir.kaynak_url ? { event_source_url: satir.kaynak_url } : {}),
        user_data: satir.kimlik ?? {},
        custom_data: satir.ozel ?? {},
      },
    ],
    access_token: ayar.token,
  };

  // Test kodu doluyken olaylar Events Manager'ın test sekmesine düşüyor ve
  // GERÇEK raporlara girmiyor. Canlıda boş olmalı; yönetim ekranı uyarıyor.
  if (ayar.testKodu) govde.test_event_code = ayar.testKodu;

  try {
    const cevap = await fetch(`https://graph.facebook.com/${SURUM}/${ayar.pixelId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(govde),
      cache: "no-store",
    });

    if (!cevap.ok) {
      const metin = await cevap.text();
      return { tamam: false, sebep: `HTTP ${cevap.status}: ${metin.slice(0, 400)}` };
    }

    /*
      200 tek başına yetmiyor: Meta olayı aldığını ama SIFIR olay işlediğini
      de 200 ile söyleyebiliyor. events_received'a bakılmasaydı, hiç
      işlenmemiş olaylar "gönderildi" diye kaydedilirdi — ölçümlemenin
      çalıştığı sanılan ama hiçbir şeyin ölçülmediği durum.
    */
    const sonuc = (await cevap.json()) as { events_received?: number };
    if (typeof sonuc.events_received === "number" && sonuc.events_received < 1) {
      return { tamam: false, sebep: "Meta 200 döndü ama hiçbir olayı işlemedi." };
    }

    return { tamam: true, sebep: "" };
  } catch (hata) {
    const mesaj = hata instanceof Error ? hata.message : String(hata);
    return { tamam: false, sebep: `Ağ hatası: ${mesaj.slice(0, 200)}` };
  }
}
