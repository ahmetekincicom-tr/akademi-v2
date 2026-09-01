# Google Takvim entegrasyonu

Panelden bir **danışmanlık görüşmesi** ya da **birebir eğitim oturumu**
planlandığında etkinlik doğrudan eğitmenin Google Takvimi'ne yazılır. Saat
değişirse aynı etkinlik güncellenir, planlama iptal edilirse etkinlik
takvimden silinir.

Kurulmadığı sürece hiçbir şey bozulmaz: planlama, katılımcıya giden posta ve
panel kayıtları aynen çalışır, yalnızca takvime düşmez.

## Nasıl çalışıyor

| Panelde yapılan | Takvimde olan |
| --- | --- |
| Görüşme planlandı / saati değişti | Etkinlik kurulur ya da güncellenir |
| Görüşme iptal edildi | Etkinlik silinir |
| Görüşme tamamlandı | Etkinlik **kalır** — geçmiş bir görüşme bir kayıttır |
| Birebir oturum eklendi | Tek etkinlik kurulur (grup dersinde de tek) |
| Oturum iptal edildi / silindi | Etkinliğe bağlı başka canlı oturum kalmadıysa silinir |

Panel → **Takvim** ekranı ikisini tek listede gösteriyor (salt okunur);
planlama kendi ekranlarında yapılıyor.

Etkinlikte ne yazar: başlıkta konu ve katılımcı adı, açıklamada katılımcının
adı ve e-postası, konum alanında toplantı bağlantısı. Hatırlatıcılar bir gün
önce ve on dakika önce.

**Katılımcı davetli olarak eklenmiyor.** Davetli eklemek Google'a kişiye
kendiliğinden davet postası gönderttiriyor; katılımcıya ne gideceğini panel
belirlesin diye bilgileri açıklamaya yazıyoruz.

## Kurulum (bir kez, ~15 dakika)

Yetkilendirme **yenileme anahtarı** ile yapılıyor. Hizmet hesabı bu iş için
uygun değil: hizmet hesapları yalnızca Google Workspace alan adlarında
başkasının takvimine yazabiliyor, kişisel bir Gmail hesabında çalışmıyor.

### 1. Google Cloud projesi ve API

1. <https://console.cloud.google.com> → yeni proje (ör. "Akademi Panel").
2. **APIs & Services → Library** → "Google Calendar API" → **Enable**.

### 2. İzin ekranı (Google Auth Platform)

Konsolun yeni sürümünde eski "OAuth consent screen" sayfası soldaki **Google
Auth Platform** menüsüne bölündü:

| Eski adı | Yeni menü |
| --- | --- |
| Uygulama adı, destek e-postası | **Branding** |
| Kapsam (scope) ekleme | **Data Access** |
| Test kullanıcıları, yayınlama | **Audience** |

1. **Branding** → uygulama adı ve destek e-postası olarak kendi adresini yaz.
2. **Data Access** → *Add or remove scopes* → filtreye `calendar.events` yaz
   → `https://www.googleapis.com/auth/calendar.events` seç → Update → Save.
3. **Audience** → durum "Testing" ise **Publish app**.

Üçüncü adım atlanabilir görünüyor ama atlanmamalı: **Testing durumundaki bir
uygulamanın yenileme anahtarı 7 günde geçersiz oluyor** ve takvim hiçbir
uyarı vermeden çalışmayı bırakıyor. Yayınlamak doğrulama gerektirmiyor;
yalnızca kendi hesabın kullandığı için "unverified app" uyarısını bir kez
geçmek yeterli.

### 3. İstemci kimliği

1. **APIs & Services → Credentials → Create credentials → OAuth client ID**.
2. Application type: **Web application**.
3. Authorized redirect URI: `https://developers.google.com/oauthplayground`
4. Çıkan **Client ID** ve **Client secret** değerlerini bir yere kopyala.

### 4. Yenileme anahtarı

1. <https://developers.google.com/oauthplayground/> adresini aç.
2. Sayfanın **sağ üstündeki dişli ikonuna** bas (yazısız, mavi başlık
   çubuğunun sağ ucunda) → açılan panelde **Use your own OAuth credentials**
   kutusunu işaretle → adım 3'teki Client ID ve Client secret'ı gir. Kaydet
   düğmesi yok, girdiğin anda geçerli.
   *Bu kutu işaretlenmezse alınan anahtar Google'ın kendi test istemcisine
   ait olur ve bizim uygulamada çalışmaz.*
3. Sol sütundaki "Input your own scopes" kutusuna
   `https://www.googleapis.com/auth/calendar.events` yapıştır →
   **Authorize APIs**.
4. Kendi Gmail hesabınla giriş yap. "Google hasn't verified this app"
   çıkarsa **Advanced → Go to … (unsafe)** → izin ver.
5. **Exchange authorization code for tokens** → çıkan **Refresh token**
   değerini kopyala (`1//0g…` ile başlar).
   *Boş geldiyse:* dişli panelinde **Force prompt: Consent screen** seçeneğini
   işaretleyip 3–5'i tekrarla. Google, daha önce izin verilmiş bir hesaba
   ikinci kez yenileme anahtarı vermiyor.

### 5. Vercel ortam değişkenleri

| Değişken | Değer |
| --- | --- |
| `GOOGLE_TAKVIM_ISTEMCI_ID` | Adım 3'teki Client ID |
| `GOOGLE_TAKVIM_ISTEMCI_SIRRI` | Adım 3'teki Client secret |
| `GOOGLE_TAKVIM_YENILEME_ANAHTARI` | Adım 4'teki Refresh token |
| `GOOGLE_TAKVIM_ID` | (isteğe bağlı) Ayrı bir takvime yazmak için o takvimin kimliği. Boşsa ana takvim. |

Ekledikten sonra yeniden dağıtım gerekiyor (ortam değişkenleri build
sırasında değil çalışma anında okunuyor ama Vercel yeni değerleri ancak yeni
dağıtımda veriyor).

### 6. Doğrulama

**Panel → Tanı → Google Takvim** bölümünde dördü de "tanımlı" görünmeli ve
"Takvim entegrasyonu: açık" yazmalı. Sonra panelden bir görüşme planla;
etkinlik saniyeler içinde takvimde olur.

## Sorun giderme

Takvime yazılamazsa **planlama geri alınmaz** — kayıt ve katılımcıya giden
posta çok daha önemli. Bunun yerine panelde uyarı çıkar:

- **"Yenileme anahtarı geçersiz"** — Google hesabının parolası değişmiş,
  yetki geri çekilmiş ya da uygulama hâlâ test modunda (7 günlük ömür).
  Adım 4'ü tekrarla, yeni anahtarı Vercel'e yaz.
- **"Takvime eklendi ama kaydedilemedi"** — etkinlik kuruldu ama kimliği
  veritabanına yazılamadı. Aynı planlamayı tekrar kaydedersen takvimde ikinci
  bir kopya oluşur; önce takvimden eskisini sil.
- **Etkinlik takvimden elle silindiyse** bir sonraki düzenlemede yenisi
  kurulur; hata vermez.
