# Teklif dokümanı

ahmetekinci.com.tr kurumsal tonlarında (mürekkep siyahı, sarı, krem; Plus Jakarta Sans + JetBrains Mono) A4 teklif PDF'i üretir.

## Sayfalar

1. **Kapak**: logo, teklif sunulan firma (yetkili ya da web adresi), konu, teklif tarihi, son geçerlilik, teklif no
2. **Hizmet detayları**: her hizmetin özeti, kapsamı, süresi. Tek sayfaya sığmazsa otomatik olarak ikinci sayfaya bölünür
3. **Yatırım ve ödeme**: fiyat tablosu (paket satırları, "pakete dahil" kalemler), tek seferlik / aylık toplamlar (indirim + KDV), teslim süresi takvimi, önerilen reklam bütçesi, ödeme seçenekleri
4. **Referanslar**: rakamlar, tek renk ve optik olarak dengelenmiş logo ızgarası (her logonun altında marka adı, sonda "Sıradaki marka: <müşteri>"), çalışma modeli
5. **İletişim**: portre, iletişim kanalları, sonraki adımlar, WhatsApp'tan onay çağrısı

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
Adet için `"adet": 2`. İndirim: `{ "oran": 10, "kapsam": "tek" | "aylik" | "tum", "aciklama": "Paket indirimi" }` ya da `oran` yerine sabit `tutar`.

Paket fiyat: aynı `paket` adını taşıyan hizmetler ayrı kartlarla anlatılır, fiyat tablosunda tek satırda paket fiyatıyla görünür:

```json
"hizmetler": [{ "kod": "google-reklam", "paket": "reklam" }, { "kod": "meta-reklam", "paket": "reklam" }],
"paketler": { "reklam": { "ad": "Google + Meta Reklam Yönetimi", "fiyat": 16000, "periyot": "aylik" } }
```

`"fiyat": 0` olan hizmet "Pakete dahil" olarak gösterilir. Reklam bütçesi bandı için `"reklamButcesi": { "tutar": "₺20.000 – ₺40.000 / ay", "metin": "…" }`.
Yetkili adı yoksa hitap "Değerli <firma> ekibi," olur; kapakta `musteri.web` gösterilir. Bir referans logosu görsel olarak büyük/küçük kalırsa `ayarlar.json`'da `olcek` ile ayarlanır.

Teslim süresi kartı, `teslimTakvimi` olan ilk hizmetten (web sitesi, e-ticaret) gelir; yoksa "onaydan sonra başlangıç" kartı çıkar.
