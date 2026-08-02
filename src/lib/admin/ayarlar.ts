import { createClient } from "@/lib/supabase/server";
import type { AyarGrubu } from "@/components/admin/AyarFormu";

export const siteAyarGruplari: AyarGrubu[] = [
  {
    anahtar: "kurum",
    baslik: "Kurum ve fatura bilgileri",
    aciklama: "Faturalarda ve sözleşmelerde kullanılan resmî bilgiler.",
    alanlar: [
      { ad: "unvan", etiket: "Unvan", yerTutucu: "Ahmet Ekinci Akademi" },
      { ad: "vergiDairesi", etiket: "Vergi dairesi", yerTutucu: "Ankara / Çankaya" },
      { ad: "vergiNo", etiket: "Vergi / TC no" },
      { ad: "mersis", etiket: "MERSİS no" },
      { ad: "adres", etiket: "Adres", genis: true },
    ],
  },
  {
    anahtar: "iletisim",
    baslik: "İletişim",
    aciklama: "Sitede ve öğrencilere gönderilen e-postalarda görünen iletişim bilgileri.",
    alanlar: [
      { ad: "email", etiket: "E-posta", yerTutucu: "bilgi@ahmetekinci.com.tr" },
      { ad: "telefon", etiket: "Telefon" },
      { ad: "whatsapp", etiket: "WhatsApp numarası", ipucu: "Ülke koduyla, örn. 905xxxxxxxxx" },
      { ad: "instagram", etiket: "Instagram" },
      { ad: "linkedin", etiket: "LinkedIn" },
    ],
  },
  {
    anahtar: "egitim",
    baslik: "Eğitim varsayılanları",
    aciklama: "Yeni eğitim ve seans oluştururken kullanılan varsayılan değerler.",
    alanlar: [
      { ad: "seansSuresi", etiket: "Varsayılan seans süresi (dk)", yerTutucu: "60" },
      { ad: "toplantiLink", etiket: "Varsayılan toplantı bağlantısı", genis: true },
    ],
  },
];

export const entegrasyonGruplari: AyarGrubu[] = [
  {
    anahtar: "meta",
    baslik: "Meta",
    aciklama: "Pixel ve Conversions API bilgileri. Buraya girdiklerin kayıtlı tutulur; olay gönderimi ayrı bir geliştirme adımıdır.",
    alanlar: [
      { ad: "pixelId", etiket: "Pixel ID" },
      { ad: "datasetId", etiket: "Dataset / CAPI ID" },
      { ad: "capiToken", etiket: "Conversions API token", gizli: true, genis: true },
      { ad: "testKodu", etiket: "Test event kodu" },
    ],
  },
  {
    anahtar: "google",
    baslik: "Google",
    aciklama: "Analytics, Tag Manager ve Ads tanımlayıcıları.",
    alanlar: [
      { ad: "ga4", etiket: "GA4 Measurement ID", yerTutucu: "G-XXXXXXXXXX" },
      { ad: "gtm", etiket: "GTM Container ID", yerTutucu: "GTM-XXXXXXX" },
      { ad: "adsId", etiket: "Google Ads dönüşüm ID", yerTutucu: "AW-XXXXXXXXX" },
      { ad: "adsEtiket", etiket: "Dönüşüm etiketi" },
    ],
  },
  {
    anahtar: "formlar",
    baslik: "Formlar",
    aciklama:
      "Panelde gömülü gösterilen dış formlar. Cevaplar formun kendi servisinde kalır; panel yalnızca doldurulduğunu işaretler.",
    alanlar: [
      {
        ad: "onDegerlendirme",
        etiket: "Ön değerlendirme formu",
        yerTutucu: "https://tally.so/r/xxxxxx",
        ipucu: "Tally form bağlantısı. Boş bırakılırsa adım öğrenciye gösterilmez.",
        genis: true,
      },
    ],
  },
  {
    anahtar: "odeme",
    baslik: "Ödeme sağlayıcı",
    aciklama: "Online tahsilata geçtiğinde kullanılacak sağlayıcı bilgileri. Şu an ödemeler panele elle kaydediliyor.",
    alanlar: [
      { ad: "saglayici", etiket: "Sağlayıcı", yerTutucu: "iyzico / PayTR" },
      { ad: "magazaNo", etiket: "Mağaza / merchant no" },
      { ad: "apiAnahtari", etiket: "API anahtarı", gizli: true },
      { ad: "taksit", etiket: "Taksit seçenekleri", yerTutucu: "1 / 3 / 6 / 9" },
    ],
  },
];

/**
 * Havale bilgileri Entegrasyonlar'da değil Ödemeler sayfasında duruyor:
 * Entegrasyonlar üçüncü taraf servislerin tanımlayıcıları için, havale ise
 * ödemenin kendisi. Yönetici bunu ödemeleri işlerken arıyor.
 */
export const bankaGrubu: AyarGrubu = {
  anahtar: "banka",
  baslik: "Havale bilgileri",
  aciklama:
    "Öğrenci bu bilgileri kendi panelinde, Ödemelerim sayfasında görür ve ödemesini buraya yapar. Boş bıraktığın alan gösterilmez; hiçbiri doldurulmazsa kutu hiç çıkmaz.",
  alanlar: [
    { ad: "unvan", etiket: "Hesap sahibi", yerTutucu: "Ahmet Ekinci Akademi" },
    { ad: "banka", etiket: "Banka", yerTutucu: "Ziraat Bankası" },
    { ad: "iban", etiket: "IBAN", yerTutucu: "TR00 0000 0000 0000 0000 0000 00", genis: true },
    {
      ad: "aciklama",
      etiket: "Açıklama notu",
      ipucu: "Öğrenciye açıklama alanına ne yazacağını söyler.",
      genis: true,
    },
  ],
};

export async function getAyarlar(): Promise<Record<string, Record<string, string>>> {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("anahtar, deger");

  const sonuc: Record<string, Record<string, string>> = {};
  for (const row of data ?? []) {
    sonuc[row.anahtar] = (row.deger ?? {}) as Record<string, string>;
  }
  return sonuc;
}
