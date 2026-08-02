// Ahmet Ekinci Akademi — service worker.
//
// Panelin tamamı sunucuda render ediliyor ve kişiye özel veri taşıyor; bu
// yüzden HTML SAYFALAR HİÇ ÖNBELLEĞE ALINMIYOR. Bir öğrencinin sayfasını
// önbellekten başka birine servis etmek ya da onaylanmış bir ödemeyi eski
// haliyle göstermek, kazandıracağı hızdan çok daha pahalıya patlar.
//
// Önbelleklenen tek şey: statik varlıklar (ikon, font, derlenmiş js/css) ve
// ağ tamamen koptuğunda gösterilecek çevrimdışı sayfa.

const SURUM = "aea-v1";
const KABUK = `kabuk-${SURUM}`;
const CEVRIMDISI = "/cevrimdisi";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(KABUK).then((c) => c.addAll([CEVRIMDISI, "/icon-192.png"])).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((adlar) => Promise.all(adlar.filter((a) => a !== KABUK).map((a) => caches.delete(a))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const istek = event.request;
  if (istek.method !== "GET") return;

  const url = new URL(istek.url);
  if (url.origin !== self.location.origin) return;

  // Sayfa gezinmeleri: her zaman ağdan. Ağ yoksa çevrimdışı sayfası.
  if (istek.mode === "navigate") {
    event.respondWith(fetch(istek).catch(() => caches.match(CEVRIMDISI)));
    return;
  }

  // Statik varlıklar: içerik hash'li olduğu için önce önbellek, sonra ağ.
  const staticVarlik =
    url.pathname.startsWith("/_next/static/") ||
    /\.(png|jpg|jpeg|svg|webp|ico|woff2?)$/i.test(url.pathname);

  if (!staticVarlik) return;

  event.respondWith(
    caches.match(istek).then(
      (bulunan) =>
        bulunan ??
        fetch(istek).then((yanit) => {
          if (yanit.ok) {
            const kopya = yanit.clone();
            caches.open(KABUK).then((c) => c.put(istek, kopya));
          }
          return yanit;
        }),
    ),
  );
});
