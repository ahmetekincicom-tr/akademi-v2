import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import type { FaqItem } from "@/lib/courses";

/**
 * Kurumsal eğitim sayfasının panelden yönetilen içeriği.
 *
 * Şimdilik yalnızca SSS. Kendi tablosu değil `settings` içinde bir anahtar:
 * tek satırlık bir içerik için ayrı tablo, ayrı RLS ve ayrı migration demek
 * olurdu; settings zaten aynı işi yapan ve yönetici yazma kuralı tanımlı bir
 * yer.
 *
 * Varsayılan KODDA: tablo okunamazsa ya da anahtar hiç yazılmamışsa sayfa
 * boş bir SSS bölümüyle değil, bugünkü metinlerle açılıyor.
 */

export const VARSAYILAN_KURUMSAL_SSS: FaqItem[] = [
  {
    soru: "Kaç kişilik ekiplere uygun?",
    cevap:
      "2 kişiden büyük pazarlama ekiplerine kadar uyarlanabilir. Katılımcı sayısına göre birebir mi grup formatı mı uygun olduğunu birlikte belirleriz.",
  },
  {
    soru: "Hangi programlar kurumsal formatta sunulabilir?",
    cevap:
      "Meta Ads, sosyal medya yönetimi ve yapay zekâ eğitimlerinin üçü de kurumsal formata uyarlanır; birden fazla programı tek pakette birleştirmek de mümkün.",
  },
  {
    soru: "Yerinde eğitim sadece Ankara'da mı mümkün?",
    cevap:
      "Yerinde eğitim öncelikli olarak Ankara'da yapılır; şehir dışı için seyahat şartları ayrıca konuşulur. Uzaktan format tüm şehirlerde mümkün.",
  },
  {
    soru: "Fatura ve ödeme nasıl işliyor?",
    cevap:
      "Kurumsal fatura, e-fatura ve toplu/taksitli ödeme seçenekleri mevcut. Sözleşme ve fatura bilgileri ihtiyaç görüşmesinde netleşir.",
  },
  {
    soru: "Eğitim sonrası ekip için destek devam ediyor mu?",
    cevap:
      "Evet. Soru-cevap kanalı ekip için açık kalır; kampanya veya içerik gözden geçirme talepleri karşılanır.",
  },
];

/** Anahtar tek yerde: yazan aksiyon ile okuyan sorgu aynı dizeyi kullanmalı. */
export const KURUMSAL_AYAR_ANAHTARI = "kurumsal";

function sorulariDuzelt(deger: unknown): FaqItem[] {
  if (!Array.isArray(deger)) return [];
  return deger
    .map((s) => ({
      soru: typeof s?.soru === "string" ? s.soru.trim() : "",
      cevap: typeof s?.cevap === "string" ? s.cevap.trim() : "",
    }))
    .filter((s) => s.soru && s.cevap);
}

/**
 * Anonim anahtarla okunuyor: sayfa ziyaretçiye ve yöneticiye aynı içeriği
 * göstermeli. cache() aynı istekte tek sorguya indiriyor.
 */
export const getKurumsalSss = cache(async (): Promise<FaqItem[]> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("settings")
    .select("deger")
    .eq("anahtar", KURUMSAL_AYAR_ANAHTARI)
    .maybeSingle();

  if (error) {
    console.error("[kurumsal] SSS okunamadı:", error.message);
    return VARSAYILAN_KURUMSAL_SSS;
  }

  const sorular = sorulariDuzelt((data?.deger as { sss?: unknown } | null)?.sss);
  // Boş liste "hiç yazılmamış" demek; sıfır soru bir tercih değil.
  return sorular.length > 0 ? sorular : VARSAYILAN_KURUMSAL_SSS;
});
