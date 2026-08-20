/**
 * Meta olaylarının kataloğu.
 *
 * Sisteme giren her Meta olayı burada adıyla duruyor. Katalog KODDA, tabloda
 * değil — e-posta akışlarıyla aynı gerekçe: yeni bir olay eklendiğinde kod
 * zaten değişiyor, tabloda da tutulsaydı iki yeri birlikte güncellemek
 * gerekirdi ve biri unutulduğunda ya olay yönetim ekranında hiç görünmez ya
 * da var olmayan bir olaya anahtar çıkardı. Tablo yalnızca "kapalı olanlar"
 * defteri.
 *
 * Adlar Meta'nın standart olay adları ve İNGİLİZCE kalmak zorunda: Meta
 * bunları tanıyor ve reklam optimizasyonunda ancak tanıdığı adı kullanabiliyor.
 * Türkçeleştirilseydi hepsi "özel olay" sayılırdı.
 *
 * Bu dosya sunucuya bağlı değil; yönetim ekranı (istemci bileşeni) de
 * başlıkları buradan okuyor.
 */

/**
 * Sepet YOK, doğrudan alışveriş de yok.
 *
 * Funnel şöyle işliyor: reklam → site ya da WhatsApp → telefonda ön görüşme →
 * hesap elle açılıyor → ödeme panelin içinde, bazen havaleyle. Bu yüzden
 * e-ticaret setinin ortası (AddToCart) buraya hiç oturmuyor ve zorlanmadı.
 * Onun yerine funnel'ın gerçek adımları var: Contact (WhatsApp'a tıklama) ve
 * Lead (form).
 */
export const OLAYLAR = [
  {
    anahtar: "PageView",
    baslik: "Sayfa görüntüleme",
    aciklama: "Tanıtım sayfalarında tarayıcıdan gönderilir. Kitle oluşturmanın temeli.",
    kaynak: "tarayici",
    /**
     * Aggregated Event Measurement sırası.
     *
     * Meta, iOS kullanıcıları için alan adı başına en fazla 8 olayı öncelik
     * sırasıyla sayıyor. Sıra yanlışsa iPhone'dan gelen satışlar raporda
     * kayboluyor — bu yüzden numara katalogda duruyor, Business Manager'daki
     * ayarın kaynağı burası.
     */
    oncelik: 7,
  },
  {
    anahtar: "ViewContent",
    baslik: "Program incelendi",
    aciklama: "Bir eğitim sayfası açıldığında. Hangi programın ilgi çektiğini gösterir.",
    kaynak: "tarayici",
    oncelik: 6,
  },
  {
    anahtar: "Contact",
    baslik: "WhatsApp'a tıkladı",
    aciklama:
      "Dışarı çıkan WhatsApp bağlantısına tıklandığında sunucudan gönderilir. Bu funnel'da formdan daha sık gerçekleşen ilk temas.",
    kaynak: "sunucu",
    oncelik: 3,
  },
  {
    anahtar: "Lead",
    baslik: "Teklif formu dolduruldu",
    aciklama: "İletişim veya teklif formu kaydedildiğinde. Reklam optimizasyonunun asıl hedefi bu.",
    kaynak: "sunucu",
    oncelik: 2,
  },
  {
    anahtar: "CompleteRegistration",
    baslik: "Panel hesabı açıldı",
    aciklama: "Katılımcı hesabı oluşturulduğunda. Görüşmenin anlaşmaya döndüğü an.",
    kaynak: "sunucu",
    oncelik: 4,
  },
  {
    anahtar: "InitiateCheckout",
    baslik: "Kartla ödeme başlatıldı",
    aciklama: "iyzico ekranına gidildiğinde. Tamamlanmayan ödemeleri görmenin tek yolu.",
    kaynak: "sunucu",
    oncelik: 5,
  },
  {
    anahtar: "Purchase",
    baslik: "Ödeme alındı",
    aciklama:
      "Ödeme kaydı 'odendi'ye geçtiğinde — kartla ya da havaleyle. Tutar ve para birimi bu olayla gidiyor.",
    kaynak: "sunucu",
    oncelik: 1,
  },
  {
    anahtar: "Schedule",
    baslik: "Görüşme planlandı",
    aciklama: "Danışmanlık görüşmesine saat verildiğinde.",
    kaynak: "sunucu",
    oncelik: 8,
  },
] as const;

export type MetaOlay = (typeof OLAYLAR)[number]["anahtar"];
export type OlayTanimi = (typeof OLAYLAR)[number];

export const OLAY_BASLIK: Record<string, string> = Object.fromEntries(
  OLAYLAR.map((o) => [o.anahtar, o.baslik]),
);

/** Yönetim ekranındaki durum etiketleri. Tek yerde dursun ki ekranla günlük ayrışmasın. */
export const DURUM_ETIKET: Record<string, string> = {
  bekliyor: "Sırada",
  gonderildi: "Gönderildi",
  basarisiz: "Başarısız",
  kapali: "Kapalı",
  izinsiz: "İzin yok",
  yapilandirilmadi: "Yapılandırılmadı",
  vazgecildi: "Vazgeçildi",
};
