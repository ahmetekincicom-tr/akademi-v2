# Dayanıklılık

Sistem bozulduğunda ne olacağı ve bunu kimin fark edeceği.

---

## Hata izleme

Sunucu hataları `src/instrumentation.ts` içindeki `onRequestError` kancasında
toplanıyor. Next bu kancayı dört yerde de çağırıyor: sayfa çizimi, sunucu
eylemi, API yolu ve proxy.

Her hata konsola yazılıyor (Vercel günlüklerinde durur) ve **sistem hatası**
e-postası olarak yönetime gidiyor. Aynı hata 15 dakika boyunca tekrar
bildirilmiyor: bozuk bir sayfa her istekte hata veriyor ve bastırma olmasa bir
saatte yüzlerce mail giderdi — o kutu okunmaz hale gelirdi, yani bildirim
bildirmemekle aynı sonuca varırdı.

Bastırma sayacı bellekte tutuluyor, kalıcı değil. Sunucusuz ortamda her örnek
kendi sayacını tutuyor ve dağıtımda sıfırlanıyor: kesin bir sayaç değil,
gürültü kesici.

Bu akış **kapatılamaz** (`lib/eposta-akislari.ts` → `zorunlu`). Kapatılabilir
olsaydı, kapalı olduğu unutulduğunda sistemin sessizce bozulduğu tek durum bu
olurdu.

---

## Testler

```
npm test          # bir kez çalıştır
npm run test:izle # dosya değiştikçe
```

Testler veritabanına bağlanmıyor — hepsi saf mantık ya da kaynak kod taraması.
Sır gerektirmedikleri için CI'da ve çatal (fork) gönderimlerinde de çalışıyorlar.

**`src/lib/kapsam.test.ts` en önemlisi.** Panel tarafında kişiye bağlı bir
tabloya yapılan her sorgunun kimin satırlarını istediğini açıkça söylediğini
doğruluyor. Somut bir hatadan doğdu: yönetici kendi öğrenci panelinde bütün
katılımcıların ders kaydı klasörlerini, ödemelerini ve giriş geçmişini
görüyordu. Sebep, sorguların "RLS zaten sınırlıyor" varsayımıyla yazılmasıydı;
o cümle katılımcı için doğru, yönetici için değil — politikalar "kendi satırın
**veya yöneticiysen hepsi**" diyor.

Yeni bir panel sorgusu yazarken bu test kırılırsa: ya `.eq("user_id", …)`
süzgeci ekle, ya da bilinçli bir istisnaysa sorgunun üstüne gerekçesiyle
`// kapsam-muaf: …` yaz.

Bekçinin kendisi de test ediliyor: dosya deseni değişip tarama boşa düşerse
"tarama gerçekten bir şey buluyor" testi kırılıyor. Sessizce körelen bir bekçi,
olmayan bir bekçiden kötüdür — çünkü koruma altında olunduğu sanılır.

---

## Sürekli entegrasyon

`.github/workflows/denetim.yml` her itmede dört adım çalıştırıyor: tip
denetimi, lint, testler, derleme. Derleme en sona bırakıldı; en yavaş adım o ve
öncekiler daha hızlı geri bildirim veriyor.

Vercel de derliyor ama geç: dağıtım başladıktan sonra.

---

## Veritabanı tipleri

`src/lib/supabase/tipler.ts` şemadan üretiliyor ve dört Supabase istemcisinin
hepsine bağlı. Elle düzenlenmez.

```
npm run tipler
```

Şema değiştiren her migration'dan sonra çalıştır. Çalıştırılmazsa kod, artık
var olmayan bir sütunu okumaya devam eder ve hata çalışma zamanına kalır.

Bağlandığı gün üç gerçek hata çıkardı: RPC parametrelerine `null` gönderilmesi,
tanılama ekranının tablo adlarını düz metin taşıması ve referans kaydının
tipsiz bir nesneyle yazılması.

---

## Saklama süreleri

Gecelik iki temizlik görevi çalışıyor:

| Ne | Süre | Görev |
|---|---|---|
| Giriş kayıtları | 90 gün | `oturum-kayit-temizligi` · 03:15 |
| E-posta günlüğü | 90 gün | `eposta-gunlugu-temizligi` · 03:25 |
| Meta olay günlüğü ve temas kayıtları | 90 gün | `meta-kayit-temizligi` · 03:35 |

İkisi de kişisel veri taşıyor (IP, konum, e-posta adresi) ve işe yaradıkları
pencere dar: "geçen ay şu mail gitti mi" sorulur, "iki yıl önce" sorulmaz.
Süresiz saklamak, faydası bitmiş kişisel veriyi tutmak demek.

Silme fonksiyonları `SECURITY DEFINER` ve çağırma yetkisi yalnızca
zamanlayıcıda. Oturum açmış birine açık bırakılsaydı, herhangi bir katılımcı
REST üzerinden çağırıp günlüğü budayabilirdi — "gitti mi" sorusunun cevabını
silen bir uç nokta.

**Onay kayıtları (`riza_kayitlari`) hiç silinmiyor** ve silinmemeli: onlar
delil ve yeniden üretilemezler.

---

## Yedekleme — **denenmedi**

Supabase otomatik yedek alıyor ama saklama süresi plana göre değişiyor ve
**hiç geri dönüş denemesi yapılmadı**. Denenmemiş bir yedek, yedek sayılmaz.

Yapılması gereken, sırasıyla:

1. Supabase → Database → Backups: saklama süresini ve son yedeğin tarihini gör.
2. Yeni bir Supabase projesi aç ve yedeği oraya geri yükle. Asıl proje üzerinde
   deneme yapma.
3. Geri yüklenen projede satır sayılarını karşılaştır: `profiles`, `payments`,
   `riza_kayitlari`, `egitim_kayit_arsivi`.
4. Süreyi ölç: geri dönüş kaç dakika sürdü? Bu sayı, gerçek bir kayıpta ne
   kadar kapalı kalınacağının cevabı.
5. Deneme projesini sil.

Kaybın maliyeti bugün 307 kayıt, bütün ödeme geçmişi ve KVKK onay defteri.
Onay kayıtları özellikle önemli: onlar delil ve yeniden üretilemezler.

---

## Bilinen ve kabul edilmiş riskler

**Uygulama bağımlılıklarında üç orta seviye uyarı var** (`npm audit`).
Zinciri Capacitor CLI → xcode → uuid; yalnızca geliştirme bağımlılığı, canlıya
çıkan pakete girmiyor. Düzeltmesi Capacitor'ın kendi güncellemesini bekliyor.

**`pg_net` uzantısı `public` şemasında görünüyor.** Supabase denetleyicisi
uyarıyor ama düzeltilemiyor ve gerçek bir açıklık da değil: uzantının bütün
nesneleri (`http_post`, kuyruk tablosu, yardımcılar) zaten `net` şemasında;
`public`'te duran tek şey uzantının kayıt satırı. Taşınamıyor da —
`relocatable = false`. Tek yol düşürüp yeniden kurmak olurdu, o da iki cron
görevini çalışırken keserdi. Uyarı bilerek açık bırakıldı.
