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

## Canlıya geçiş

Kodda değişiklik yok — tek fark ortam değişkenleri. Sıra önemli:

1. **iyzico başvurusu onaylanmış olmalı.** Canlı anahtarlar ancak vergi levhası,
   imza sirküleri vb. onaylandıktan sonra üretiliyor.
2. **Yasal metinler dolu olmalı.** `/satis-sozlesmesi` ve `/iptal-iade-politikasi`
   ödeme onay ekranında bağlantı veriliyor; boş sayfaya para almak mevzuata aykırı.
   `/admin/yasal` üzerinden kontrol et.
3. **Vercel → Environment Variables** (Production):
   ```
   IYZICO_API_KEY    = <canlı anahtar, "sandbox-" öneki YOK>
   IYZICO_SECRET_KEY = <canlı gizli anahtar>
   IYZICO_ORTAM      = canli
   ```
4. **Yeniden deploy et.** Ortam değişkeni mevcut derlemeye geçmiyor.
5. **`/admin/tani` → Kartla ödeme (iyzico):**
   - `IYZICO_ORTAM` → `canli — GERÇEK PARA` (sarı, beklenen)
   - `iyzico bağlantısı ve imza` → **yeşil olmalı.** Kırmızıysa canlı anahtar
     yanlış; ödeme başlatılamaz.
6. **1 ₺'lik gerçek test.** Kendi kartınla öde, sonra iyzico panelinden iade et.
   Sandbox'ta çalışan bir kurulumun canlıda takıldığı tek yer genelde hesabın
   kendi ayarları (taksit, para birimi, işyeri durumu).
7. **Sandbox test kayıtlarını temizle** (aşağıdaki SQL).

### Sandbox artıklarını silme

```sql
-- Önce ne silineceğini gör
select p.id, p.tutar, p.durum, p.odeme_tarihi, pr.email
from payments p join profiles pr on pr.id = p.user_id
where p.yontem = 'Kart (iyzico)';

-- Doğruladıktan sonra sil (denemeler cascade ile gider)
delete from payments where id in (...);
```

### Canlıda ilk kez patlarsa nereye bakılır

| Belirti | Sebep |
| --- | --- |
| `/admin/tani` imza satırı kırmızı | Canlı anahtar yanlış ya da sandbox anahtarı canlı ortama verilmiş |
| Ödeme başlatılamıyor, deneme `basarisiz` | `ham_yanit` içindeki iyzico hata mesajı; genelde alan doğrulaması |
| Deneme `baslatildi` + "iyzico geri DÖNMEDİ" | Dönüş isteği ulaşmıyor; 15 dakikalık mutabakat görevi yine de çözer |
| Deneme `baslatildi` + "iyzico geri döndü" | Dönüş geldi ama eşleşmedi; `ham_yanit`a bak |

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

- **`fraudStatus` işlenmiyor.** iyzico 0 döndürdüğünde ödeme incelemede demek; şu an
  `paymentStatus = SUCCESS` ise ödendi sayıyoruz. Ham cevap `ham_yanit` içinde duruyor.
- **İade iyzico'ya gitmiyor.** Admin panelindeki "İade" yalnızca kaydın durumunu
  değiştiriyor; parayı iyzico panelinden iade etmek gerekiyor.
- **Fatura kesilmiyor.** iyzico tahsilatı yapıyor, e-arşiv faturası elle kesiliyor;
  `fatura_no` alanı bunun için.

## Askıda kalan ödemeler

Dönüş isteği kaybolabiliyor: tarayıcı kapanır, ağ kopar, yönlendirme engellenir.
O anda para çekilmiş ama kayıt `bekliyor` kalır. Üç katman koruyor:

1. **`callback_at` damgası** — token elimize geçer geçmez, hiçbir doğrulama
   beklemeden atılıyor. Bu damga `baslatildi` durumunun iki anlamını ayırıyor:
   damga yoksa öğrenci vazgeçmiş, varsa dönüş gelmiş ama işlenememiş.
2. **`/admin/odemeler` → "Sonucu belli olmayan ödemeler"** — her satırda
   "iyzico'ya sor" düğmesi. Tek doğru kaynağa danışıp kaydı kesinleştiriyor.
3. **`odeme-mutabakat` görevi** — 15 dakikada bir, 5 dakikadan eski ve 3 günden
   yeni askıdaki denemeleri iyzico'ya soruyor. Alt sınır hâlâ 3D Secure
   ekranındaki kişiyi "başarısız" diye kapatmamak için; üst sınır token ömrü
   dolduktan sonra aynı kayıtları sonsuza dek sormamak için.

Üçü de `denemeyiCoz()` çağırıyor. Aynı mantığın üç kopyası olsaydı biri mutlaka
diğerlerinden farklı davranırdı — ve fark edildiği yer para tutmayan bir kayıt
olurdu.

## Doğrulama durumu

Sandbox ve canlı ortamda uçtan uca test edildi (canlıda 1 ₺). İmza, dönüş
işleme, tutar doğrulaması ve kaydın "Ödendi"ye geçmesi teyitli.

## Ödeme bildirimi (e-posta)

Kartla ödeme geçtiğinde yöneticiye mail gidiyor: kim, ne kadar, hangi eğitim,
kartın son dört hanesi, taksitliyse karttan çekilen gerçek tutar ve iyzico
ödeme numarası.

Gönderim `denemeyiCoz()` içinde, ödeme kaydedildikten SONRA. `epostaGonder()`
bilerek hata fırlatmıyor ve dönüşüne bakılmıyor: postanın gitmemesi tahsilatı
geri almamalı.

### Kurulum

1. [resend.com](https://resend.com) hesabı aç.
2. **Domains** → alan adını ekle, verdiği DNS kayıtlarını (SPF/DKIM) alan adı
   yönetimine gir, doğrulanmasını bekle. Doğrulanmamış alan adından gönderim
   reddediliyor.
3. **API Keys** → yeni anahtar.
4. Vercel → Environment Variables:
   ```
   RESEND_API_KEY    = re_...
   BILDIRIM_GONDEREN = Akademi <bildirim@ahmetekinciakademi.com>
   BILDIRIM_EPOSTA   = iletisim@ahmetekinci.com.tr
   ```
   `BILDIRIM_EPOSTA` virgülle birden çok adres alabiliyor.
5. Yeniden deploy et.
6. `/admin/tani` → **E-posta bildirimleri** → **Test e-postası gönder**.

Üçü de tanımlı değilse bildirim sessizce kapalı kalıyor; ödemeler normal
çalışmaya devam ediyor.

### Neden Resend / neden SMTP değil

Sunucusuz ortamda her istekte SMTP bağlantısı kurup kapatmak hem yavaş hem de
bazı bölgelerde 25/587 portları kapalı. Resend tek bir JSON POST; SDK'sı da
tip tanımından fazlasını eklemediği için bağımlılık kurulmadı.
