import "server-only";

import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { kimlikYeterliMi, type MetaKimlik } from "@/lib/meta/kimlik";
import type { MetaOlay } from "@/lib/meta/olaylar";

/**
 * Meta olaylarını kuyruğa yazar.
 *
 * Sisteme giren TEK boğaz noktası burası: izin kontrolü, aç/kapa kontrolü ve
 * günlük kaydı hep bu fonksiyondan yürüyor. Her çağrı yerinde ayrı ayrı
 * yazılsaydı biri er geç unutulurdu — ve unutulan yer izin kontrolü olsaydı,
 * izinsiz kişisel veri dışarı çıkardı.
 *
 * ASLA hata fırlatmıyor. Çağıran yerlerin hepsi (ödeme onayı, form kaydı)
 * Meta'dan çok daha önemli bir işi yeni bitirmiş oluyor; ölçümlemenin
 * tökezlemesi o işi geri almamalı.
 */

export type OlayGirdisi = {
  olay: MetaOlay;
  /**
   * Tekilleştirme anahtarı. DETERMİNİSTİK üretilmeli — `purchase-<payment_id>`
   * gibi.
   *
   * Sebebi çift kayıt değil, çift SAYIM: aynı ödeme mutabakat görevi ve 3D
   * dönüşü tarafından iki kez çözülebiliyor. Rastgele bir id verilseydi Meta
   * iki ayrı satış görürdü ve ciro raporu şişerdi.
   */
  eventId: string;
  kimlik: MetaKimlik;
  /** value, currency, content_name ... */
  ozel?: Record<string, unknown>;
  /**
   * Olayın gerçekte nerede olduğu (Meta: action_source).
   *
   * Havaleyle kapanan ödeme "website" değil — kişi o an hiçbir sayfada
   * değildi. Varsayılan bilerek "website" değil: yanlış tarafa düşmek
   * gerekiyorsa, olmayan bir site trafiği uydurmaktansa belirsiz kalmak iyi.
   */
  aksiyon?: "website" | "chat" | "phone_call" | "system_generated" | "other";
  kaynakUrl?: string | null;
  userId?: string | null;
  olayZamani?: Date;
  /**
   * Kişinin reklam izni var mı?
   *
   * Çağıran söylemek ZORUNDA. Varsayılan bir değer verilseydi (izin var ya da
   * yok), yeni bir çağrı yeri bunu geçmeyi unuttuğunda sessizce yanlış tarafa
   * düşerdi — ve o taraf ya izinsiz gönderim ya da hiç ölçülmeyen bir akış
   * olurdu. İkisi de kendiliğinden fark edilmez.
   */
  izin: boolean;
};

/**
 * Olay panelden kapatılmış mı?
 *
 * Sorgu başarısız olursa AÇIK varsayılıyor: e-postadaki kuralın aynısı, ama
 * ters yöne. Fazladan bir olay göndermek, gitmesi gereken bir dönüşümün
 * sessizce kaybolmasından iyi — kaybolan dönüşüm reklam bütçesini yanlış
 * yönlendirir ve kimse fark etmez.
 */
async function olayAcikMi(
  servis: NonNullable<ReturnType<typeof gorevIstemcisi>>,
  olay: MetaOlay,
): Promise<boolean> {
  const { data, error } = await servis
    .from("meta_akislari")
    .select("acik")
    .eq("anahtar", olay)
    .maybeSingle();

  if (error) return true;
  // Satır yoksa olay hiç kapatılmamış demek.
  return data?.acik !== false;
}

export async function metaOlayiKuyrukla(girdi: OlayGirdisi): Promise<void> {
  try {
    const servis = gorevIstemcisi();
    if (!servis) return;

    const durum = await hangiDurum(servis, girdi);

    /*
      İzinsiz ve kapalı olaylar da yazılıyor.

      "Bu satış neden Meta'da görünmüyor?" sorusunun cevabı "çünkü kişi çerez
      izni vermemişti" ya da "çünkü sen bu olayı kapatmıştın" ise, o cevabın
      bir yerde durması gerekiyor. Hiç yazılmasalardı yokluk ile hata aynı
      görünürdü ve olmayan bir arıza aranırdı.
    */
    const { error } = await servis.from("meta_olaylari").insert({
      olay: girdi.olay,
      event_id: girdi.eventId,
      olay_zamani: (girdi.olayZamani ?? new Date()).toISOString(),
      kaynak_url: girdi.kaynakUrl ?? null,
      kimlik: girdi.kimlik as never,
      ozel: (girdi.ozel ?? {}) as never,
      aksiyon: girdi.aksiyon ?? "other",
      durum: durum.durum,
      sebep: durum.sebep,
      user_id: girdi.userId ?? null,
    });

    /*
      23505 = unique ihlali, yani bu event_id zaten kuyrukta.

      Hata değil, tasarımın çalıştığının kanıtı: aynı ödeme ikinci kez
      çözüldüğünde ikinci olay burada duruyor. Sessizce yutuluyor.
    */
    if (error && error.code !== "23505") {
      console.error("[meta] kuyruğa yazılamadı", girdi.olay, error.message);
    }
  } catch (hata) {
    console.error("[meta] kuyruk hatası", hata);
  }
}

async function hangiDurum(
  servis: NonNullable<ReturnType<typeof gorevIstemcisi>>,
  girdi: OlayGirdisi,
): Promise<{ durum: string; sebep: string | null }> {
  if (!girdi.izin) {
    return { durum: "izinsiz", sebep: "Kişi reklam çerezlerine izin vermemiş." };
  }
  if (!(await olayAcikMi(servis, girdi.olay))) {
    return { durum: "kapali", sebep: "Bu olay yönetim panelinden kapatılmış." };
  }
  if (!kimlikYeterliMi(girdi.kimlik)) {
    return {
      durum: "vazgecildi",
      sebep: "Eşleştirilebilecek hiçbir kimlik yok (e-posta, telefon, _fbp, _fbc).",
    };
  }
  return { durum: "bekliyor", sebep: null };
}
