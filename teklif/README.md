# Teklif dokümanı

ahmetekinci.com.tr kurumsal tonlarında (mürekkep siyahı, sarı, krem; Plus Jakarta Sans + JetBrains Mono) A4 teklif PDF'i üretir.

## Sayfalar

1. **Kapak**: logo, teklif no (sağ üst), başlık, teklif konusu, teklif sunulan firma (yetkili ya da web adresi)
2. **Hizmet detayları**: her hizmetin özeti, kapsamı, süresi. Tek sayfaya sığmazsa otomatik olarak ikinci sayfaya bölünür
3. **Ücretlendirme**: son geçerlilik tarihi, fiyat tablosu (paket satırları, "pakete dahil" kalemler), tek seferlik / aylık toplamlar (indirim + KDV), teslim süresi takvimi, önerilen reklam bütçesi, ödeme seçenekleri
4. **Referanslar**: rakamlar, tek renk ve optik olarak dengelenmiş 3 sütunlu logo ızgarası, çalışma modeli. Logoda adı okunmayan markalarda (ör. Ankara ESOB) logonun yanına kısa ad yazılır: `ayarlar.json` → `referanslar[].ek`
5. **İletişim**: iletişim kartları ve "Önce veri, sonra karar." kapanış paneli

Her sayfanın altında Ahmet Ekinci logosu, partner rozetleri (Meta, Shopify, OpenAI, Kommo) ve sayfa numarası var.

## Yeni teklif

1. `teklifler/ornek.json` dosyasını kopyalayın (ör. `teklifler/firma-adi.json`).
2. Şunları değiştirin: `musteri`, `konu`, `kapakBaslik` (köşeli parantez içindeki kelimenin altı sarı çizilir), `giris`, `tarih`, `hizmetler` (`kod` + `fiyat`), istenirse `indirim`.
3. Çalıştırın:

```bash
node teklif/olustur.mjs teklif/teklifler/firma-adi.json
```

PDF ve HTML `teklif/cikti/` altına yazılır (depoya girmez). `--png` eklenirse sayfa önizlemeleri de çıkar.

## Dosyalar

| Dosya | İçerik |
| --- | --- |
| `ayarlar.json` | Her teklifte aynı kalanlar: iletişim, geçerlilik günü, KDV, ödeme seçenekleri, şartlar, rakamlar, referanslar |
| `hizmet-katalogu.json` | Standart hizmet açıklamaları ve kapsamları; web projelerinde `teslimTakvimi` |
| `teklifler/*.json` | Müşteriye özel alanlar |
| `stil.css` | Tasarım |
| `olustur.mjs` | HTML'i kurar, Playwright (Chromium) ile PDF'e basar |

### Hizmet alanları

Teklif dosyasındaki bir hizmet, katalogdaki her alanı ezebilir:

```json
{ "kod": "sosyal-medya", "fiyat": 24000, "kapsam": ["…"], "sure": "Aylık · en az 6 ay", "not": "…" }
```

Katalogda olmayan bir hizmet için `kod` yazmadan `ad`, `etiket`, `grup` (yonetim | kurulum | uretim | web), `periyot` (tek | aylik), `ozet`, `kapsam`, `fiyat` verin.
Adet için `"adet": 2`. Satır indirimi: `"fiyat": 15000, "indirim": 5000, "indirimNotu": "Paket indirimi", "kisaAd": "GEO"` → tabloda liste fiyatı üstü çizili, indirimli fiyat ve indirim etiketi; toplamda ayrı indirim satırı. İndirim: `{ "oran": 10, "kapsam": "tek" | "aylik" | "tum", "aciklama": "Paket indirimi" }` ya da `oran` yerine sabit `tutar`.

Paket fiyat: aynı `paket` adını taşıyan hizmetler ayrı kartlarla anlatılır, fiyat tablosunda tek satırda paket fiyatıyla görünür:

```json
"hizmetler": [{ "kod": "google-reklam", "paket": "reklam" }, { "kod": "meta-reklam", "paket": "reklam" }],
"paketler": { "reklam": { "ad": "Google + Meta Reklam Yönetimi", "fiyat": 16000, "periyot": "aylik" } }
```

`"fiyat": 0` olan hizmet "Pakete dahil" olarak gösterilir. Reklam bütçesi bandı için `"reklamButcesi": { "tutar": "₺20.000 – ₺40.000 / ay", "metin": "…" }`.
Yabancı dilde marka adlarında `musteri.dil` yazın (ör. `"dil": "en"`): büyük harfe çevrilen yerlerde "i" harfi "İ" yerine "I" olur.
Hitap ("Sayın …,") yalnız `musteri.yetkili` yazılırsa, giriş paragrafı yalnız `giris` yazılırsa çıkar; kapakta `musteri.web` gösterilir. Bir referans logosu görsel olarak büyük/küçük kalırsa `ayarlar.json`'da `olcek` ile ayarlanır.

Reklam bütçesi belli değilse tek bant yerine 3 senaryo gösterilebilir (`reklamButcesi` yerine `butceSenaryolari`):

```json
"butceSenaryolari": {
  "baslik": "Tavsiye edilen reklam bütçesi",
  "metin": "Bütçe hizmet bedeline dahil değildir…",
  "senaryolar": [
    { "ad": "Başlangıç", "tutar": 7500, "aciklama": "…", "dagilim": [{ "ad": "Bilinirlik", "oran": 50 }, { "ad": "Etkileşim", "oran": 30 }, { "ad": "Takipçi", "oran": 20 }] },
    { "ad": "Dengeli", "tutar": 15000, "vurgu": true, "dagilim": [ … ] },
    { "ad": "Büyüme", "tutar": 25000, "dagilim": [ … ] }
  ]
}
```

Günlük karşılık (tutar / 30) otomatik hesaplanır; `vurgu: true` olan kart koyu ve "Önerilen" etiketli çıkar.

Teslim süresi kartı, `teslimTakvimi` olan ilk hizmetten (web sitesi, e-ticaret) gelir; yoksa "onaydan sonra başlangıç" kartı çıkar.

## Başlangıç talep listesi

Çalışmaya başlanan müşteriden istenen erişim ve bilgileri (Meta yetkisi, görsel/video, GEO soruları, web sitesi erişimi, WhatsApp numarası) aynı tasarımda bir PDF'e döker.

```bash
node teklif/talep.mjs teklif/talepler/<musteri>.json
```

Sayfalar: kapak (taleplerin kontrol listesi), talep kartları (sığmazsa otomatik bölünür), "Teslim ettiğinizde ne olur?" adımları, iletişim.

| Dosya | İçerik |
| --- | --- |
| `talep-katalogu.json` | Standart talepler: `meta-yetki` (adım adım kılavuz), `medya`, `geo-sorular`, `web-admin`, `whatsapp`. `{eposta}` yerine `ayarlar.json`'daki adres gelir |
| `talepler/*.json` | Müşteri, `hitap`, `giris`, `talepler` (`kod` + değiştirilecek alanlar), `sonrakiAdimlar` |
| `talep.css` | Talep listesine özel stiller |

Katalogdaki her alan müşteri dosyasında aynı adla yazılarak değiştirilebilir (ör. sektöre özel `maddeler` ya da GEO `sorular`). Metinlerde `**kalın**` desteklenir.
