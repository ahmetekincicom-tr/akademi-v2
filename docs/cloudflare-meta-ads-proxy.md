# Meta Ads reklam sayfası — Cloudflare Worker reverse proxy

Amaç: `https://ahmetekinciakademi.com/meta-ads-egitimi-2026-2/` adresi, adres
çubuğu **değişmeden** yeni projedeki (Vercel) Meta Ads eğitim sayfasını
göstersin. Ana domaindeki WordPress ve diğer tüm sayfalar aynen çalışmaya
devam etsin. Google Ads için: görünen URL = varış URL (tek domain), yönlendirme
yok.

Ön koşul: `panel.ahmetekinciakademi.com` yayında (bu projeyi sunuyor) ve
`ahmetekinciakademi.com` Cloudflare'de (turuncu bulut / proxied).

Not: Bu proxy yalnızca şu yolları yeni projeye taşır: reklam sayfası, statik
varlıklar (`/_next`), yüklenen görseller (`/dosya`) ve WhatsApp dönüşüm ucu
(`/git`). Diğer her şey WordPress'te kalır.

## 1) Worker kodu

Cloudflare Dashboard → **Workers & Pages → Create → Worker** → adını ver
(ör. `ae-meta-ads-proxy`) → **Deploy** → **Edit code** → aşağıdakini yapıştır →
tekrar **Deploy**.

```js
// Yeni projeyi sunan origin (adres çubuğu buraya DEĞİŞMEDEN içerik buradan gelir)
const ORIGIN = "https://panel.ahmetekinciakademi.com";

// Reklam adresi ve gerçek hedef sayfa
const REKLAM_YOLU = "/meta-ads-egitimi-2026-2";
const HEDEF_SAYFA = "/egitimler/birebir-meta-ads-egitimi";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    let yol = url.pathname;

    // /meta-ads-egitimi-2026-2 (ve alt yolları) → gerçek eğitim sayfası
    if (yol === REKLAM_YOLU || yol === REKLAM_YOLU + "/") {
      yol = HEDEF_SAYFA;
    } else if (yol.startsWith(REKLAM_YOLU + "/")) {
      yol = HEDEF_SAYFA + yol.slice(REKLAM_YOLU.length);
    }
    // /_next, /dosya, /git aynı yolla geçiyor (yol = url.pathname)

    const hedef = ORIGIN + yol + url.search;

    // Host başlığını silip fetch'in doğru Host'u (panel) koymasına izin ver.
    const basliklar = new Headers(request.headers);
    basliklar.delete("host");
    basliklar.set("X-Forwarded-Host", url.host);

    const istek = new Request(hedef, {
      method: request.method,
      headers: basliklar,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
      // ÖNEMLİ: /git/whatsapp wa.me'ye 303 döner; yönlendirmeyi TARAYICI yapsın,
      // Worker izlemesin. Yoksa wa.me içeriği ana domain altında sunulurdu.
      redirect: "manual",
    });

    return fetch(istek);
  },
};
```

## 2) Route'ları bağla (Worker'ı bu yollarda çalıştır)

Worker → **Settings → Domains & Routes → Add → Route**. Zone: `ahmetekinciakademi.com`.
Şu dört route'u ekle:

```
ahmetekinciakademi.com/meta-ads-egitimi-2026-2*
ahmetekinciakademi.com/_next/*
ahmetekinciakademi.com/dosya/*
ahmetekinciakademi.com/git/*
```

Diğer tüm yollar (`/`, `/hakkimizda`, WP sayfaları…) Worker'a uğramaz →
WordPress sunar. Hiçbir şey değişmez.

## 3) Doğrulama

- `https://ahmetekinciakademi.com/meta-ads-egitimi-2026-2/` → yeni Meta Ads
  sayfası, adres çubuğu aynı kalır. Görsel/yazı tam gelir (varlıklar `/_next` ve
  `/dosya`'dan).
- Sayfadaki **WhatsApp** düğmesi → `/git/whatsapp?...` → wa.me'ye açılır,
  ref kodu mesaja düşer (mevcut sistem).
- `https://ahmetekinciakademi.com/` → WordPress, hiç değişmemiş.

## 4) Geri alma

Worker'ın route'larını sil (ya da Worker'ı devre dışı bırak). Adres anında
WordPress'e döner. Kalıcı hiçbir iz kalmaz.

## 5) Google Ads dönüşümü (WhatsApp tıklaması)

Sayfadaki WhatsApp düğmesi sunucu tarafında dönüşümü zaten kaydediyor (temas +
Meta Contact olayı, ref kodu). Ama **Google Ads'in optimize edebilmesi** için
tıklamada bir Google Ads dönüşüm etiketi (gtag) tetiklenmeli:

1. Google Ads → Hedefler → Dönüşümler → yeni dönüşüm (kategori: "İletişim" /
   Lead). Dönüşüm **ID**'si (`AW-XXXXXXXXX`) ve **etiket**'ini al.
2. Bu ID/label'ı bana ver; WhatsApp düğmesine tıklanınca
   `gtag('event','conversion', { send_to: 'AW-XXXX/label' })` tetiklenecek
   şekilde bağlayayım (ölçümleme etiketin panelde tanımlı; onunla çalışır).

Reklam trafiği için sayfa **noindex** kalır — paralı trafikte indekslenmesi
gerekmez, WordPress'le ikiz içerik de oluşmaz.
