# Kartla ödeme (iyzico)

## Akış

1. Yönetici `/admin/odemeler` → **Ödeme kaydet**: öğrenci, tutar, durum **"Onay bekliyor"**.
2. Öğrenci panele girer, `/panel/odemelerim` sayfasında bekleyen kaydı ve **Kartla öde**
   düğmesini görür.
3. Onay sayfası (`/panel/odemelerim/ode/[id]`): tutar, mesafeli satış sözleşmesi onayı.
4. `odemeyeGec()` iyzico'ya Checkout Form başlatır, öğrenci iyzico'nun sayfasına gider.
5. 3D Secure tamamlanınca iyzico `/api/odeme/iyzico/sonuc` adresine POST atar.
6. Sunucu sonucu **iyzico'ya tekrar sorar**, doğruysa `payments.durum = 'odendi'` yapar
   ve öğrenciyi `?sonuc=basarili` ile panele döndürür.

Kart bilgisi bu sunucuya hiç uğramıyor. Kart alanları iyzico'nun kendi sayfasında
olduğu için PCI-DSS yükümlülüğü de bize düşmüyor — kart alanlarını kendi formumuza
koyduğumuz an düşerdi.

## Ortam değişkenleri

Vercel → Settings → Environment Variables:

```
IYZICO_API_KEY     = sandbox-... (canlıda sandbox- öneki yok)
IYZICO_SECRET_KEY  = sandbox-...
IYZICO_ORTAM       = sandbox          # canlıya geçerken: canli
```

Anahtarlar **bilerek `settings` tablosunda değil**. Tabloya koymak, panele erişen
herkesin ve tabloyu okuyabilen her hatanın canlı tahsilat anahtarına ulaşması
demekti.

`IYZICO_ORTAM` tanımsızsa sandbox varsayılıyor: yanlış yapılandırmada gerçek para
çekilmesindense ödeme hiç çalışmasın.

Anahtarlar tanımlı değilken **"Kartla öde" düğmesi hiç görünmüyor** — öğrenci hata
veren bir sayfaya gitmiyor.

## iyzico panelinde yapılacaklar

- **Ayarlar → Callback / bildirim adresi** diye ayrı bir alan doldurmaya gerek yok;
  dönüş adresini her istekte biz gönderiyoruz (`callbackUrl`).
- Canlıya geçerken iyzico'nun **başvuru/onay** sürecinin tamamlanmış olması gerekiyor
  (vergi levhası, imza sirküleri vb.). Sandbox anahtarları bunlar olmadan da çalışır.
- Taksit seçenekleri iyzico tarafında da açık olmalı; bizim gönderdiğimiz liste
  yalnızca bir üst sınır.

## Panel ayarları

`/admin/entegrasyonlar` → **Kartla ödeme (iyzico)**:

| Alan | Ne işe yarıyor |
| --- | --- |
| Taksit seçenekleri | `1 / 3 / 6 / 9` gibi. Boşsa yalnızca tek çekim. Tek çekim listeye her zaman ekleniyor. |
| Fatura şehri / adresi | iyzico her işlemde fatura adresi istiyor. Öğrenciden adres toplamadığımız için kurum adresi gönderiliyor. |

## Kayıt bazında kapatma

Ödeme satırındaki kart simgesi (`online_odeme`). Havaleyle anlaşılmış bir kayıt için
kapatılır; yoksa öğrenci aynı borcu bir de karttan ödeyip iki kez tahsilat oluşturur.
Yeni kayıt açarken "Onay bekliyor" seçilince aynı seçenek formda da çıkıyor.

## Mobil uygulama

Ödeme yüzeylerinin hiçbiri uygulamada çalışmıyor. Üç ayrı katman:

1. `/panel/odemelerim` ve onay sayfası `UygulamadaYok` içinde — uygulamada basılmıyor.
2. `odemeyeGec()` sunucu eylemi `nativeIstekMi()` ile reddediyor — adres elle
   çağrılsa bile.
3. `src/proxy.ts` uygulamayı zaten panel dışına çıkarmıyor.

Sebep App Store 3.1.3: uygulama içinden dışarıdaki bir ödeme yöntemine yönlendirmek
reddedilme sebebi ve kapsam sadece "öde" düğmesi değil — IBAN göstermek, ücret
sayfasına bağlantı vermek de aynı kapıya çıkıyor.

## Doğrulama kararları (neden böyle)

- **Tutar istemciden alınmıyor.** Sunucu eylemi yalnızca kayıt id'si alıp tutarı
  veritabanından okuyor. Aksi halde tarayıcıdan 1 TL gönderip eğitim satın alınırdı.
- **Callback gövdesine güvenilmiyor.** POST'ta gelen tek bilgi `token`; sonucu
  iyzico'ya sunucudan tekrar soruyoruz.
- **Eşleştirme `conversationId` ile.** Kendi yazdığımız kimlik; hangi ödemeye ait
  olduğunu token söylemiyor.
- **Tutar `price` ile karşılaştırılıyor, `paidPrice` ile değil.** Taksitte `paidPrice`
  vade farkıyla büyüyor; onu karşılaştırsaydık her taksitli ödeme "tutar uyuşmuyor"
  diye düşerdi.
- **`odeme_denemeleri` satırı iyzico'ya gitmeden ÖNCE yazılıyor.** Geri dönüşte
  eşleşecek satır yoksa ödemeyi doğrulayamayız; "para çekildi ama kaydı yok" durumu
  kalırdı. Tersi (kayıt var, ödeme başlamadı) zararsız.
- **`odeme_denemeleri` için yazma RLS politikası yok.** Satırları yalnızca servis
  anahtarı yazıyor. Kullanıcıya insert açmak, kendi denemesine `basarili` yazabilmesi
  demekti — ve o satır ödemeyi `odendi`ye çeviren şey.
- **Kimlik numarası yer tutucu (`11111111111`).** iyzico alanı zorunlu tutuyor, biz
  eğitim satışında TCKN toplamıyoruz.

## Bilinen açık uçlar

- **Ağ hatası sonrası "belirsiz" durum.** Callback'te iyzico'ya soramazsak kayıt
  `bekliyor` kalıyor ve öğrenciye "sonucu doğrulayamadık" deniyor. Para çekilmiş
  olabilir; yönetici iyzico panelinden görüp elle "Ödendi" işaretlemeli. Otomatik
  mutabakat (kalan `baslatildi` denemeleri periyodik sorgulamak) henüz yok.
- **`fraudStatus` işlenmiyor.** iyzico 0 döndürdüğünde ödeme incelemede demek; şu an
  `paymentStatus = SUCCESS` ise ödendi sayıyoruz. Ham cevap `ham_yanit` içinde duruyor.
- **İade iyzico'ya gitmiyor.** Admin panelindeki "İade" yalnızca kaydın durumunu
  değiştiriyor; parayı iyzico panelinden iade etmek gerekiyor.
- **Test edilmedi.** Kod canlı bir iyzico hesabına karşı hiç çalıştırılmadı; imza ve
  alan doğrulaması ilk sandbox denemesinde teyit edilmeli.
