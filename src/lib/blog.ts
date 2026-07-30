export type BlogPost = {
  slug: string;
  baslik: string;
  ozet: string;
  etiket: string;
  tarih: string;
  okumaSuresi: string;
  govde: { baslik?: string; metin: string }[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "meta-ads-hesabini-dogru-kurmak",
    baslik: "Meta Ads hesabınızı sıfırdan doğru kurmanın 5 adımı",
    ozet: "Çoğu kampanya sorunu, hesap yanlış kurulduğu için ortaya çıkar. Business Manager'dan pikselinize kadar doğru sıralama.",
    etiket: "Meta Ads",
    tarih: "18 Temmuz 2026",
    okumaSuresi: "6 dk",
    govde: [
      { metin: "Kampanya performansı düşük olan hesapların büyük kısmında sorun teklif stratejisinde ya da kreatiften önce, kurulumdadır. Business Manager'ı, sayfayı, reklam hesabını ve piksel'i doğru sırayla ve doğru yetkilendirmeyle kurmadan optimizasyon konuşmak zaman kaybıdır." },
      { baslik: "1. Business Manager'ı doğru varlıkla başlatın", metin: "Business Manager'ı kişisel değil, işletmenize ait bir e-posta ile açın. Sayfa, reklam hesabı ve piksel bu yapı altında toplanmalı; ileride ajans veya çalışan değişikliğinde erişim devri buradan kolaylaşır." },
      { baslik: "2. Yetkilendirmeyi katman katman verin", metin: "Herkese \"admin\" yetkisi vermek yaygın bir hatadır. Ajans veya danışmana yalnızca ihtiyacı olan varlığa, ihtiyacı olan rolle erişim tanımlayın." },
      { baslik: "3. Pikseli kurup CAPI ile eşleştirin", metin: "Yalnızca tarayıcı pikseli, iOS güncellemeleri sonrası veri kaybına açıktır. Dönüşüm API'sini kurup event ID eşleştirmesi yapmadan raporlarınıza güvenmeyin." },
      { baslik: "4. Ödeme ve limit ayarlarını netleştirin", metin: "Kartın harcama limitini kampanya bütçenizin üzerinde tutun; limitle çakışan bütçeler öğrenme aşamasını sık sık sıfırlar." },
      { baslik: "5. Test bütçesiyle doğrulayın", metin: "Kurulumu canlıya almadan önce küçük bir test bütçesiyle olayların doğru geldiğini kontrol edin. Kurulum hatası, optimizasyonla değil yalnızca doğru kurulumla çözülür." },
    ],
  },
  {
    slug: "ajanssiz-sosyal-medya-yol-haritasi",
    baslik: "Ajansa muhtaç olmadan sosyal medyanızı yönetmenin yol haritası",
    ozet: "İçerik takvimi, prodüksiyon akışı ve topluluk yönetimini kendi ekibinizle sürdürmek için gereken üç sistem.",
    etiket: "Sosyal Medya",
    tarih: "9 Temmuz 2026",
    okumaSuresi: "7 dk",
    govde: [
      { metin: "Sosyal medyayı dışarıya vermek çoğu zaman hız kaybettirir: markanızı en iyi siz bilirsiniz, ama içerik üretim disiplini kurulmadığı için süreç ajansa devredilir. Aslında ihtiyacınız olan tek şey üç basit sistem." },
      { baslik: "1. İçerik takvimi", metin: "Haftalık değil, aylık planlayın. Sütunları (eğitici, arkasında-kal, ürün, topluluk) önceden belirleyip her hafta aynı oranda dağıtın; böylece \"bugün ne paylaşsak\" sorusu ortadan kalkar." },
      { baslik: "2. Prodüksiyon akışı", metin: "Çekim gününü ayırın, kurguyu haftalık bir bloğa toplayın. Telefonla çekim + basit kurgu şablonlarıyla stüdyo kalitesine yakın sonuç almak mümkün." },
      { baslik: "3. Topluluk yönetimi rutini", metin: "Yorum ve DM'lere günde iki sabit saatte bakın. Rutin olmayan, dağınık cevaplama etkileşim oranını düşürür." },
      { metin: "Bu üç sistem kurulduğunda ajansın sağladığı asıl değer -disiplin- artık sizde olur; geriye kalan yalnızca uygulamadır." },
    ],
  },
  {
    slug: "pazarlamada-yapay-zeka-nereden-baslamali",
    baslik: "Pazarlamada yapay zekâyı nereden başlayarak kullanmalısınız",
    ozet: "Onlarca araç arasında kaybolmadan, en çok zaman kazandıran üç kullanım alanına odaklanma rehberi.",
    etiket: "Yapay Zekâ",
    tarih: "28 Haziran 2026",
    okumaSuresi: "5 dk",
    govde: [
      { metin: "Yapay zekâ araçlarını denemeye \"hangi araç en iyi\" sorusuyla başlamak yanlış kapıdır. Doğru soru: \"haftada en çok zamanımı hangi iş alıyor?\" Bu üç alan çoğu pazarlamacı için ortaktır." },
      { baslik: "1. İçerik taslağı üretimi", metin: "Sıfırdan yazmak yerine, marka sesinize göre eğittiğiniz bir prompt kütüphanesiyle taslak üretip düzenlemek saatler kazandırır." },
      { baslik: "2. Rapor özetleme", metin: "Haftalık kampanya verisini elle yorumlamak yerine, verinin özetini ve öne çıkan sapmaları yapay zekâya çıkarttırıp yalnızca aksiyon kısmına odaklanabilirsiniz." },
      { baslik: "3. Tekrar eden operasyonlar", metin: "Raporlama, dosya adlandırma, içerik arşivleme gibi tekrar eden işleri basit bir otomasyon akışına bağlamak, ayda onlarca saat geri kazandırır." },
      { metin: "Araç seçimini bu üç ihtiyaca göre yapın; araç sayısını artırmak değil, doğru üç alanı otomatikleştirmek fark yaratır." },
    ],
  },
  {
    slug: "birebir-egitim-neden-daha-hizli-sonuc-verir",
    baslik: "Birebir eğitim neden grup eğitiminden daha hızlı sonuç verir",
    ozet: "Aynı içeriği herkese anlatan bir sınıfla, sizin hesabınız üzerinde ilerleyen bir program arasındaki fark.",
    etiket: "Akademi",
    tarih: "14 Haziran 2026",
    okumaSuresi: "4 dk",
    govde: [
      { metin: "Grup eğitiminin en büyük sorunu içerik değil, hız uyumsuzluğudur. Sınıftaki en yavaş katılımcıya göre ilerleyen bir müfredat, deneyimli katılımcıyı sıkar; hızlı ilerleyen bir müfredat da yeni başlayanı kaybeder." },
      { metin: "Birebir formatta bu sorun yok: müfredat, katılımcının mevcut seviyesine göre ön görüşmede yeniden kurulur. Sıfırdan başlayan biriyle ajansta çalışan biri aynı programı almaz." },
      { metin: "İkinci fark, uygulama zeminidir. Grup eğitiminde örnek hesap üzerinden anlatım yapılır; birebirde katılımcının kendi hesabı, kendi kampanyası kullanılır. Ders bittiğinde teoride değil, gerçek hesapta bir ilerleme olur." },
      { metin: "Üçüncü fark ise sürekliliktir: grup eğitimleri genelde eğitimle birlikte biter. Birebirde ders sonrası soru-cevap kanalı açık kalır; katılımcı yeni bir kampanya kurarken de destek alabilir." },
    ],
  },
  {
    slug: "reklam-butcesini-olceklerken-4-hata",
    baslik: "Reklam bütçenizi ölçeklerken yapılan 4 yaygın hata",
    ozet: "Kampanya iyi çalışırken bütçeyi büyütmek, çoğu zaman performansı bozar. Sebep genelde bu dört hatadan biridir.",
    etiket: "Meta Ads",
    tarih: "2 Haziran 2026",
    okumaSuresi: "5 dk",
    govde: [
      { metin: "\"Kampanya iyi çalışıyor, bütçeyi ikiye katlayalım\" kararı, doğru uygulanmazsa performansı sıfırlar. Ölçekleme sırasında sık yapılan dört hatayı sıralıyoruz." },
      { baslik: "1. Bütçeyi tek seferde büyütmek", metin: "Bütçeyi bir günde %50'nin üzerinde artırmak öğrenme aşamasını sıfırlar. Kademeli, %20-30 aralığında artışlar algoritmanın öğrenmeyi kaybetmesini önler." },
      { baslik: "2. Yalnızca dikey ölçeklemeyi düşünmek", metin: "Bütçeyi tek kampanyada büyütmek yerine, iyi çalışan kitle ve kreatifi yeni kampanyalara yatay olarak çoğaltmak daha istikrarlı sonuç verir." },
      { baslik: "3. Kreatif yorgunluğunu göz ardı etmek", metin: "Bütçe büyürken aynı kreatifle devam etmek frekansı hızla artırır. Ölçeklemeyle birlikte yeni kreatif varyasyonları devreye almak gerekir." },
      { baslik: "4. Öğrenme aşamasında müdahale etmek", metin: "Kampanya öğrenme aşamasındayken teklif veya hedef kitlede değişiklik yapmak süreci sıfırlar. Sabırlı olup veri toplanmasını beklemek, kısa vadede sinir bozucu olsa da uzun vadede daha hızlı sonuç verir." },
    ],
  },
];

export function getPostBySlug(slug: string) {
  return blogPosts.find((p) => p.slug === slug);
}
