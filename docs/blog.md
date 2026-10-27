# Blog

Blog bu uygulamada: yazılar ve kategoriler Supabase'te (`posts`, `categories`),
herkese açık sayfalar Next.js'te, yönetim `/kontrol-9f4x2k/blog` altında.
Sistem ahmetekinci.com.tr'nin blog sisteminden uyarlanıyor; bu belge aşama
aşama güncelleniyor.

## Adresler

WordPress'teki yapı korunuyor, hiçbir adres değişmedi:

| Ne | Adres |
| --- | --- |
| Yazı | `/{slug}/` (ör. `/meta-capi-nedir/`) |
| Kategori arşivi | `/{slug}/` (ör. `/sosyal-medya/`) |
| Blog dizini | `/blog/` |
| RSS | `/blog/rss.xml` (`/feed/` buraya yönleniyor) |

Yazı ve kategori aynı adres alanını paylaşıyor; panel aynı adresin ikisine
birden verilmesine izin vermiyor.

Etiket sayfaları `/blog/etiket/{etiket}/` altında; adres etiket metninden
türetiliyor ("Meta Ads" → `/blog/etiket/meta-ads/`). 3'ten az yazısı olan
etiket sayfası açık ama arama motoruna kapalı ve site haritasında yok.

## Görünüm

- **Görselsiz kapak** (`src/lib/blog-kapak.ts`): kapak görseli olmayan yazıda
  kategorinin rengi ve simgesiyle çizilen kapak. Kategori → görünüm tablosu
  dosyada; tanınmayan kategori slug'dan sabit bir görünüm alıyor.
- **İlgili eğitim** (`src/lib/blog-egitim.ts`): yazının CTA'ları kategorinin
  eğitimine gidiyor. Eşleme tercih sırasıyla; "çok yakında" eğitim atlanıp
  sıradaki deneniyor, hiçbiri açık değilse "Tüm eğitimler". Kart metni
  eğitimin panelde yazılan başlık ve açıklaması (Meta Ads eğitimininki elle
  yazılmış metin).
- **İç bağlantılar** (`src/lib/blog-baglanti.ts`): gövdedeki bağlantılar sayfa
  basılırken son adreslerine yazılıyor; veritabanındaki yazı değişmiyor.

## Durumlar ve zamanlı yayın

| Durum | Sitede |
| --- | --- |
| Taslak | Görünmüyor |
| Yayında | Görünüyor |
| Zamanlı yayın | Seçilen dakikaya kadar görünmüyor, sonra kendiliğinden yayında |

Zamanlı yayını `blog-zamanli-yayin` görevi (pg_cron) yapıyor. Görev her
dakika bakıyor ama siteyi yalnızca vakti gelmiş bir yazı varsa çağırıyor
(`/api/gorevler/blog-zamanli-yayin`). Saat Türkiye saatiyle giriliyor.

Görev `GOREV_ANAHTARI` ile kimlik gösteriyor. Anahtar Vercel'de ve
veritabanında aynı olmalı (`docs/dayaniklilik.md`). Anahtar uyuşmazsa zamanlı
yazı yayına girmez.

## Yönlendirmeler

Tablo: `yonlendirmeler`. Ara katman (`src/proxy.ts`) okuyor ve bir dakikalık
önbellekte tutuyor.

Kendiliğinden yazılan yönlendirmeler (veritabanı tetikleyicileri):

| Olay | Eski adres |
| --- | --- |
| Yayınlanmış yazının adresi değişti | yeni adrese 301 |
| Yazı yayından kalktı | panelde seçilen yere: `/blog/` (varsayılan), başka bir yazı, başka bir adres ya da 410 |
| Yazı silindi | aynı seçim |
| Yazı yeniden yayına girdi | eski adreslerinin hepsi yeniden yazıya |
| Kategorinin adresi değişti | yeni adrese 301 |
| Kategori silindi | `/blog/` |

Zincir oluşmuyor: A→B varken B→C yazılınca A doğrudan C'ye gidiyor.

Elle eklenenler: Blog → Yönlendirmeler. Elle düzenlenen satırı tetikleyici
bir daha değiştirmiyor.

Yönetim, panel, oturum ve API adreslerine hiçbir yönlendirme uygulanmıyor
(`src/lib/yonlendirme.ts → DOKUNULMAZ_KOKLER`). Yanlış bir satır yönetime
girişi kilitleyemez.

`src/lib/tasima.ts`'teki elle yazılmış WordPress taşıma listesi ayrı ve önce
çalışıyor (next.config.ts).

## Sürüm geçmişi

Başlık, özet ya da içerik değişip kaydedildiğinde eski hâl `post_surumleri`
tablosuna yazılıyor (tetikleyici). Yazı başına son 100 sürüm tutuluyor.
Editörde "Sürüm geçmişi" → bir sürüm → "Bu sürümü editöre yükle" → Kaydet.

## Editör (Faz 3)

- **Bloklar** (`src/components/admin/tiptap/SssButonTablo.ts`): SSS,
  buton ve tablo. Blok Ekle menüsünden ya da `/sss`, `/buton`, `/tablo`
  komutlarıyla eklenir.
  - Yazıda en az iki soru-cevap varsa sayfaya FAQPage yapılandırılmış verisi
    ekleniyor (`src/lib/blog-sss.ts`). SSS soruları İçindekiler'e girmiyor.
  - Google 2023'ten beri SSS zengin sonucunu yalnız resmî ve sağlık
    sitelerinde gösteriyor. Veri yine de arama ve yapay zekâ motorlarının
    soruyu cevapla eşleştirmesine yarıyor.
- **SEO kartı** (`src/components/admin/BlogSeoPaneli.tsx`): odak kelime,
  Türkçe analiz (`src/lib/blog-seo-analiz.ts`) ve Google önizlemesi.
  - Aynı odak kelime başka yazıda varsa uyarı veriyor.
  - Odak kelime yalnız panelde; sayfaya basılmıyor.
- **Yayın öncesi kontrol** (`src/lib/blog-yayin-kontrol.ts`): yazı yayına
  alınırken ya da zamanlanırken eksikler bir pencerede listeleniyor.
  Engellemiyor. Toplu yayında gösterilmiyor.
- **Kapak**: görsel yoksa renk ve simge seçilebiliyor (`kapak_ton`,
  `kapak_simge`); boşsa kategorinin görünümü kullanılıyor. Görsel varsa alt
  metin alanı var (`kapak_alt`); boşsa yazı başlığı kullanılıyor.
- **Etiketler**: var olan etiketler öneriliyor. Aynı adrese düşen farklı
  yazım ("meta ads" ↔ "Meta Ads") kayıtta var olan yazıma çevriliyor.
- **Toplu işlem** (Blog listesi): kategori değiştir, yayınla, taslağa al,
  sil. Yayından kalkan ya da silinen yazılar için tek yönlendirme kararı
  veriliyor.

## İçerik güvenliği

Gövde HTML'i sayfaya basılmadan önce izin listesiyle temizleniyor
(`src/lib/blog-temizle.ts`). Script, olay öznitelikleri, satır içi stil ve
`javascript:` adresleri geçmiyor. Yalnız YouTube ve Vimeo gömülebiliyor.
Gövdedeki H1 H2'ye iniyor.

Editöre yeni bir blok eklenirse işaretlemesi izin listesine de eklenmeli.
Eklenmezse blok yayında sökülür.

## WordPress görselleri

Taşınan yazıların görselleri hâlâ WordPress sunucusundan geliyor
(`/wp-content/uploads/...`). Bunları taşıma aracı: Blog → WordPress taşıma.

1. **Görselleri kopyala**: dosyalar `kapaklar` kovasına, `blog/wp/YIL/AY/` altına
   kopyalanır. Yazılara dokunulmaz.
2. **Adresleri güncelle**: yalnız kopyası doğrulanmış görsellerin adresi
   `/dosya/kapaklar/blog/wp/...` olur. Her değişen yazının eski hâli sürüm
   geçmişinde kalır.

Araç `WORDPRESS_KAYNAK` ortam değişkenini kullanıyor
(https://wp.ahmetekinciakademi.com).

Araç "Yazılarda WordPress'e bağlı görsel kalmadı" dedikten sonra WordPress
sunucusu blog için gerekmiyor.

## Yayına alma sırası (Faz 1)

1. **Önce veritabanı** (onayla): `supabase/migrations/20261028120000_blog_altyapi.sql`
   ve `20261028120100_blog_kategorileri.sql`. Migration eski kodla da uyumlu,
   önce uygulanması güvenli.
2. **Sonra kod**. Yeni kod `zamanlanan_tarih` ve `hic_yayinlandi` kolonlarını
   okuyor. Migration'dan önce dağıtılırsa blog listeleri boş görünür.
3. Yayından sonra:
   - Blog → Yönlendirmeler açılıyor mu?
   - Bir taslağı 2 dakika sonrasına zamanla; yayına giriyor mu?
   - Blog → WordPress taşıma: görsel sayısı görünüyor mu?

## Yayına alma sırası (Faz 3)

1. **Önce veritabanı** (onayla): `supabase/migrations/20261029120000_blog_faz3.sql`.
   Yalnız yeni kolon ekliyor; eski kodla uyumlu.
2. **Sonra kod**. Yeni kod `odak_kelime`, `kapak_ton`, `kapak_simge`,
   `kapak_alt` kolonlarını okuyor. Migration'dan önce dağıtılırsa blog
   listeleri boş görünür.
