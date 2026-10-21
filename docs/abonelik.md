# Video aboneliği (iyzico abonelik)

Ders videoları aylık abonelikle açılıyor. **Eğitime kayıtlı** ve **aboneliği süren**
katılımcı izliyor. Kayıt bugünkü gibi yönetimden yapılıyor; abonelik kaydın üstüne
bir şart ekliyor. Birebir seans kayıtları abonelikten bağımsız ve ücretsiz.

## Akış

1. Katılımcı panelde **Video aboneliği** sayfasında sözleşmeyi onaylayıp **Abone ol**'a basar.
2. `aboneOl()` iyzico'nun abonelik formunu başlatır; form sayfaya gömülür
   (`IyzicoFormu`). Kart alanları iyzico'nun çerçevesinde, kart verisi bize uğramaz.
3. İlk ay form tamamlanırken çekilir. iyzico `/api/abonelik/iyzico/sonuc` adresine döner.
4. Sunucu sonucu **iyzico'ya tekrar sorar**, aboneliği kaydeder, erişimi açar.
5. Sonraki aylarda iyzico kartı kendisi çeker ve `/api/abonelik/iyzico/bildirim`
   adresine haber verir. Sunucu yine iyzico'ya sorup kaydı günceller.
6. Saatlik mutabakat görevi (`abonelik-mutabakat`) kaybolan dönüşleri ve
   bildirimleri yakalar.

Erişim kuralı tek yerde, `src/lib/abonelik-hesap.ts → abonelikOzeti`:

| Durum | İzleme ne zamana kadar açık |
| --- | --- |
| Aktif | Son ödenen dönemin sonu + ek süre (varsayılan 3 gün) |
| Ödeme alınamadı | Son ödenen dönemin sonu + ek süre; kişiye "kartını güncelle" maili gider |
| İptal edildi | Son ödenen dönemin sonu (ek süre yok) |
| Sona erdi | Son ödenen dönemin sonu |
| Elle tanınan süre | Yönetimin girdiği güne kadar |

## Kurulum

### 1. Veritabanı

`supabase/migrations/20261021120000_video_aboneligi.sql` uygulanmalı. Bu dosya:

- `abonelikler` ve `abonelik_olaylari` tablolarını,
- `abonelik_aktif()`, `ders_videolarim()`, `yonetici_ders_videolari()`,
  `videosuz_ders_sayisi()` fonksiyonlarını,
- `settings.abonelik` satırını (kapalı + test modunda) ve
- saatlik `abonelik-mutabakat` zamanlayıcısını kuruyor.

**Kod ile migration aynı anda gitmeli.** Migration `lessons.video_url` kolonunu
oturum açmış kullanıcıya kapatıyor; eski kod o kolonu doğrudan okuduğu için
migration koddan önce uygulanırsa öğrenci panelinde ve video kütüphanesinde
videolar görünmez. Ters sıra da çalışmaz: yeni kod, henüz olmayan fonksiyonları
çağırır. İkisi aynı dağıtımda.

Sonra `npm run tipler` (tipler bu dalda elle eklendi; üretilen hâli aynı olmalı).

### 2. iyzico paneli

1. **Eklentiler → Abonelik** eklentisini aç (ilk 3 ay ücretsiz, sonra aylık 199 TL).
2. **Abonelik → Ürünler**: "Video aboneliği" adıyla bir ürün oluştur.
3. Ürünün altında **ödeme planı** oluştur: aylık, TRY, deneme süresi **yok**,
   tekrar sayısı boş (iptal edilene kadar). Planın **referans kodunu** kopyala.
4. Aynı ürün ve planı **test (sandbox) panelinde** de oluştur; o planın kodu ayrı.
5. **Ayarlar → Üye İşyeri Ayarları → Abonelik Bildirimleri** adresine yönetim
   ekranında yazan adresi gir (`https://<alan adı>/api/abonelik/iyzico/bildirim`).
   Test paneline de aynısını gir.

### 3. Vercel ortam değişkenleri (Production)

```
IYZICO_SANDBOX_API_KEY     = sandbox-...   # test modu için
IYZICO_SANDBOX_SECRET_KEY  = sandbox-...
IYZICO_MERCHANT_ID         = <üye işyeri no>  # isteğe bağlı, bildirim imzası için
```

Canlı anahtarlar (`IYZICO_API_KEY`, `IYZICO_SECRET_KEY`, `IYZICO_ORTAM=canli`) tek
seferlik ödemeyle ortak; değişmiyor. Test anahtarları ayrı olduğu için abonelik
canlı sitede, gerçek ödemelere dokunmadan denenebiliyor.

Değişkeni ekledikten sonra yeniden deploy et.

### 4. Yönetim → Video aboneliği

- **Test plan kodu**'nu gir → **Doğrula** (iyzico'dan planın adı ve fiyatı gelmeli).
- Test modu **açık**, Katılımcılara açık **kapalı** → **Kaydet**.

## Test (canlı sitede, yalnızca yöneticiye görünür)

Test modunda abonelik yalnızca yöneticilere görünüyor ve iyzico'nun test
ortamına gidiyor. Yönetici hesabının bir eğitime kayıtlı olması gerekiyor
(Öğrenciler → kayıt ekle).

- [ ] Panel → Video aboneliği → onay → **Abone ol** → form açılıyor.
- [ ] iyzico test kartıyla öde (başarılı kart: `5528 7900 0000 0008`, SKT ileri bir tarih, CVC `123`;
      diğer test kartları iyzico dokümanında, docs.iyzico.com → "Test Kartları").
- [ ] Dönüşte "Aboneliğin başladı" görünüyor, Derslerim'de videolar açılıyor.
- [ ] "Video aboneliği başladı" maili konu satırında `[TEST]` ile geliyor; yönetime de bildirim.
- [ ] Yönetim → Video aboneliği listesinde satır "Aktif" ve TEST etiketli.
- [ ] **iyzico'ya sor** düğmesi hatasız çalışıyor.
- [ ] **Kartımı güncelle** formu açılıyor ve dönüyor.
- [ ] **Aboneliği iptal et** → durum "İptal edildi", izleme dönem sonuna kadar açık, iptal maili geldi.
- [ ] Abone olmayan (ya da süresi dolan) kayıtlı bir hesapta Derslerim'de kilit ekranı çıkıyor.
- [ ] Elle süre tanı → o hesapta videolar açılıyor; **Süreyi bitir** → kapanıyor.

Reddedilen yenilemeyi test ortamında beklemeden denemek mümkün değil (iyzico
ayda bir çekiyor). Kuralları `src/lib/abonelik-hesap.test.ts` kapsıyor.

## Canlıya alma

1. **Yasal metinler**: `/satis-sozlesmesi` ve `/iptal-iade-politikasi`'na abonelik
   maddeleri eklenmiş ve hukukçu onayından geçmiş olmalı (taslak:
   `docs/abonelik-sozlesme-taslagi.md`). Onay ekranı bu iki metne bağlanıyor.
2. Canlı planı oluştur, **Canlı plan kodu**'nu gir → **Doğrula**.
3. **Sayfada gösterilen aylık ücret**'i iyzico'daki planla aynı gir.
4. Test modunu **kapat**, Katılımcılara açık'ı **aç** → **Kaydet**.

Kapatmak için aynı ekrandan Katılımcılara açık'ı kapatmak yeterli. Süren
abonelikler iyzico'da yenilenmeye devam eder; tamamen durdurmak için her
birini listeden iptal et.

## Güvenlik notları

- **Durum hiçbir zaman gelen isteğin gövdesinden yazılmıyor.** Form dönüşü,
  bildirim, mutabakat ve yönetici düğmeleri aboneliği iyzico'ya sorup
  `aboneligiSenkronla` ile yazıyor.
- **Video kimlikleri** (`lessons.video_url`) oturum açmış kullanıcıya doğrudan
  okunmuyor. Katılımcı `ders_videolarim()` üzerinden yalnızca kayıtlı olduğu
  eğitimlerin videolarını, yalnızca aboneliği sürüyorsa alıyor. Önceden kayıtlı
  olmayan biri REST üzerinden bütün video kimliklerini çekebiliyordu.
- Bunny bağlantıları 3 saat geçerli imzalı adreslerle veriliyor
  (`src/lib/bunny.ts`); `BUNNY_TOKEN_KEY` tanımlı olmalı ve Bunny kütüphanesinde
  Token Authentication açık olmalı.
- **Uygulama (iOS)**: abonelik sayfası ve satın alma bağlantıları uygulamada yok
  (Apple 3.1.3). Abone olan kişi uygulamada videoları izleyebiliyor; abone
  olmayan, aboneliğin varlığından söz etmeyen nötr bir kilit görüyor.
