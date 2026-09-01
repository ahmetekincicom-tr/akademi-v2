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

### 2. OAuth izin ekranı

1. **APIs & Services → OAuth consent screen**.
2. User type: **External**, uygulama adı ve destek e-postası olarak kendi
   adresini yaz.
3. Scopes adımında `https://www.googleapis.com/auth/calendar.events` ekle.
4. Test users'a kendi Gmail adresini ekle.
5. **Uygulamayı "Publish" et (Production).** Test modunda kalan bir
   uygulamanın yenileme anahtarı **7 günde geçersiz oluyor** ve takvim
   sessizce çalışmayı bırakıyor. Doğrulama istemiyor; yalnızca kendi
   hesabın kullandığı için "unverified app" uyarısını bir kez geçmen
   yeterli.

### 3. İstemci kimliği

1. **APIs & Services → Credentials → Create credentials → OAuth client ID**.
2. Application type: **Web application**.
3. Authorized redirect URI: `https://developers.google.com/oauthplayground`
4. Çıkan **Client ID** ve **Client secret** değerlerini bir yere kopyala.

### 4. Yenileme anahtarı

1. <https://developers.google.com/oauthplayground> adresini aç.
2. Sağ üstteki dişliden **Use your own OAuth credentials** işaretle, adım
   3'teki client ID ve secret'ı gir.
3. Sol listede **Calendar API v3** altından
   `https://www.googleapis.com/auth/calendar.events` seç → **Authorize APIs**.
4. Kendi Gmail hesabınla giriş yap, izin ver.
5. **Exchange authorization code for tokens** → çıkan **Refresh token**
   değerini kopyala.

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
