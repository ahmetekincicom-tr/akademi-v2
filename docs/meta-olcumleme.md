# Meta ölçümleme

Reklamın işe yarayıp yaramadığını nereden bileceğiz.

---

## Neden alışılmış kurulum işe yaramıyor

Bu bir e-ticaret sitesi değil. Sepet yok, "satın al" düğmesi de yok. Gerçek akış şu:

```
reklam → site ya da WhatsApp → telefonda ön görüşme → kapsam ve fiyat
       → hesap ELLE açılıyor → ödeme panelin içinde, bazen havaleyle
```

Üç sonucu var ve kurgunun tamamı bunlardan çıkıyor:

1. **Satın alma tarayıcıda gerçekleşmiyor.** Panel girişinin arkasında, tıklamadan
   günler sonra. Havalede ise hiçbir tarayıcı olayı yok — yöneticinin "ödendi"
   demesiyle oluyor. Pixel bunların hiçbirini göremez.
2. **En sık kullanılan giriş form değil, WhatsApp butonu.** Kişi alan adımızdan
   çıkıyor ve normalde geriye hiçbir iz kalmıyor.
3. **Meta'nın optimize edebileceği dönüşüm satın alma değil.** Algoritma haftada
   ~50 dönüşüm istiyor; bu hacimde `Purchase` üzerinde öğrenemez. Kampanya hedefi
   `Lead`, `Purchase` ise değer ve raporlama için.

---

## Olaylar

Katalog `src/lib/meta/olaylar.ts` içinde; sayılar Aggregated Event Measurement sırası.

| # | Olay | Ne zaman | Nereden |
|---|---|---|---|
| 1 | `Purchase` | Ödeme `odendi`ye geçtiğinde | sunucu |
| 2 | `Lead` | Teklif / iletişim formu | sunucu |
| 3 | `Contact` | WhatsApp bağlantısına tıklandığında | sunucu |
| 4 | `CompleteRegistration` | Panele ilk giriş | sunucu |
| 5 | `InitiateCheckout` | iyzico sayfası açıldığında | sunucu |
| 6 | `ViewContent` | Eğitim sayfası | tarayıcı |
| 7 | `PageView` | Tanıtım sayfaları | tarayıcı |
| 8 | `Schedule` | Görüşmeye saat verildiğinde | sunucu |

`AddToCart` ve benzeri sepet olayları bilerek YOK. Zorlanmadılar; funnel'ın gerçek
adımları `Contact` ve `Lead`.

**AEM sırası Business Manager'da aynı şekilde tanımlanmalı.** Yanlışsa iPhone'dan
gelen satışlar raporda kaybolur. `olcumleme.test.ts` numaraların tekil ve 1-8
aralığında kaldığını doğruluyor.

---

## Purchase tek yerden

`src/lib/meta/satis.ts` → `satinAlmaOlayi()`. Ödemenin kesinleştiği dört yol
buradan geçiyor: 3D Secure dönüşü, yöneticinin "iyzico'ya sor" düğmesi, mutabakat
görevi ve havalenin elle işaretlenmesi. `odeme-sonuc.ts`'deki `denemeyiCoz` ile aynı
gerekçe — dört kopya olsaydı biri farklı davranırdı.

İki ayrıntı önemli:

- **Tutar `payments.tutar`**, karttan çekilen değil. Taksit vade farkı bankaya
  gidiyor; ciro saymak Meta'ya kazanılmamış gelir bildirmek olurdu.
- **`action_source`**: kartla ödeme `website`, havale `other`. Havalede kişi hiçbir
  sayfada değil; `website` yazmak olmayan bir site trafiği uydurmak olur.

`event_id` deterministik (`purchase-<payment_id>`): aynı ödeme iki kez çözülse de
Meta tek satış sayıyor.

---

## Kuyruk

Olayları üreten akışlar Meta'ya İSTEK ATMIYOR — `meta_olaylari` tablosuna satır
yazıyorlar. Gönderimi `meta-kuyruk` cron görevi yapıyor (5 dakikada bir).

Sebebi: ödeme onayı Meta'nın cevabını bekleyemez. Meta yavaşladığında bekleyen taraf
zamanlayıcı olmalı, tahsilat değil.

Yan faydası: başarısız gönderim görünür ve tekrar denenebilir. **Otomatik yeniden
deneme bilerek yok** — kesin bir hata (yanlış token) her beş dakikada aynı yanıtı
üretip günlüğü doldururdu. Düğme yönetim ekranında.

Durumlar: `bekliyor`, `gonderildi`, `basarisiz`, `kapali`, `izinsiz`,
`yapilandirilmadi`, `vazgecildi`. `izinsiz` ve `kapali` da yazılıyor: "bu satış neden
Meta'da yok" sorusunun cevabı "kişi izin vermemişti" ise, o cevabın bir yerde durması
gerekiyor.

**200 yetmiyor.** Meta sıfır olay işlediğini de 200 ile söyleyebiliyor;
`events_received` kontrol ediliyor. Bakılmasaydı hiç işlenmemiş olaylar "gönderildi"
diye kaydedilirdi — ölçümlemenin çalıştığı sanılan ama hiçbir şeyin ölçülmediği
durum.

---

## Kimlik: en kırılgan yer

Meta eşleştirmeyi hash'lenmiş e-posta/telefon ve tıklama çerezleriyle yapıyor.
Sorun, ödemenin tıklamadan günler sonra gelmesi.

**Zincir şöyle işliyor:**

1. Reklam adresindeki `fbclid`'i `proxy.ts` yakalayıp `_fbc` çerezine yazıyor —
   sunucudan, çünkü Safari'nin ITP'si JavaScript'in yazdığı çereze 7 gün ömür
   biçiyor, sunucudan `Set-Cookie` ile yazılana biçmiyor.
2. Çerezler `.ahmetekinciakademi.com` kapsamında yazılıyor: WordPress'teki ana site
   ile panel aynı değeri görüyor.
3. Panele ilk girişte (`hosgeldin.ts`) `_fbp`/`_fbc`/IP/UA profile kopyalanıyor.
   **Asıl iş bu.** Çerez silinse de satır kalıyor.
4. Ödeme günü kimlik PROFİLDEN okunuyor, istekten değil — havaleyi yönetici
   işaretliyor ve istekte katılımcının değil onun kimliği var.

`telefonHash` normalleştirmesi ayrıca kritik: aynı numaranın "+90 5xx" ve "05xx"
yazımları farklı hash üretseydi eşleşme sessizce sıfıra düşerdi. Test bunu tutuyor.

---

## WhatsApp yolu

Butonlar `wa.me`'ye doğrudan gitmiyor; `/git/whatsapp` üzerinden geçiyor
(`src/app/git/whatsapp/route.ts`). Orada, kişi hâlâ bizim alan adımızdayken:

- `temaslar` tablosuna çerezler, IP ve tarayıcı kimliği yazılıyor,
- kısa bir **referans kodu** üretilip WhatsApp mesajına gömülüyor (`wa.me?text=`),
- Meta'ya `Contact` gidiyor.

**Yönlendirme hiçbir koşulda engellenmiyor.** Veritabanı düşse, Meta yavaşlasa, izin
olmasa bile kişi WhatsApp'a gidiyor.

Kod, konuşmada geri geliyor. Yönetici hesabı açarken **öğrenci kartındaki "Geliş
kaynağı" alanına** yapıştırıyor ve tıklama kimliği kişiye yapışıyor. Eşleşmemiş
kodlar Meta ölçümleme ekranında listeleniyor.

**Bu adım atlanırsa WhatsApp'tan gelen hiçbir satış reklama bağlanamaz.** Zincirin
en zayıf halkası burası ve insana bağlı.

### WordPress tarafı

Ana site ayrı bir kurulumda. Oradaki WhatsApp butonunun hedefi tam adres olmalı:

```
https://panel.ahmetekinciakademi.com/git/whatsapp?yer=wp-header
```

WordPress'e kod yazmayı gerektirmiyor — yalnızca link değişiyor. `yer` hangi düğmeye
basıldığını söylüyor.

---

## İzin

Reklam olayları KVKK kapsamında; izin olmadan gönderilmiyor. Kural tek yerde:
`kuyruk.ts` → `metaOlayiKuyrukla` her çağrıda `izin` alanını ZORUNLU istiyor.
Varsayılan verilseydi yeni bir çağrı yeri onu geçmeyi unuttuğunda sessizce yanlış
tarafa düşerdi.

İzin kaydı **localStorage'dan çereze taşındı** (`src/lib/izin.ts`). İki sebeple:

1. localStorage alt alan adları arasında paylaşılmıyor — kişi ana sitede izin verip
   panele geçtiğinde bant yeniden soruyordu ve o ana kadar izinsiz sayılıyordu.
2. Sunucu localStorage'ı göremiyor; Meta'ya gönderme kararını sunucu veriyor.

Eski localStorage kayıtları bant ilk yüklendiğinde sessizce çereze taşınıyor.

`profiles.reklam_izni` ayrıca tutuluyor: ödeme günler sonra, havaleyle geldiğinde
okunacak bir çerez olmuyor. `null` = hiç sorulmamış, `false` = hayır demiş.

GPC (`globalPrivacyControl`) her iki tarafta da mutlak ret.

---

## Ayarlar

Entegrasyonlar → Meta: **Pixel ID**, **CAPI token**, **test kodu**.

- Pixel ID girildiği an tarayıcı etiketi yayına giriyor. Boşaltmak = pixel'i tamamen
  kaldırmak; tarayıcı olaylarının kapatma yolu bu (o yüzden yönetim ekranında onlar
  için anahtar çizilmiyor — yalan söyleyen bir düğme olurdu).
- Token da girilince sunucu olayları akmaya başlıyor. Girilmemişken kuyruk
  BOŞALTILMIYOR, bekletiliyor: Meta 7 gün geriye kabul ediyor, o pencerede ayarlar
  girilirse kuyruk kendiliğinden akıyor.
- **Test kodu doluyken olaylar gerçek raporlara girmiyor**, Events Manager'ın test
  sekmesine düşüyor. Yönetim ekranı bunu uyarı olarak gösteriyor. Doğrulama bitince
  boşaltılmalı.

Dataset ID diye ayrı bir alan yok: Meta ikisini birleştirdi, aynı numara.

Token `settings.meta` satırında ve o satır ziyaretçiye kapalı. Pixel ID public
`meta_pixel_ayari` görünümünden okunuyor — o görünüm yalnızca tek alanı yayınlıyor.

> **Denetleyici uyarısı, bilerek:** Supabase `meta_pixel_ayari` için
> "Security Definer View" diyor. Projede aynı uyarıyı taşıyan üç görünüm daha var
> (`olcumleme_ayarlari`, `form_ayarlari`, `banka_ayarlari`) ve hepsi aynı desen:
> görünüm `settings` üzerindeki `is_admin()` politikasını sahibinin hakkıyla aşıp
> **adıyla yazılmış tek bir sütunu** yayınlıyor. Yazma hakkı yok, yeni bir alan elle
> eklenmediği sürece hiçbir şey dışarı çıkmıyor ve yayınlanan değer zaten sayfa
> kaynağında görünen bir tanımlayıcı. Alternatif, `settings` tablosunu satır bazlı
> açmak olurdu — o da bir gün `meta` satırına eklenen yeni bir sırrı sessizce
> sızdırırdı.

---

## Saklama

| Ne | Süre | Görev |
|---|---|---|
| Meta olay günlüğü | 90 gün | `meta-kayit-temizligi` · 03:35 |
| Temas kayıtları | 90 gün | aynı görev |

İkisi de kişisel veri taşıyor (IP, hash'lenmiş e-posta). Meta zaten 7 günden eski
olayı kabul etmiyor; 90 gün tanılama penceresi.

---

## Kurulum sırasında yapılacaklar

Kod tarafı hazır. Meta panelinde yapılması gerekenler:

1. Events Manager'dan Pixel ID ve CAPI token al, Entegrasyonlar → Meta'ya gir.
2. Business Manager'da `ahmetekinciakademi.com` alan adını doğrula (subdomain'leri
   kapsıyor, ikisi için ayrı ayrı gerekmiyor).
3. AEM olaylarını yukarıdaki sırayla tanımla.
4. WordPress'teki WhatsApp butonlarının hedefini `/git/whatsapp?yer=...` yap.
5. WordPress'te aynı Pixel ID ile pixel kur — **ama sunucu olayı gönderme.**
   `Lead` ve `Purchase` tek elden çıkmalı, yoksa çift sayım olur.
6. Test kodunu gir, Events Manager'da doğrula, sonra boşalt.
