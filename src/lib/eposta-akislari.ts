/**
 * E-posta akışlarının kataloğu.
 *
 * Sistemden çıkan her bildirim burada adıyla duruyor. Katalog KODDA, tabloda
 * değil: yeni bir mail eklendiğinde kod zaten değişiyor. Katalog da
 * veritabanında olsaydı iki yeri birlikte güncellemek gerekirdi ve biri
 * unutulduğunda ya akış yönetim ekranında hiç görünmez ya da var olmayan bir
 * maile anahtar çıkardı. Tablo yalnızca "kapalı olanlar" defteri.
 *
 * Supabase'in kendi mailleri (şifre sıfırlama, e-posta doğrulama) burada YOK
 * ve olamaz: onları biz göndermiyoruz, GoTrue gönderiyor. Onların ayarı
 * Supabase panelinde.
 */

export type EpostaAkisi = (typeof AKISLAR)[number]["anahtar"];

export type AkisTanimi = {
  anahtar: string;
  baslik: string;
  aciklama: string;
  /** Kime gidiyor; ekranda iki grup hâlinde listeleniyor. */
  kime: "katilimci" | "yonetim";
  /**
   * Kapatılamayan akış. İşleyişi doğrudan bozacak ya da tanılama için gereken
   * mailler kapatılamıyor — kapatılabilir olsaydı, kapalı olduğu unutulup
   * "sistem bozuldu" diye aranan şey aslında bu anahtar olurdu.
   */
  zorunlu?: boolean;
};

export const AKISLAR = [
  /* ---------------------------------------------------- katılımcıya --- */
  {
    anahtar: "hosgeldin",
    baslik: "Hoş geldin e-postası",
    aciklama: "Yeni üye ilk kez panele girdiğinde gönderilir.",
    kime: "katilimci",
  },
  {
    anahtar: "odeme-acildi",
    baslik: "Ödeme tanımlandı",
    aciklama: "Panelden bir ödeme kaydı açıldığında katılımcıya haber verir.",
    kime: "katilimci",
  },
  {
    anahtar: "odeme-tamamlandi",
    baslik: "Ödeme alındı",
    aciklama: "Ödeme tamamlandığında teşekkür ve ön değerlendirme daveti.",
    kime: "katilimci",
  },
  {
    /*
      Danışmanlık ödemesi eğitim ödemesinden AYRI akış.

      İkisi de "odeme-tamamlandi" anahtarıyla gidiyordu ama söyledikleri
      farklı: eğitimde sıradaki adım ön değerlendirme, danışmanlıkta görüşme
      saatinin belirlenmesi. Metinler panelden yazılabilir hâle gelince tek
      anahtar ikisini birbirinin üstüne yazardı — danışmanlık ödeyen kişiye
      "ön değerlendirmeni doldur" demek olurdu.
    */
    anahtar: "danismanlik-odendi",
    baslik: "Danışmanlık ödemesi alındı",
    aciklama: "Danışmanlık ücreti tahsil edildiğinde katılımcıya gönderilir.",
    kime: "katilimci",
  },
  {
    anahtar: "egitim-kaydi",
    baslik: "Ders kayıtları paylaşıldı",
    aciklama: "Birebir eğitimde kayıt klasörü paylaşıldığında gönderilir.",
    kime: "katilimci",
  },
  {
    anahtar: "oturum-planlandi",
    baslik: "Ders planlandı",
    aciklama: "Birebir eğitim takvimine yeni bir oturum eklendiğinde gönderilir.",
    kime: "katilimci",
  },
  {
    anahtar: "koltuk-atandi",
    baslik: "Eğitime eklendin",
    aciklama: "Kurumsal bir ödemede koltuk atandığında katılımcıya haber verir.",
    kime: "katilimci",
  },
  {
    anahtar: "gorusme-planlandi",
    baslik: "Danışmanlık planlandı",
    aciklama: "Danışmanlık görüşmesine tarih ve saat verildiğinde gönderilir.",
    kime: "katilimci",
  },
  {
    anahtar: "on-degerlendirme-hatirlatma",
    baslik: "Ön değerlendirme hatırlatması",
    aciklama:
      "Erişimi açıldıktan sonra testi hâlâ doldurmayana bir kez hatırlatır. Aynı kişiye ikinci kez gitmiyor.",
    kime: "katilimci",
  },
  {
    anahtar: "destek-yanit",
    baslik: "Destek talebine yanıt",
    aciklama: "Bir destek talebine cevap yazdığında katılımcıya bildirilir.",
    kime: "katilimci",
  },

  /* ------------------------------------------------------- yönetime --- */
  {
    anahtar: "yeni-uyelik",
    baslik: "Yeni üyelik",
    aciklama: "Panele yeni bir üye katıldığında sana haber verir.",
    kime: "yonetim",
  },
  {
    anahtar: "iletisim-formu",
    baslik: "Site iletişim formu",
    aciklama: "Siteden gelen iletişim ve teklif formları.",
    kime: "yonetim",
  },
  {
    anahtar: "destek-talebi",
    baslik: "Yeni destek talebi",
    aciklama: "Katılımcı soru-cevap bölümünden bir talep açtığında.",
    kime: "yonetim",
  },
  {
    anahtar: "danismanlik-talebi",
    baslik: "Danışmanlık talebi",
    aciklama: "Katılımcı danışmanlık görüşmesi talep ettiğinde.",
    kime: "yonetim",
  },
  {
    anahtar: "havale-bildirimi",
    baslik: "Havale bildirimi",
    aciklama: "Katılımcı “havaleyi yaptım” dediğinde. Tahsilatı doğrulamanı hatırlatır.",
    kime: "yonetim",
    // Kapalıyken havale yapan kişinin ödemesi işaretlenmeden bekler.
    zorunlu: true,
  },
  {
    anahtar: "odeme-sonucu",
    baslik: "Kartlı ödeme sonucu",
    aciklama: "iyzico dönüşünde tahsilatın sonucu. Başarısız denemeler de dahil.",
    kime: "yonetim",
    zorunlu: true,
  },
  {
    anahtar: "hesap-silme",
    baslik: "Hesap silme talebi",
    aciklama: "Katılımcı hesabının silinmesini istediğinde. Yasal süre işlemeye başlar.",
    kime: "yonetim",
    zorunlu: true,
  },
  {
    anahtar: "sistem-hatasi",
    baslik: "Sistem hatası",
    aciklama:
      "Canlıda bir sunucu hatası oluştuğunda sana haber verir. Aynı hata 15 dakika boyunca tekrar bildirilmez.",
    kime: "yonetim",
    // Kapatılabilir olsaydı, kapalı olduğu unutulduğunda sistemin sessizce
    // bozulduğu tek durum bu olurdu.
    zorunlu: true,
  },
  {
    anahtar: "tani-testi",
    baslik: "Test e-postası",
    aciklama: "Entegrasyonlar ekranındaki “test gönder” düğmesi.",
    kime: "yonetim",
    zorunlu: true,
  },
] as const satisfies readonly AkisTanimi[];

export const AKIS_ADI: Record<string, string> = Object.fromEntries(
  AKISLAR.map((a) => [a.anahtar, a.baslik]),
);

export const DURUM_ETIKET: Record<string, string> = {
  gonderildi: "Gönderildi",
  basarisiz: "Başarısız",
  kapali: "Kapalı",
  yapilandirilmadi: "Yapılandırılmadı",
};
