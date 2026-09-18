/**
 * Tarayıcı tarafı görsel optimizasyonu — Supabase'e YALNIZCA hazır dosya gider.
 *
 * Amaç: büyük PNG/JPG ekran görüntüleri Storage'a gitmeden önce tarayıcıda
 * küçültülüp (uzun kenar ≤ 2000 px) mümkünse WebP'ye çevrilsin. Sıkıştırma ve
 * yeniden boyutlandırma Canvas / createImageBitmap ile yapılıyor; ekstra
 * bağımlılık yok, Supabase'te compute yükü oluşmuyor.
 *
 * Kurallar (spec):
 *  - JPG/PNG → WebP; uzun kenar > 2000 ise küçült, ASLA büyütme, en/boy korunur.
 *  - WebP → zaten WebP ise yeniden encode etme; yalnızca çok büyükse resize.
 *  - GIF → animasyonluysa dokunma (WebP'ye çevirme, animasyonu kaybetme).
 *  - SVG → olduğu gibi bırak (vektör; canvas'a sokmak anlamsız ve kayıplı).
 *  - EXIF orientation createImageBitmap ile düzeltiliyor.
 *  - Optimize dosya orijinalden büyükse orijinali (daha küçüğü) tercih et.
 *  - WebP encode başarısız olursa akış bozulmuyor: orijinal/uygun sürüm kalıyor.
 */

export const MAKS_UZUN_KENAR = 2000;
export const WEBP_KALITE = 0.85;
/** Ekran görüntüsü/grafik (PNG kaynak): küçük yazılar bozulmasın diye biraz yüksek. */
export const WEBP_KALITE_GRAFIK = 0.92;
export const MAKS_DOSYA_BAYT = 20 * 1024 * 1024; // 20 MB

const IZINLI = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]);

export type OptimizeSonuc = {
  blob: Blob;
  /** Dosya uzantısı (webp/jpg/png/gif/svg). */
  uzanti: string;
  mime: string;
  genislik: number | null;
  yukseklik: number | null;
  orijinalBoyut: number;
  optimizeBoyut: number;
  /** Ne yapıldığı: bilgilendirme/test için. */
  islem: "webp" | "resize-webp" | "kopya" | "orijinal";
};

export class GorselHatasi extends Error {}

/** İlk baytlardan gerçek türü belirler (uzantıya güvenilmiyor). */
async function turSapta(file: File): Promise<string | null> {
  const bas = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const b = (i: number) => bas[i];
  // JPEG FF D8 FF
  if (b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return "image/jpeg";
  // PNG 89 50 4E 47
  if (b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4e && b(3) === 0x47) return "image/png";
  // GIF 47 49 46 38
  if (b(0) === 0x47 && b(1) === 0x49 && b(2) === 0x46 && b(3) === 0x38) return "image/gif";
  // WEBP: RIFF ... WEBP
  if (b(0) === 0x52 && b(1) === 0x49 && b(2) === 0x46 && b(3) === 0x46 && b(8) === 0x57 && b(9) === 0x45)
    return "image/webp";
  // SVG: metin; "<svg" ya da "<?xml" içeriyor mu
  const metin = new TextDecoder().decode(bas).trim().toLowerCase();
  if (metin.startsWith("<svg") || metin.startsWith("<?xml")) return "image/svg+xml";
  return null;
}

/** GIF birden çok kare içeriyor mu (kaba ama güvenilir animasyon tespiti). */
async function gifAnimasyonlu(file: File): Promise<boolean> {
  const veri = new Uint8Array(await file.arrayBuffer());
  // Grafik Kontrol Uzantısı (0x21 0xF9) sayısı > 1 ise animasyon.
  let kare = 0;
  for (let i = 0; i + 1 < veri.length; i++) {
    if (veri[i] === 0x21 && veri[i + 1] === 0xf9) {
      kare++;
      if (kare > 1) return true;
    }
  }
  return false;
}

async function canvasBlob(canvas: HTMLCanvasElement, mime: string, kalite: number): Promise<Blob | null> {
  return new Promise((coz) => canvas.toBlob((b) => coz(b), mime, kalite));
}

const uzantiFor: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

/**
 * Bir görsel dosyasını optimize eder. Tarayıcıda çalışır (Canvas/createImageBitmap).
 */
export async function optimizeGorsel(file: File): Promise<OptimizeSonuc> {
  const bildirilen = file.type || "";
  const gercek = (await turSapta(file)) ?? (IZINLI.has(bildirilen) ? bildirilen : null);

  if (!gercek || !IZINLI.has(gercek)) {
    throw new GorselHatasi("Bu dosya türü desteklenmiyor. JPG, PNG, WebP, GIF veya SVG yükleyin.");
  }
  if (gercek !== "image/svg+xml" && file.size > MAKS_DOSYA_BAYT) {
    throw new GorselHatasi("Görsel çok büyük (20 MB üstü). Lütfen daha küçük bir dosya yükleyin.");
  }

  const orijinal = () =>
    ({
      blob: file,
      uzanti: uzantiFor[gercek] ?? "bin",
      mime: gercek,
      genislik: null,
      yukseklik: null,
      orijinalBoyut: file.size,
      optimizeBoyut: file.size,
      islem: "orijinal",
    }) satisfies OptimizeSonuc;

  // SVG: dokunma.
  if (gercek === "image/svg+xml") return orijinal();

  // Animasyonlu GIF: dokunma.
  if (gercek === "image/gif" && (await gifAnimasyonlu(file))) return orijinal();

  // Raster: decode + (gerekiyorsa) resize + WebP.
  if (typeof createImageBitmap !== "function") {
    // Çok eski tarayıcı: dönüşüm yapmadan orijinali yükle (akışı bozma).
    return orijinal();
  }

  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return orijinal();
  }

  const dogalW = bmp.width;
  const dogalH = bmp.height;
  const olcek = Math.min(1, MAKS_UZUN_KENAR / Math.max(dogalW, dogalH));
  const hedefW = Math.max(1, Math.round(dogalW * olcek));
  const hedefH = Math.max(1, Math.round(dogalH * olcek));
  const kucultuldu = olcek < 1;

  // Zaten WebP ve küçültme gerekmiyorsa: yeniden encode etme.
  if (gercek === "image/webp" && !kucultuldu) {
    bmp.close?.();
    return {
      blob: file,
      uzanti: "webp",
      mime: "image/webp",
      genislik: dogalW,
      yukseklik: dogalH,
      orijinalBoyut: file.size,
      optimizeBoyut: file.size,
      islem: "kopya",
    };
  }

  // Büyük görselde bellek için decode sırasında küçült.
  if (kucultuldu) {
    try {
      bmp.close?.();
      bmp = await createImageBitmap(file, {
        imageOrientation: "from-image",
        resizeWidth: hedefW,
        resizeHeight: hedefH,
        resizeQuality: "high",
      });
    } catch {
      // resize seçenekleri desteklenmiyorsa canvas ölçeklemesine düşülür.
      bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = hedefW;
  canvas.height = hedefH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bmp.close?.();
    return orijinal();
  }
  ctx.drawImage(bmp, 0, 0, hedefW, hedefH);
  bmp.close?.();

  // PNG (ekran görüntüsü/grafik) daha yüksek kalite; JPG/WebP fotoğraf için 0.85.
  const kalite = gercek === "image/png" ? WEBP_KALITE_GRAFIK : WEBP_KALITE;

  let webp: Blob | null = null;
  try {
    webp = await canvasBlob(canvas, "image/webp", kalite);
  } catch {
    webp = null;
  }

  // WebP encode başarısız → orijinali (küçültme yapıldıysa boyut bilgisiyle) kullan.
  if (!webp) {
    return {
      ...orijinal(),
      genislik: dogalW,
      yukseklik: dogalH,
    };
  }

  // Optimize dosya orijinalden büyük ve küçültme de olmadıysa: orijinali tercih et.
  if (webp.size >= file.size && !kucultuldu) {
    return {
      blob: file,
      uzanti: uzantiFor[gercek] ?? "bin",
      mime: gercek,
      genislik: dogalW,
      yukseklik: dogalH,
      orijinalBoyut: file.size,
      optimizeBoyut: file.size,
      islem: "orijinal",
    };
  }

  return {
    blob: webp,
    uzanti: "webp",
    mime: "image/webp",
    genislik: hedefW,
    yukseklik: hedefH,
    orijinalBoyut: file.size,
    optimizeBoyut: webp.size,
    islem: kucultuldu ? "resize-webp" : "webp",
  };
}

/** İnsan-okur boyut (test/hata ayıklama ve UX için). */
export function boyutMetni(bayt: number): string {
  if (bayt < 1024) return `${bayt} B`;
  if (bayt < 1024 * 1024) return `${Math.round(bayt / 1024)} KB`;
  return `${(bayt / (1024 * 1024)).toFixed(1)} MB`;
}
