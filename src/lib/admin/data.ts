export type Ogrenci = {
  isim: string;
  eposta: string;
  program: string;
  yuzde: string;
  sonGiris: string;
  durum: string;
};

export const ogrenciData: Ogrenci[] = [
  { isim: "Selin Kaya", eposta: "selin@limonian.com", program: "Meta Business, Sosyal Medya", yuzde: "72%", sonGiris: "2 saat önce", durum: "Aktif" },
  { isim: "Mert Aydın", eposta: "mert@aydinticaret.com", program: "Meta Business", yuzde: "38%", sonGiris: "Dün", durum: "Aktif" },
  { isim: "Deniz Yalçın", eposta: "deniz@ajans.co", program: "Sosyal Medya", yuzde: "100%", sonGiris: "5 gün önce", durum: "Tamamlandı" },
  { isim: "Burçin Uğur", eposta: "burcin@butikmoda.com", program: "Meta Business", yuzde: "56%", sonGiris: "3 saat önce", durum: "Aktif" },
  { isim: "Ege Kızıltepe", eposta: "ege@dijitalis.com", program: "Yapay Zekâ", yuzde: "84%", sonGiris: "1 hafta önce", durum: "Aktif" },
  { isim: "Yasemin Turan", eposta: "yasemin@kurumsal.com.tr", program: "Meta Business, Yapay Zekâ", yuzde: "12%", sonGiris: "Bugün", durum: "Yeni" },
  { isim: "Ahmet Bahçeci", eposta: "ahmet@eticaret.store", program: "Sosyal Medya", yuzde: "0%", sonGiris: "Hiç girmedi", durum: "Davet bekliyor" },
];

export type Odeme = {
  no: string;
  isim: string;
  program: string;
  yontem: string;
  tutar: string;
  durum: string;
};

export const odemeData: Odeme[] = [
  { no: "#AEA-4192", isim: "Yasemin Turan", program: "Meta Business Eğitimi", yontem: "Kart · 6 taksit", tutar: "32.400 ₺", durum: "Ödendi" },
  { no: "#AEA-4191", isim: "Ahmet Bahçeci", program: "Sosyal Medya Eğitimi", yontem: "Havale / EFT", tutar: "26.400 ₺", durum: "Onay bekliyor" },
  { no: "#AEA-4188", isim: "Burçin Uğur", program: "Yapay Zekâ Eğitimi", yontem: "Kart · tek çekim", tutar: "21.600 ₺", durum: "Ödendi" },
  { no: "#AEA-4185", isim: "Ege Kızıltepe", program: "İleri Ölçekleme Atölyesi", yontem: "Kart · 3 taksit", tutar: "11.400 ₺", durum: "Ödendi" },
  { no: "#AEA-4180", isim: "Mert Aydın", program: "Meta Business Eğitimi", yontem: "Kart · 9 taksit", tutar: "32.400 ₺", durum: "İade edildi" },
  { no: "#AEA-4176", isim: "Selin Kaya", program: "Sosyal Medya Eğitimi", yontem: "Havale / EFT", tutar: "26.400 ₺", durum: "Ödendi" },
];

export type Mesaj = { kim: "ogr" | "admin"; metin: string; saat: string };
export type Talep = {
  id: string;
  baslik: string;
  kim: string;
  program: string;
  durum: string;
  tarih: string;
  mesajlar: Mesaj[];
};

export const talepData: Talep[] = [
  {
    id: "t1",
    baslik: "Advantage+ kampanyada bütçe dağılımı",
    kim: "Selin Kaya",
    program: "Meta Business",
    durum: "Açık",
    tarih: "Bugün 09:14",
    mesajlar: [
      { kim: "ogr", metin: "Advantage+ kampanyada bütçeyi kitle seti seviyesinde ayarlayamıyorum, normal mi?", saat: "Dün 21:40" },
      {
        kim: "admin",
        metin: "Normal. Advantage+ tek bütçe havuzu kullanıyor; dağıtımı algoritma yapıyor. Kontrol istiyorsan manuel kampanyaya geçmelisin.",
        saat: "Bugün 09:14",
      },
    ],
  },
  {
    id: "t2",
    baslik: "Pixel olayları iki kez sayıyor",
    kim: "Burçin Uğur",
    program: "Meta Business",
    durum: "Yanıtlandı",
    tarih: "26 Temmuz",
    mesajlar: [
      { kim: "ogr", metin: "Satın alma olayı hem pixel hem CAPI'den geliyor, rapor şişiyor.", saat: "25 Temmuz" },
      {
        kim: "admin",
        metin: "Event ID eşleştirmesi gerekiyor. Modül 2'deki deduplication dersini tekrar izle, sonra ekran paylaşımıyla bakalım.",
        saat: "26 Temmuz",
      },
    ],
  },
  {
    id: "t3",
    baslik: "Fatura bilgisi güncelleme",
    kim: "Yasemin Turan",
    program: "Yapay Zekâ",
    durum: "Açık",
    tarih: "29 Temmuz",
    mesajlar: [{ kim: "ogr", metin: "Şirket unvanımız değişti, faturayı yeni unvanla alabilir miyiz?", saat: "29 Temmuz" }],
  },
  {
    id: "t4",
    baslik: "Sertifika indirilemiyor",
    kim: "Deniz Yalçın",
    program: "Sosyal Medya",
    durum: "Kapandı",
    tarih: "18 Temmuz",
    mesajlar: [
      { kim: "ogr", metin: "Program tamamlandı ama sertifika butonu açılmıyor.", saat: "18 Temmuz" },
      { kim: "admin", metin: "Son dersin tamamlandı işareti eksikti, düzelttim. Şimdi indirebilirsin.", saat: "18 Temmuz" },
    ],
  },
];

export type Dokuman = {
  ad: string;
  tip: string;
  boyut: string;
  program: string;
  ders: string;
  indirme: string;
};

export const dokumanlarData: Dokuman[] = [
  { ad: "Kampanya bütçe planlama şablonu", tip: "PDF", boyut: "480 KB", program: "Meta Business", ders: "Modül 5 · Teklif", indirme: "128" },
  { ad: "Aylık reklam raporu şablonu", tip: "XLSX", boyut: "96 KB", program: "Meta Business", ders: "Modül 6 · Rapor", indirme: "96" },
  { ad: "Kreatif test kontrol listesi", tip: "PDF", boyut: "220 KB", program: "Sosyal Medya", ders: "Modül 3 · Kreatif", indirme: "74" },
  { ad: "İçerik takvimi taslağı", tip: "DOCX", boyut: "68 KB", program: "Sosyal Medya", ders: "Atanmadı", indirme: "51" },
  { ad: "Prompt kütüphanesi", tip: "PDF", boyut: "310 KB", program: "Yapay Zekâ", ders: "Modül 2 · Üretim", indirme: "63" },
];

export type Video = {
  ad: string;
  program: string;
  ders: string;
  sure: string;
  durum: string;
  kalite: string;
  izlenme: string;
  tamamlama: string;
};

export const videoData: Video[] = [
  { ad: "Teklif stratejileri ve bütçe dağıtımı", program: "Meta Business", ders: "Modül 5 · Ders 3", sure: "35:12", durum: "Hazır", kalite: "1080p", izlenme: "412", tamamlama: "%68" },
  { ad: "Kendi kampanyanızın canlı kurulumu", program: "Meta Business", ders: "Modül 5 · Ders 5", sure: "44:06", durum: "İşleniyor", kalite: "—", izlenme: "0", tamamlama: "—" },
  { ad: "Pixel kurulumu ve doğrulama", program: "Meta Business", ders: "Modül 2 · Ders 1", sure: "39:48", durum: "Hazır", kalite: "1080p", izlenme: "684", tamamlama: "%81" },
  { ad: "Hook ve ilk 3 saniye", program: "Sosyal Medya", ders: "Modül 3 · Ders 1", sure: "28:30", durum: "Hazır", kalite: "1080p", izlenme: "306", tamamlama: "%74" },
  { ad: "Prompt kütüphanesi kullanımı", program: "Yapay Zekâ", ders: "Atanmadı", sure: "18:22", durum: "Hazır", kalite: "720p", izlenme: "112", tamamlama: "%59" },
  { ad: "Advantage+ karşılaştırması", program: "Meta Business", ders: "Modül 5 · Ders 2", sure: "41:10", durum: "Hata", kalite: "—", izlenme: "0", tamamlama: "—" },
];

export const randevularData = [
  { zaman: "4 Ağu · 14:00", sure: "60 dk", isim: "Selin Kaya", konu: "Kampanya optimizasyon seansı" },
  { zaman: "6 Ağu · 11:30", sure: "45 dk", isim: "Burçin Uğur", konu: "Pixel ve CAPI kontrolü" },
  { zaman: "11 Ağu · 16:00", sure: "60 dk", isim: "Yasemin Turan", konu: "Ön görüşme · müfredat planı" },
  { zaman: "13 Ağu · 10:00", sure: "30 dk", isim: "Ege Kızıltepe", konu: "Ölçekleme değerlendirmesi" },
];

export const adminOzetCourses = [
  { ad: "Birebir Meta Business Eğitimi", slug: "meta-business", meta: "15 saat · 6 modül · 24 ders", durum: "Yayında", ogrenci: "84", tamamlanma: "%71", gelir: "2,7 M₺" },
  { ad: "Birebir Sosyal Medya Eğitimi", slug: "sosyal-medya", meta: "22 saat · 8 modül · 31 ders", durum: "Yayında", ogrenci: "46", tamamlanma: "%64", gelir: "1,2 M₺" },
  { ad: "Pazarlamada Yapay Zekâ Eğitimi", slug: "yapay-zeka", meta: "7 saat · 4 modül · 12 ders", durum: "Yayında", ogrenci: "31", tamamlanma: "%78", gelir: "670 B₺" },
  { ad: "İleri Seviye Ölçekleme Atölyesi", slug: null, meta: "6 saat · 3 modül · 9 ders", durum: "Taslak", ogrenci: "—", tamamlanma: "—", gelir: "—" },
];
