"use client";

import { IZIN_CEREZI, cerezdenOku, izniCoz, reklamIzniVar } from "@/lib/izin";

/**
 * Tarayıcı tarafındaki pixel çağrıları.
 *
 * Sunucu (CAPI) satın almayı ve formu taşıyor; burada kalan iki şey sayfa
 * görüntüleme ve program inceleme. İkisi de sunucudan üretilemiyor ve kitle
 * oluşturmanın temeli.
 */

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void };
    _fbq?: unknown;
  }
}

type Kuyruklu = NonNullable<Window["fbq"]> & {
  push: unknown;
  loaded: boolean;
  version: string;
  queue: unknown[];
};

/**
 * init yalnızca bir kez.
 *
 * Modül seviyesinde, bileşen state'inde değil: gezinmede bileşen yeniden
 * çizilse de sekmede tek bir init kalıyor. İkinci bir init, Meta'nın her
 * olayı iki kez saymasına yol açıyor.
 */
let baslatildi = false;

/**
 * init'ten ÖNCE gelen olaylar burada bekliyor.
 *
 * Sebebi React'in efekt sırası: alt bileşenlerin efektleri üst bileşenlerden
 * ÖNCE çalışıyor. Pixel kök düzende, ViewContent ise sayfada — yani olay,
 * pixel açılmadan önce gönderilmeye çalışılıyor. Meta'nın kendi kuyruğu bunu
 * kurtarmıyor: init'ten önceki track çağrısı sıraya girse de hatalı işleniyor.
 *
 * Doğrudan bir "gecikmeli çağrı" (setTimeout) da işe yarardı ama sırayı
 * tesadüfe bırakırdı.
 */
const bekleyen: { olay: string; ozel?: Record<string, unknown> }[] = [];

export function izinVarMi(): boolean {
  if (typeof document === "undefined") return false;
  if (window.navigator?.globalPrivacyControl === true) return false;
  return reklamIzniVar(izniCoz(cerezdenOku(document.cookie, IZIN_CEREZI)));
}

/**
 * Meta'nın kendi yükleyicisi.
 *
 * Meta'dan geldiği gibi duruyor, bilerek: sadeleştirilmiş kopyaları
 * fbevents.js iki kez yüklendiğinde ya da fbq init'ten önce çağrıldığında
 * sessizce olay kaybediyor. Kuyruk mantığı (n.queue) tam olarak bunun için.
 */
function yukleyiciyiCalistir() {
  if (window.fbq) return;

  const n = function (...args: unknown[]) {
    if (n.callMethod) n.callMethod(...args);
    // fbevents.js henüz inmediyse çağrılar kuyrukta bekliyor ve script
    // yüklenince sırayla çalışıyor. Kuyruk olmasaydı ilk PageView kaybolurdu.
    else n.queue.push(args);
  } as Kuyruklu;

  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];
  window.fbq = n;
  window._fbq = n;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
}

/** Pixel'i açar ve bekleyen olayları akıtır. Yalnızca MetaPixel çağırıyor. */
export function pixeliBaslat(pixelId: string) {
  if (!izinVarMi()) return false;

  if (!baslatildi) {
    yukleyiciyiCalistir();
    window.fbq?.("init", pixelId);
    baslatildi = true;

    while (bekleyen.length) {
      const olay = bekleyen.shift()!;
      window.fbq?.("track", olay.olay, olay.ozel);
    }
  }
  return true;
}

/** Standart bir olay gönderir; pixel henüz açılmadıysa sıraya alır. */
export function pixelOlay(olay: string, ozel?: Record<string, unknown>) {
  if (!izinVarMi()) return;

  if (!baslatildi) {
    // Sınır: izin hiç verilmezse bu dizi sonsuza kadar büyümesin.
    if (bekleyen.length < 20) bekleyen.push({ olay, ozel });
    return;
  }
  window.fbq?.("track", olay, ozel);
}
