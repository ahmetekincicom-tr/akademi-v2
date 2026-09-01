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
    aciklama:
      "Pixel ve Conversions API. Pixel ID girildiği anda tarayıcı etiketi yayına giriyor; token da girilince sunucu olayları (satın alma, teklif formu, WhatsApp) gönderilmeye başlıyor.",
    alanlar: [
      {
        ad: "pixelId",
        etiket: "Pixel ID",
        // Dataset ID diye ayrı bir alan YOK: Meta ikisini birleştirdi, aynı
        // numara. İki alan bırakmak hangisinin doldurulacağı sorusunu
        // üretiyordu — özellikle iki mülk (ana site + panel) varken.
        ipucu: "Events Manager'daki veri kümesi numarası. Boş bırakılırsa pixel hiç yüklenmez.",
      },
      { ad: "capiToken", etiket: "Conversions API token", gizli: true, genis: true },
      {
        ad: "testKodu",
        etiket: "Test event kodu",
        ipucu:
          "Yalnızca doğrulama için. Doluyken olaylar Events Manager'ın test sekmesine düşer ve GERÇEK raporlara girmez — doğrulama bitince boşalt.",
      },
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
    baslik: "Kartla ödeme (iyzico)",
    aciklama:
      "Öğrencinin panelden kartla ödediği tutarlar iyzico üzerinden geçiyor. API anahtarları bilerek burada değil, sunucu ortam değişkenlerinde tutuluyor (IYZICO_API_KEY, IYZICO_SECRET_KEY, IYZICO_ORTAM) — panele erişen herkesin canlı tahsilat anahtarını görmesi doğru olmaz.",
    alanlar: [
      {
        ad: "taksit",
        etiket: "Taksit seçenekleri",
        yerTutucu: "1 / 3 / 6 / 9",
        ipucu: "Boş bırakılırsa yalnızca tek çekim açık olur. Bankanın izin vermediği taksit zaten görünmez.",
      },
      {
        ad: "sehir",
        etiket: "Fatura şehri",
        yerTutucu: "Ankara",
        ipucu: "iyzico her işlemde fatura adresi istiyor; öğrenciden adres toplamadığımız için kurum adresi gönderiliyor.",
      },
      {
        ad: "adres",
        etiket: "Fatura adresi",
        yerTutucu: "Kızılırmak Mah. Dumlupınar Bulvarı No: 3C1-160 Çankaya/Ankara",
        genis: true,
      },
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
