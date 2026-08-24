import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Katılımcının eğitime erişip erişemediği.
 *
 * Tek soru, tek cevap yeri. Bu kural daha önce iki dosyada ayrı ayrı
 * yazılıydı (`baslangic.ts` ve `testlerim/page.tsx`) ve ikisi de aynı şeyi
 * söylüyordu: "kendi ödemesi var mı". Kurumsal alım o cümleyi yanlış hale
 * getirdi — ajans adına ödeme yapılan üç çalışanın kendi ödemesi yok, ama
 * eğitimi satın alınmış durumda. Kural iki yerde kalsaydı biri düzeltilip
 * diğeri unutulurdu ve kişi başlangıç adımlarında "test açıldı" görüp
 * testlerim sayfasında kapalı bulurdu.
 *
 * Ödeyen bu tabloda YER ALMIYOR: onun erişimi zaten kendi payments
 * satırından geliyor. Böylece "bu kişi neden erişebiliyor" sorusunun tek bir
 * cevabı oluyor.
 */

export type Erisim = {
  /** Eğitim satın alınmış: test ve birebir eğitim açık. */
  var: boolean;
  /** Erişim başkasının ödemesinden geliyor — kurumsal koltuk. */
  kurumsal: boolean;
  /** Kurumsal ise ödemeyi yapanın adı; panelde gösteriliyor. */
  odeyen: string | null;
};

const YOK: Erisim = { var: false, kurumsal: false, odeyen: null };

/**
 * cache(): tek istekte hem başlangıç adımları hem sayfa gövdesi soruyor.
 * Önbelleksiz iki ayrı sorgu olurdu ve ikisi de aynı cevabı döndürürdü.
 */
export const getErisim = cache(async (): Promise<Erisim> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return YOK;

  /*
    Kendi ödemesi.

    `user_id` süzgeci AÇIKÇA yazılıyor. RLS "kendi satırın veya yöneticiysen
    hepsi" diyor; yönetici de bir katılımcı olduğu için süzgeçsiz sorgu ona
    herkesin ödemesini gösterir ve erişim her zaman "var" çıkardı.
  */
  const { data: kendi } = await supabase
    .from("payments")
    .select("id")
    .eq("user_id", user.id)
    .eq("durum", "odendi")
    .limit(1);

  if (kendi && kendi.length > 0) return { var: true, kurumsal: false, odeyen: null };

  /*
    Kurumsal koltuk: ödenmiş bir kaydın katılımcısı mı?

    Gömülü payments süzgeci tek başına yetmiyor — PostgREST ilişkili satır
    eşleşmese de ana satırı döndürüyor, yalnızca gömülü alan null geliyor.
    Bu yüzden sonuç KODDA da süzülüyor; aksi halde ödenmemiş bir kurumsal
    kaydın katılımcısına da erişim açılırdı.
  */
  const { data: koltuk } = await supabase
    .from("odeme_katilimcilari")
    .select("payment_id, payments(durum, profiles(ad, soyad, sirket))")
    .eq("user_id", user.id);

  for (const satir of koltuk ?? []) {
    const odeme = satir.payments;
    if (odeme?.durum !== "odendi") continue;

    const kisi = odeme.profiles;
    // Şirket adı varsa o daha anlamlı: kurumsal alımda kişi çoğu zaman
    // ödemeyi yapan meslektaşını değil, şirketi tanıyor.
    const odeyen =
      kisi?.sirket?.trim() || [kisi?.ad, kisi?.soyad].filter(Boolean).join(" ").trim() || null;

    return { var: true, kurumsal: true, odeyen };
  }

  return YOK;
});
