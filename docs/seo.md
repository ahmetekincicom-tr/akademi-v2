# SEO planı

Site şu an arama motorlarına **kapalı** (`src/proxy.ts` → `X-Robots-Tag: noindex`).
Buradaki her şey kapı açıldığı anda çalışmaya hazır olsun diye kuruldu.

## Açma anahtarı

Vercel'de tek ortam değişkeni:

```
INDEKSLENEBILIR_ALAN_ADLARI = ahmetekinciakademi.com,www.ahmetekinciakademi.com
```

Listede olmayan her alan adı `noindex` almaya devam ediyor — `panel.` alt alan
adı ve `*.vercel.app` bilerek dışarıda.

Bir de kanonik adres:

```
NEXT_PUBLIC_SITE_URL = https://ahmetekinciakademi.com
```

Bu, `<link rel="canonical">`, site haritası, `robots.txt` ve paylaşım
kartlarının hepsini besliyor. **Yanlış olursa Google içeriği iki ayrı adreste
görüp gücü böler** — alan adı değişince ilk güncellenecek şey bu.

## Kurulan altyapı

| Ne | Nerede |
| --- | --- |
| Kanonik adres, başlık şablonu, açıklama | `src/lib/seo.ts` → `sayfaMeta()` |
| Open Graph + Twitter kartları | aynı yer, her sayfada otomatik |
| `EducationalOrganization` + `WebSite` şeması | `src/app/layout.tsx` |
| `Course` + `BreadcrumbList` şeması | `src/app/egitimler/[slug]/page.tsx` |
| Site haritası (eğitimler ve yasal metinler dahil, dinamik) | `src/app/sitemap.ts` |
| `robots.txt` (panel/yönetim taranmıyor, site haritası bildiriliyor) | `src/app/robots.ts` |
| Oturum sayfalarında `noindex` | `/giris`, `/kayit`, `/sifremi-unuttum` |

## Anahtar kelime haritası

> **Uyarı:** Aşağıdaki hacim tahminleri araştırma aracıyla doğrulanmadı; iş
> tanımından ve Türkiye pazarındaki genel arama davranışından çıkarıldı.
> Yayına almadan önce Google Keyword Planner ya da benzeri bir araçla teyit et.
> Yanlış kelimeye sayfa kurmak, hiç kurmamaktan pahalı.

Her sayfanın **tek bir birincil kelimesi** var. Aynı kelimeyi iki sayfaya
vermek ikisini birbirine rakip yapar (keyword cannibalization) ve genelde
ikisi de düşer.

| Sayfa | Birincil kelime | Destekleyici kelimeler | Niyet |
| --- | --- | --- | --- |
| `/` | birebir dijital pazarlama eğitimi | dijital pazarlama eğitimi ankara, kişiye özel pazarlama eğitimi | ticari |
| `/egitimler` | dijital pazarlama eğitim programları | online pazarlama kursu, reklam eğitimi | ticari |
| `/egitimler/meta-ads-egitimi` | meta ads eğitimi | facebook reklam eğitimi, instagram reklam verme, meta business suite eğitimi | ticari — **en yüksek değerli sayfa** |
| `/hakkimizda` | ahmet ekinci dijital pazarlama | ahmet ekinci eğitmen | marka |
| `/kurumsal` | kurumsal dijital pazarlama eğitimi | şirketlere özel reklam eğitimi, ekip eğitimi | ticari |
| `/referanslar` + `/yorumlar` | dijital pazarlama eğitimi yorumları | ahmet ekinci akademi yorumları | araştırma |
| `/iletisim` | — | — | marka |

### Şu an eksik olan: bilgi amaçlı içerik

Yukarıdaki sayfaların hepsi **satın almaya hazır** kişiyi hedefliyor. O
kitle küçük. Asıl trafik, henüz satın almayı düşünmeyen ama sorunu olan
kişiden gelir ve onlar için sitede hiçbir sayfa yok.

Gündem panosunu (`/panel/duyurular`) zaten kurduk ama o **panele kapalı**.
En yüksek getirili sonraki adım, aynı içeriğin halka açık bir blog olarak da
yayınlanması. Aday konular, aramada karşılığı olan sorulardan:

- "instagram reklam vermek ne kadar tutuyor"
- "meta business suite nasıl kullanılır"
- "reklam hesabı kısıtlandı ne yapmalı"
- "instagram gönderi erişimi neden düştü"
- "facebook piksel nasıl kurulur"

Bunların her biri hem arama karşılığı olan hem de senin günlük olarak
cevapladığın sorular. İçerik zaten var; eksik olan yayınlanacak yer.

## Yayına almadan önce yapılacaklar

1. **Kanonik alan adına karar ver.** Panel alt alan adında kalınacaksa
   pazarlama sayfaları oraya taşınmamalı; kök alan adına geçiliyorsa
   `NEXT_PUBLIC_SITE_URL` ve `INDEKSLENEBILIR_ALAN_ADLARI` birlikte güncellenmeli.
2. **Search Console'a ekle**, site haritasını gönder: `/sitemap.xml`.
3. **Paylaşım görselini değiştir.** Şu an açılış logosu kullanılıyor
   (`OG_GORSEL`, `src/lib/seo.ts`). 1200×630 bir kapak görseli sosyal
   paylaşımlarda belirgin fark yaratıyor.
4. **Sayfa metinlerini kelimeye göre gözden geçir.** Meta etiket tek başına
   sıralama getirmiyor; H1 ve ilk paragrafın kelimeyi doğal biçimde içermesi
   gerekiyor.
5. **Eski siteden taşıma yapılacaksa 301 yönlendirmeleri** kurulmalı, yoksa
   birikmiş otorite kaybolur.

## Meta keywords etiketi neden yok

`<meta name="keywords">` **Google tarafından 2009'dan beri yok sayılıyor**;
Bing de kullanmıyor. Rakiplere hangi kelimeleri hedeflediğini göstermek
dışında bir işlevi kalmadı. Bu yüzden bilerek eklenmedi — anahtar kelime
çalışması etiketle değil, yukarıdaki haritayla ve sayfa metinleriyle yapılıyor.
