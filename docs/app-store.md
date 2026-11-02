# App Store sayfası — metinler ve formlar

App Store Connect → **Uygulamalar** → **AE Akademi** → **iOS Uygulaması 1.0**
sayfasındaki alanlar. Her başlık, formdaki alanın adıyla aynı. Parantezdeki
sayı Apple'ın karakter sınırı.

## Uygulama bilgileri

| Alan | Değer |
| --- | --- |
| Ad (30) | Ahmet Ekinci Akademi — ana ekranda `CFBundleDisplayName` yüzünden "AE Akademi" görünüyor |
| Alt başlık (30) | Dijital pazarlama eğitimleri |
| Birincil kategori | Eğitim |
| İkincil kategori | İş |
| Gizlilik politikası URL'si | https://ahmetekinciakademi.com/gizlilik-politikasi/ |
| Destek URL'si | https://ahmetekinciakademi.com/iletisim/ |
| Pazarlama URL'si | https://ahmetekinciakademi.com |
| Telif hakkı | 2026 Ahmet Ekinci |
| Fiyat | Ücretsiz |

## Tanıtım metni (170)

```
Eğitimin, birebir oturumların, testlerin ve dokümanların tek yerde. Oturum saatin geldiğinde bildirim al, sorularını eğitmenine doğrudan sor.
```

## Anahtar kelimeler (100)

Virgülle ayrılır, boşluk bırakılmaz. Ad ve alt başlıktaki kelimeler zaten
aranıyor, burada tekrar edilmiyor.

```
sosyal medya,reklam,meta ads,google ads,instagram,içerik üretimi,yeni medya,kurs,ders,reklamcılık
```

## Açıklama (4000)

```
AE Akademi, Ahmet Ekinci Akademi öğrencilerinin eğitim paneline telefondan ulaşmasını sağlayan resmi uygulamadır.

Ahmet Ekinci Akademi; yeni medya, dijital pazarlama ve reklamcılık alanlarında uygulamaya dayalı eğitimler sunar. Uygulama, kayıtlı olduğun programı takip etmeni, eğitmeninle iletişimde kalmanı ve hiçbir oturumu kaçırmamanı kolaylaştırır.

BİREBİR EĞİTİM
• Birebir eğitim oturumlarını takvimde gör
• Oturum saati geldiğinde anlık bildirim al, tek dokunuşla katıl
• Geçmiş oturumlarına ve kayıtlarına ulaş

TESTLER VE İLERLEME
• Program testlerini çöz, sonuçlarını takip et
• Ön değerlendirmeyi tamamla, eğitimin sana göre şekillensin
• Programdaki ilerlemeni genel bakış ekranında izle

DOKÜMAN KÜTÜPHANESİ
• Eğitim boyunca paylaşılan dokümanlara, şablonlara ve kaynaklara tek yerden ulaş

SORU-CEVAP VE DANIŞMANLIK
• Sorularını eğitmenine doğrudan ilet
• Gerekirse ekran görüntüsü veya fotoğraf ekle
• Danışmanlık görüşmelerini planla ve takip et

GÜNDEM
• Akademiden duyuruları ve güncel gelişmeleri bildirimle anında öğren

Uygulamayı kullanmak için Ahmet Ekinci Akademi hesabı gerekir. Hesabını uygulamadan oluşturabilir, dilediğin zaman Hesabım bölümünden silebilirsin.

Sorun ya da önerin için: ahmetekinciakademi.com/iletisim
```

## Yenilikler

1.0 için boş kalır; Apple ilk sürümde bu alanı istemez.

## Ekran görüntüleri

Zorunlu boyut: **6.9" iPhone** (1320 × 2868). Apple daha küçük boyutları
bundan kendisi üretiyor. En az 1, en çok 10 görsel. Önerilen sıra:

1. Genel bakış (program ve ilerleme)
2. Birebir eğitim takvimi
3. Bildirim örneği (kilit ekranında oturum hatırlatması)
4. Soru-cevap
5. Doküman kütüphanesi

Görüntülerde gerçek öğrenci adı, e-postası ya da telefonu görünmesin; test
hesabıyla çek.

## Yaş derecelendirmesi

Anketteki tüm içerik sorularına **Yok / Hayır**. Sonuç **4+** çıkar.
"Kullanıcılar arası sınırsız iletişim" sorusuna da **Hayır**: soru-cevap yalnızca
öğrenci ile akademi arasında, öğrenciler birbirine yazamıyor.

## Uygulama gizliliği

**Veri toplanıyor mu?** Evet.
**Takip (tracking) için kullanılıyor mu?** Hayır. Uygulamada reklam ve analitik
etiketi hiç yüklenmiyor (`lib/izin.ts` → `uygulamaIcinde`), App Tracking
Transparency penceresi de bu yüzden gerekmiyor.

Seçilecek veri türleri — hepsinde: **kullanıcıya bağlı: Evet**, **takip: Hayır**,
**amaç: Uygulama işlevselliği**.

| Kategori | Veri türü | Neden |
| --- | --- | --- |
| İletişim Bilgileri | Ad | Hesap |
| İletişim Bilgileri | E-posta Adresi | Giriş, bildirim e-postaları |
| İletişim Bilgileri | Telefon Numarası | Kayıt formu |
| Kullanıcı İçeriği | Fotoğraflar veya Videolar | Destek talebine eklenen görseller |
| Kullanıcı İçeriği | Müşteri Desteği | Soru-cevap ve destek mesajları |
| Kullanıcı İçeriği | Diğer Kullanıcı İçeriği | Test yanıtları, ön değerlendirme |
| Tanımlayıcılar | Kullanıcı Kimliği | Hesap kimliği |

## App Review Information

**Oturum açma gerekli:** işaretli. Kullanıcı adı ve şifre alanına çalışan bir
**öğrenci** test hesabı yaz — yönetici hesabı değil. Hesapta en az bir
program, bir birebir oturum ve bir doküman olsun; boş panel inceleyiciye
"işlevsiz uygulama" gibi görünür.

**İletişim bilgileri:** ad, telefon, e-posta.

**Notlar** (inceleme ekibi için İngilizce):

```
AE Akademi is the student app of Ahmet Ekinci Akademi, a Turkish education platform for digital marketing and new media courses. Students use it to follow their enrolled program.

Native functionality:
- Push notifications: students opt in from an in-app card on the dashboard. A reminder is sent automatically when a 1:1 training session starts; tapping it opens the session screen. Academy announcements also arrive as notifications.
- Camera and photo library: used only to attach screenshots or photos to support questions (Soru-cevap).

Account deletion (5.1.1(v)): Hesabım (Account) > "Hesabını sil" (Delete your account) starts a two-step deletion request from inside the app.

Payments (3.1.3): the app contains no purchases and no links or instructions for paying outside the app. Course enrollment is completed on our website; the app is only where enrolled students access the content they already have.

Third-party sign-in is not offered in the app; sign-in is email and password only.

The demo account above is a student account with an active program, a scheduled 1:1 session and documents, so all sections can be reviewed.
```

## Göndermeden önce

- [ ] TestFlight derlemesi telefonda açıldı, test hesabıyla giriş yapıldı
- [ ] Telefona test bildirimi geldi, dokununca doğru ekran açıldı
- [ ] Hesabım altında hesap silme akışı görünüyor
- [ ] Uygulamada ödeme, IBAN ya da "satın al" bağlantısı görünmüyor
- [ ] Test hesabının şifresi App Review Information'a yazıldı
- [ ] Sürüm sayfasında **Derleme** bölümünden 1.0 (4) seçildi — doğru simge ve açılış ekranı bu derlemede; (2)'de simge, (3)'te açılış ekranı yanlıştı
