export type CurriculumModule = {
  baslik: string;
  meta: string;
  dersler: { ad: string; sure: string }[];
};

export type FaqItem = { soru: string; cevap: string };
export type Testimonial = { metin: string; isim: string; rol: string };

export type Course = {
  slug: string;
  etiket: string;
  sure: string;
  modul: string;
  dersSayisi: number;
  baslik: string;
  baslikVurgu: string;
  aciklama: string;
  heroAciklama: string;
  maddeler: string[];
  hizli: { etiket: string; deger: string }[];
  kazanimlar: string[];
  modules: CurriculumModule[];
  uygun: string[];
  uygunDegil: string[];
  format: { etiket: string; deger: string; not: string }[];
  yorumlar: Testimonial[];
  sss: FaqItem[];
  kutuSatir: { etiket: string; deger: string }[];
  online: boolean;
  yuzYuze: boolean;
};

export const egitmenStats = [
  { n: "5 yıl", t: "birebir eğitim" },
  { n: "400+", t: "katılımcı" },
  { n: "Ankara", t: "yüz yüze & online" },
];

export const kutuNot = [
  "Ders kayıtları ve dokümanlar üye alanınızda",
  "Ömür boyu soru-cevap desteği",
  "Bireysel ve kurumsal faturalandırma",
];

export const courses: Course[] = [
  {
    slug: "meta-business",
    etiket: "Meta Ads",
    sure: "15 saat",
    modul: "6 modül",
    dersSayisi: 24,
    baslik: "Birebir Meta Business Eğitimi",
    baslikVurgu: "Meta Business",
    aciklama:
      "Reklam hesabı kurulumundan ölçeklemeye kadar Meta Ads'in tamamı; kendi bütçeniz ve kendi kampanyalarınız üzerinden.",
    heroAciklama:
      "Reklam hesabı kurulumundan bütçe ölçeklemeye kadar Meta Ads'in tamamı — kendi hesabınız, kendi kampanyalarınız ve kendi bütçeniz üzerinde çalışarak.",
    maddeler: ["Hesap, piksel ve dönüşüm kurulumu", "Hedef kitle ve kreatif testleri", "Raporlama ve bütçe ölçekleme"],
    hizli: [
      { etiket: "Süre", deger: "15 saat" },
      { etiket: "Format", deger: "Birebir canlı" },
      { etiket: "Modül", deger: "6 modül · 24 ders" },
      { etiket: "Seviye", deger: "Sıfırdan ileri" },
    ],
    kazanimlar: [
      "Business Manager'ı sıfırdan doğru yapıda kurmak",
      "Pixel ve Dönüşüm API'si ile ölçümlemeyi güvene almak",
      "Kitle haritanızı çıkarıp doygunluğu yönetmek",
      "Kreatif ve mesaj testlerini disiplinli kurgulamak",
      "Bütçeyi kontrollü biçimde ölçeklemek",
      "Raporu yorumlayıp aylık optimizasyon rutini işletmek",
    ],
    modules: [
      {
        baslik: "Meta ekosistemine giriş",
        meta: "3 ders · 2 saat",
        dersler: [
          { ad: "Business Manager yapısı ve varlık ilişkileri", sure: "35 dk" },
          { ad: "Sayfa, reklam hesabı ve yetkilendirme", sure: "40 dk" },
          { ad: "Ödeme yöntemleri, limitler ve fatura yönetimi", sure: "45 dk" },
        ],
      },
      {
        baslik: "Ölçümleme ve altyapı kurulumu",
        meta: "4 ders · 2,5 saat",
        dersler: [
          { ad: "Meta Pixel kurulumu ve doğrulama", sure: "40 dk" },
          { ad: "Dönüşüm API'si ve olay eşleştirme", sure: "45 dk" },
          { ad: "Alan adı doğrulama ve toplam olay ölçümü", sure: "35 dk" },
          { ad: "Katalog ve e-ticaret entegrasyonu", sure: "30 dk" },
        ],
      },
      {
        baslik: "Hedef kitle stratejisi",
        meta: "4 ders · 2,5 saat",
        dersler: [
          { ad: "Kayıtlı, özel ve benzer hedef kitleler", sure: "45 dk" },
          { ad: "Kitle kesişimi ve doygunluk yönetimi", sure: "35 dk" },
          { ad: "Sektörünüze göre kitle haritası çıkarma", sure: "40 dk" },
          { ad: "Yeniden pazarlama akışları", sure: "30 dk" },
        ],
      },
      {
        baslik: "Kreatif ve mesaj testleri",
        meta: "4 ders · 2,5 saat",
        dersler: [
          { ad: "Durduran kreatif: format ve ilk 3 saniye", sure: "45 dk" },
          { ad: "Reklam metni kalıpları ve teklif dili", sure: "35 dk" },
          { ad: "A/B test kurulumu ve okuma", sure: "40 dk" },
          { ad: "UGC ve içerik üretim akışı", sure: "30 dk" },
        ],
      },
      {
        baslik: "Kampanya kurulumu ve optimizasyon",
        meta: "5 ders · 3 saat",
        dersler: [
          { ad: "Kampanya hedefi seçimi ve yapı kurulumu", sure: "45 dk" },
          { ad: "Advantage+ ve manuel kampanya karşılaştırması", sure: "40 dk" },
          { ad: "Teklif stratejileri ve bütçe dağıtımı", sure: "35 dk" },
          { ad: "Öğrenme aşaması ve müdahale zamanlaması", sure: "30 dk" },
          { ad: "Kendi kampanyanızın canlı kurulumu", sure: "45 dk" },
        ],
      },
      {
        baslik: "Raporlama ve ölçekleme",
        meta: "4 ders · 2,5 saat",
        dersler: [
          { ad: "Ads Manager rapor düzeni ve metrik seçimi", sure: "40 dk" },
          { ad: "ROAS, CPA ve artımlı ölçüm okuma", sure: "40 dk" },
          { ad: "Dikey ve yatay ölçekleme senaryoları", sure: "40 dk" },
          { ad: "Aylık optimizasyon rutini kurma", sure: "30 dk" },
        ],
      },
    ],
    uygun: [
      "Kendi işinin reklamlarını ajansa bırakmadan yönetmek isteyen işletme sahipleri",
      "Reklam performansını kendi hesabında büyütmek isteyen e-ticaret satıcıları",
      "Meta tarafını derinleştirmek isteyen ajans çalışanları",
      "Reklam uzmanlığına geçiş yapmak isteyen profesyoneller",
    ],
    uygunDegil: [
      "Kayıtlı video izleyip kendi hızında ilerlemek isteyenler",
      "Reklam hesabını başkasına devredip hiç ilgilenmek istemeyenler",
      "Tek seansta “garantili sonuç” arayanlar",
    ],
    format: [
      { etiket: "Toplam süre", deger: "15 saat", not: "Seans başına 2–3 saat" },
      { etiket: "Katılımcı", deger: "1 kişi", not: "Grup yok, tamamen size özel" },
      { etiket: "Yer", deger: "Online veya Ankara", not: "Yüz yüze seçeneği mevcut" },
      { etiket: "Takvim", deger: "Esnek", not: "Hafta içi / hafta sonu" },
      { etiket: "Materyal", deger: "Kayıt + doküman", not: "Panele otomatik eklenir" },
      { etiket: "Destek", deger: "Süresiz", not: "Soru-cevap kanalı" },
    ],
    yorumlar: [
      {
        metin:
          "Meta reklamları konusunda kafamdaki birçok soru işareti bu eğitim sayesinde netleşti. Anlattıkları sadece teoride kalmadı; pratikte nasıl uygulanacağını da net gösterdi.",
        isim: "Burçin Uğur",
        rol: "e-Ticaret Satıcısı",
      },
      {
        metin: "Reklam eğitimi desteği almaya başladıktan sonra satışlarımda ve takipçi sayımda gözle görülür bir artış oldu.",
        isim: "Ahmet Bahçeci",
        rol: "e-Ticaret Satıcısı",
      },
      { metin: "Hocayla çalışmak; neyi, nasıl ve neden yaptığımı daha net kavramamı sağladı.", isim: "Ege Kızıltepe", rol: "Dijital Pazarlama Uzmanı" },
      {
        metin:
          "Sorduğum her soruya net, anlaşılır ve güncel bilgilerle desteklenen cevaplar aldım. Hem teorik hem pratik açıdan faydalı bir eğitim oldu.",
        isim: "Yasemin Turan",
        rol: "Marketing Communication Specialist",
      },
    ],
    sss: [
      {
        soru: "Reklam bütçesi eğitim ücretine dahil mi?",
        cevap:
          "Hayır. Dersler kendi reklam hesabınız üzerinde yapıldığı için harcama size ait kalır. Küçük bir test bütçesiyle de ilerlemek mümkün.",
      },
      {
        soru: "Hiç reklam vermemiş biri katılabilir mi?",
        cevap:
          "Evet. Sıfırdan başlayan katılımcılarda ilk iki modülün ağırlığı artırılır, ileri seviyede ise doğrudan optimizasyon ve ölçeklemeye odaklanılır.",
      },
      {
        soru: "Dersler nasıl planlanıyor?",
        cevap:
          "Takvim birlikte belirlenir. Genelde haftada 2 seans, seans başına 2–3 saat şeklinde ilerliyoruz; yoğun programlar için hafta sonu da mümkün.",
      },
      { soru: "Ders kayıtlarına erişebilir miyim?", cevap: "Evet. Her seansın kaydı, kullanılan şablonlar ve kontrol listeleri üye alanınızdaki program sayfasına eklenir." },
      { soru: "Eğitim sonrası destek ne kadar sürüyor?", cevap: "Süre sınırı koymuyoruz. Soru-cevap kanalına erişiminiz kalır; kampanyalarınızı gerektiğinde birlikte gözden geçiririz." },
      { soru: "Sertifika veriliyor mu?", cevap: "Program tamamlandığında katılım sertifikanız üye alanından indirilebilir hale gelir." },
    ],
    kutuSatir: [
      { etiket: "Süre", deger: "15 saat · 6 modül" },
      { etiket: "Format", deger: "Birebir canlı" },
      { etiket: "Yer", deger: "Online / Ankara" },
      { etiket: "Ödeme", deger: "Kart, taksit veya havale" },
    ],
    online: true,
    yuzYuze: true,
  },
  {
    slug: "sosyal-medya",
    etiket: "Sosyal medya",
    sure: "22 saat",
    modul: "8 modül",
    dersSayisi: 31,
    baslik: "Birebir Sosyal Medya Eğitimi",
    baslikVurgu: "Sosyal Medya",
    aciklama: "İçerik üretiminden topluluk yönetimine, bir markanın sosyal medyasını baştan sona yürütme pratiği.",
    heroAciklama:
      "İçerik stratejisinden prodüksiyona, topluluk yönetiminden büyüme ölçümüne kadar bir markanın sosyal medyasını uçtan uca yürütme pratiği — kendi hesabınız üzerinde çalışarak.",
    maddeler: ["İçerik stratejisi ve takvim kurulumu", "Çekim, kurgu ve metin akışı", "Büyüme ölçümü ve raporlama"],
    hizli: [
      { etiket: "Süre", deger: "22 saat" },
      { etiket: "Format", deger: "Birebir canlı" },
      { etiket: "Modül", deger: "8 modül · 31 ders" },
      { etiket: "Seviye", deger: "Sıfırdan ileri" },
    ],
    kazanimlar: [
      "Marka sesine uygun bir içerik stratejisi kurmak",
      "Aylık içerik takvimini üretim akışıyla birlikte planlamak",
      "Telefonla çekim ve kurguyla durduran kısa video üretmek",
      "Etkileşimi artıran metin ve başlık kalıplarını kullanmak",
      "Topluluğu büyüten yorum ve mesaj yönetimi rutini kurmak",
      "Büyüme verilerini okuyup aylık optimizasyon yapmak",
    ],
    modules: [
      {
        baslik: "Marka ve içerik stratejisi temelleri",
        meta: "4 ders · 2 saat",
        dersler: [
          { ad: "Marka sesi ve içerik sütunlarını belirleme", sure: "30 dk" },
          { ad: "Hedef kitle ve platform seçimi", sure: "35 dk" },
          { ad: "Rakip ve ilham hesabı analizi", sure: "30 dk" },
          { ad: "İçerik stratejisi dokümanının kurulması", sure: "35 dk" },
        ],
      },
      {
        baslik: "İçerik takvimi ve prodüksiyon akışı",
        meta: "4 ders · 2 saat",
        dersler: [
          { ad: "Aylık içerik takvimi şablonu kurulumu", sure: "35 dk" },
          { ad: "Haftalık üretim ve onay akışı", sure: "30 dk" },
          { ad: "Sezonluk ve kampanya bazlı planlama", sure: "35 dk" },
          { ad: "İçerik bankası ve arşiv düzeni", sure: "30 dk" },
        ],
      },
      {
        baslik: "Görsel ve video prodüksiyon",
        meta: "4 ders · 2,5 saat",
        dersler: [
          { ad: "Telefonla çekim temelleri: ışık ve kadraj", sure: "40 dk" },
          { ad: "Reels ve kısa video kurgu akışı", sure: "45 dk" },
          { ad: "Kapak görseli ve marka şablonları", sure: "35 dk" },
          { ad: "Ses, müzik ve altyazı kullanımı", sure: "30 dk" },
        ],
      },
      {
        baslik: "Metin yazarlığı ve marka sesi",
        meta: "4 ders · 2 saat",
        dersler: [
          { ad: "Durduran başlık ve hook kalıpları", sure: "35 dk" },
          { ad: "Caption yazımı ve CTA dili", sure: "30 dk" },
          { ad: "Hikaye anlatımıyla marka bağı kurma", sure: "35 dk" },
          { ad: "Marka ses ve ton rehberi oluşturma", sure: "30 dk" },
        ],
      },
      {
        baslik: "Topluluk yönetimi ve etkileşim",
        meta: "4 ders · 2 saat",
        dersler: [
          { ad: "Yorum ve DM yönetim rutini", sure: "30 dk" },
          { ad: "Kriz ve olumsuz yorum yönetimi", sure: "35 dk" },
          { ad: "Topluluk etkileşimini artıran formatlar", sure: "30 dk" },
          { ad: "Story ve canlı yayınla bağ kurma", sure: "35 dk" },
        ],
      },
      {
        baslik: "Influencer ve iş birlikleri",
        meta: "3 ders · 1,5 saat",
        dersler: [
          { ad: "Doğru iş birliği ortağını seçme", sure: "35 dk" },
          { ad: "Brief hazırlama ve sözleşme temelleri", sure: "30 dk" },
          { ad: "İş birliği performansını ölçme", sure: "30 dk" },
        ],
      },
      {
        baslik: "Reklam entegrasyonu ve büyüme",
        meta: "4 ders · 2,5 saat",
        dersler: [
          { ad: "Organik içeriği reklamla destekleme", sure: "35 dk" },
          { ad: "Takipçi ve etkileşim kampanyaları kurma", sure: "40 dk" },
          { ad: "İçerik testleriyle reklam performansını artırma", sure: "35 dk" },
          { ad: "Bütçeyi organik ve reklam arasında dengeleme", sure: "30 dk" },
        ],
      },
      {
        baslik: "Ölçümleme, raporlama ve optimizasyon",
        meta: "4 ders · 2 saat",
        dersler: [
          { ad: "Platform analitiklerini okuma", sure: "35 dk" },
          { ad: "Aylık büyüme raporu hazırlama", sure: "30 dk" },
          { ad: "İçerik performansına göre takvimi güncelleme", sure: "35 dk" },
          { ad: "Uzun vadeli büyüme rutini kurma", sure: "30 dk" },
        ],
      },
    ],
    uygun: [
      "Sosyal medyasını ajansa bırakmadan kendi yönetmek isteyen marka sahipleri",
      "İçerik üretim sürecini düzene sokmak isteyen ekipler",
      "Takipçiden gerçek etkileşime geçmek isteyen işletmeler",
      "Sosyal medya yöneticiliğine geçiş yapmak isteyen profesyoneller",
    ],
    uygunDegil: [
      "Hazır şablon indirip tek başına ilerlemek isteyenler",
      "Sosyal medyayı tamamen dışarıya devretmek isteyenler",
      "Bir haftada viral olmayı garanti arayanlar",
    ],
    format: [
      { etiket: "Toplam süre", deger: "22 saat", not: "Seans başına 2–3 saat" },
      { etiket: "Katılımcı", deger: "1 kişi", not: "Grup yok, tamamen size özel" },
      { etiket: "Yer", deger: "Online veya Ankara", not: "Yüz yüze seçeneği mevcut" },
      { etiket: "Takvim", deger: "Esnek", not: "Hafta içi / hafta sonu" },
      { etiket: "Materyal", deger: "Kayıt + doküman", not: "Panele otomatik eklenir" },
      { etiket: "Destek", deger: "Süresiz", not: "Soru-cevap kanalı" },
    ],
    yorumlar: [
      {
        metin:
          "Piyasadaki eğitimlerin çoğunu almış biri olarak söyleyebilirim: öğrendiklerimi uygulamaya döktüm ve sonuçlarını almaya başladım bile.",
        isim: "Sema Şengün",
        rol: "Sosyal Medya Yöneticisi",
      },
      {
        metin: "İçerik takvimini kurduktan sonra üretim sürecimiz ilk defa düzenli işledi. Artık son dakika telaşı yok.",
        isim: "İpek Demir",
        rol: "Marka Sahibi",
      },
      {
        metin: "Kısa video kurgusunu öğrendikten sonra izlenme oranlarımız iki katına çıktı.",
        isim: "Caner Yıldız",
        rol: "e-Ticaret Satıcısı",
      },
    ],
    sss: [
      {
        soru: "Kendi telefonumla mı çekim yapacağım?",
        cevap: "Evet. Ekstra ekipmana gerek yok; telefonla profesyonel görünüm elde etmeyi öğreniyoruz. İstersen ileri seviye ekipman önerileri de paylaşırız.",
      },
      {
        soru: "Sosyal medya yönetimini ajansa vermek yerine bunu mu öğrenmeliyim?",
        cevap: "İkisi de mümkün; program hem kendi yönetmek hem de ajansı doğru yönlendirmek isteyenler için kurulur.",
      },
      { soru: "Kaç platforma odaklanıyoruz?", cevap: "Ağırlık Instagram ve TikTok'ta; markanıza göre LinkedIn veya diğer platformlar da eklenebilir." },
      { soru: "Reklam bütçesi bu eğitime dahil mi?", cevap: "Hayır, organik içerik ve reklamla destekleme stratejisi öğretiliyor; reklam harcaması size ait." },
      { soru: "Program sonunda elimde ne olacak?", cevap: "Kendi markanıza özel içerik stratejisi dokümanı, şablonlar ve aylık çalışma rutini." },
    ],
    kutuSatir: [
      { etiket: "Süre", deger: "22 saat · 8 modül" },
      { etiket: "Format", deger: "Birebir canlı" },
      { etiket: "Yer", deger: "Online / Ankara" },
      { etiket: "Ödeme", deger: "Kart, taksit veya havale" },
    ],
    online: true,
    yuzYuze: true,
  },
  {
    slug: "yapay-zeka",
    etiket: "Yapay zekâ",
    sure: "7 saat",
    modul: "4 modül",
    dersSayisi: 12,
    baslik: "Pazarlamada Yapay Zekâ Eğitimi",
    baslikVurgu: "Yapay Zekâ",
    aciklama: "Pazarlama işinizi hızlandıran yapay zekâ araçları: içerik, görsel, analiz ve otomasyon akışları.",
    heroAciklama:
      "İçerik, görsel, analiz ve otomasyon akışlarında yapay zekâ araçlarını pazarlama işinize uygulama pratiği — kendi kampanyalarınız ve kendi verileriniz üzerinde çalışarak.",
    maddeler: ["Metin ve görsel üretim akışları", "Veriden içgörü çıkarma", "Tekrar eden işlerin otomasyonu"],
    hizli: [
      { etiket: "Süre", deger: "7 saat" },
      { etiket: "Format", deger: "Birebir canlı" },
      { etiket: "Modül", deger: "4 modül · 12 ders" },
      { etiket: "Seviye", deger: "Sıfırdan ileri" },
    ],
    kazanimlar: [
      "Pazarlama işinize uygun yapay zekâ araçlarını seçmek",
      "İçerik ve görsel üretim akışlarını hızlandırmak",
      "Veriden hızlı içgörü çıkarmak",
      "Tekrar eden işleri otomasyonla devretmek",
      "Prompt yazımıyla tutarlı ve marka sesine uygun çıktı almak",
      "Araçları birbirine bağlayan uçtan uca bir akış kurmak",
    ],
    modules: [
      {
        baslik: "Pazarlamada yapay zekâya giriş",
        meta: "3 ders · 2 saat",
        dersler: [
          { ad: "Pazarlama işine uygun araç seçimi", sure: "35 dk" },
          { ad: "Prompt yazımının temel kuralları", sure: "40 dk" },
          { ad: "Marka sesine uygun çıktı almak için ayar", sure: "35 dk" },
        ],
      },
      {
        baslik: "İçerik ve görsel üretim akışları",
        meta: "3 ders · 2 saat",
        dersler: [
          { ad: "Metin üretiminde prompt kütüphanesi kurma", sure: "40 dk" },
          { ad: "Görsel üretim araçlarıyla kreatif üretimi", sure: "40 dk" },
          { ad: "Video ve ses araçlarıyla içerik zenginleştirme", sure: "35 dk" },
        ],
      },
      {
        baslik: "Veri analizi ve içgörü çıkarma",
        meta: "3 ders · 1,5 saat",
        dersler: [
          { ad: "Kampanya verisini yapay zekâyla özetleme", sure: "30 dk" },
          { ad: "Rakip ve pazar araştırmasını hızlandırma", sure: "30 dk" },
          { ad: "Raporlardan aksiyon maddesi çıkarma", sure: "30 dk" },
        ],
      },
      {
        baslik: "Otomasyon ve iş akışı kurulumu",
        meta: "3 ders · 1,5 saat",
        dersler: [
          { ad: "Tekrar eden işleri otomasyona bağlama", sure: "35 dk" },
          { ad: "Araçları birbirine entegre etme", sure: "30 dk" },
          { ad: "Kendi otomasyon akışınızı kurma", sure: "30 dk" },
        ],
      },
    ],
    uygun: [
      "Yapay zekâ araçlarını pazarlama işine nasıl uygulayacağını bilmeyen işletme sahipleri",
      "İçerik üretim sürecini hızlandırmak isteyen pazarlama ekipleri",
      "Raporlama ve analiz işlerini kısaltmak isteyen ajans çalışanları",
      "Tekrar eden operasyonel işleri otomatikleştirmek isteyen profesyoneller",
    ],
    uygunDegil: [
      "Yapay zekâ araçlarını hiç kullanmadan yalnızca teorik bilgi arayanlar",
      "Tek bir araca bağlı kalıp derinlemesine uzmanlaşmak isteyenler",
      "İşlerini tamamen otomasyona devredip hiç kontrol etmek istemeyenler",
    ],
    format: [
      { etiket: "Toplam süre", deger: "7 saat", not: "Seans başına 2–3 saat" },
      { etiket: "Katılımcı", deger: "1 kişi", not: "Grup yok, tamamen size özel" },
      { etiket: "Yer", deger: "Online veya Ankara", not: "Yüz yüze seçeneği mevcut" },
      { etiket: "Takvim", deger: "Esnek", not: "Hafta içi / hafta sonu" },
      { etiket: "Materyal", deger: "Kayıt + doküman", not: "Panele otomatik eklenir" },
      { etiket: "Destek", deger: "Süresiz", not: "Soru-cevap kanalı" },
    ],
    yorumlar: [
      {
        metin: "Prompt yazımını öğrendikten sonra içerik üretim sürem yarıya indi.",
        isim: "Deniz Aksoy",
        rol: "Pazarlama Uzmanı",
      },
      {
        metin: "Raporlama işlerini otomasyona bağladıktan sonra haftada en az 5 saat kazandım.",
        isim: "Elif Sancak",
        rol: "e-Ticaret Satıcısı",
      },
    ],
    sss: [
      {
        soru: "Yapay zekâ araçlarına abonelik ücreti eğitime dahil mi?",
        cevap: "Hayır, kullanılan araçların çoğunda ücretsiz plan yeterli; ileri seviye ihtiyaçlarda hangi ücretli plana geçmeniz gerektiğini birlikte değerlendiriyoruz.",
      },
      { soru: "Teknik bilgim yok, katılabilir miyim?", cevap: "Evet, kod yazmıyoruz; araçları tarayıcı üzerinden kullanmayı öğreniyoruz." },
      { soru: "Hangi araçları kullanıyoruz?", cevap: "Metin, görsel ve otomasyon için güncel, yaygın kullanılan araçlar; program sırasında ihtiyacınıza göre güncellenir." },
      {
        soru: "Program sonunda otomasyon kurulu kalıyor mu?",
        cevap: "Evet, kendi hesabınızda kurduğumuz akışlar sizinle kalır; üye alanındaki dokümanlarla takip edebilirsiniz.",
      },
      {
        soru: "Diğer eğitimlerle birlikte alınabilir mi?",
        cevap: "Evet, özellikle Meta Ads veya Sosyal Medya eğitimleriyle birlikte alındığında raporlama ve üretim akışları daha hızlı kurulur.",
      },
    ],
    kutuSatir: [
      { etiket: "Süre", deger: "7 saat · 4 modül" },
      { etiket: "Format", deger: "Birebir canlı" },
      { etiket: "Yer", deger: "Online / Ankara" },
      { etiket: "Ödeme", deger: "Kart, taksit veya havale" },
    ],
    online: true,
    yuzYuze: true,
  },
];

export function getCourseBySlug(slug: string) {
  return courses.find((c) => c.slug === slug);
}
