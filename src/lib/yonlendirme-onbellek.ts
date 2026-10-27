import { tabloKur, type YonlendirmeSatiri, type YonlendirmeTablosu } from "@/lib/yonlendirme";

/**
 * Yönlendirme tablosunun ara katmandaki önbelleği.
 *
 * Ara katman HER istekte çalışıyor; her istekte veritabanına gitmek sayfa
 * açılışına bir gidiş-dönüş eklerdi. Tablo küçük ve nadiren değişiyor: bir
 * dakika taze sayılıyor. Süresi dolunca eski tablo hemen kullanılıp yenisi
 * arka planda çekiliyor (ziyaretçi beklemiyor). Panelde yapılan değişiklik
 * en geç bir dakika içinde devreye giriyor.
 *
 * Yalnızca soğuk başlangıçta (sunucu örneğinin ilk isteği) bekleniyor, o da
 * 1,5 saniyeyle sınırlı. Okuma başarısızsa (ağ, tablo henüz yok) site
 * yönlendirmesiz çalışmaya devam ediyor ve on saniye boyunca yeniden
 * denenmiyor: arızalı bir veritabanını her istekte dövmemek için.
 */

const TAZE_MS = 60_000;
const HATA_BEKLEME_MS = 10_000;
const ZAMAN_ASIMI_MS = 1_500;

type Onbellek = { tablo: YonlendirmeTablosu; gecerlilik: number };

let onbellek: Onbellek | null = null;
let yukleniyor: Promise<Onbellek> | null = null;

async function cek(): Promise<Onbellek> {
  const kok = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anahtar = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!kok || !anahtar) return { tablo: new Map(), gecerlilik: Date.now() + TAZE_MS };

  try {
    const yanit = await fetch(
      `${kok.replace(/\/$/, "")}/rest/v1/yonlendirmeler?select=kaynak,hedef,kod&aktif=eq.true&limit=10000`,
      {
        headers: { apikey: anahtar, Authorization: `Bearer ${anahtar}` },
        cache: "no-store",
        signal: AbortSignal.timeout(ZAMAN_ASIMI_MS),
      },
    );
    if (!yanit.ok) throw new Error(`HTTP ${yanit.status}`);
    const satirlar = (await yanit.json()) as YonlendirmeSatiri[];
    return { tablo: tabloKur(satirlar), gecerlilik: Date.now() + TAZE_MS };
  } catch (e) {
    console.error("[yonlendirme] tablo okunamadı:", e instanceof Error ? e.message : e);
    // Elde eski tablo varsa onu koru: geçici bir ağ hatası, çalışan
    // yönlendirmeleri bir anda kapatmasın.
    return { tablo: onbellek?.tablo ?? new Map(), gecerlilik: Date.now() + HATA_BEKLEME_MS };
  }
}

function yenile(): Promise<Onbellek> {
  yukleniyor ??= cek().then((sonuc) => {
    onbellek = sonuc;
    yukleniyor = null;
    return sonuc;
  });
  return yukleniyor;
}

/**
 * Güncel tablo. `arkaPlan` ara katmanın waitUntil'i: süresi dolmuş tablo
 * dönerken tazelemenin yanıt gittikten sonra da bitmesini sağlıyor.
 */
export async function yonlendirmeTablosu(arkaPlan?: (is: Promise<unknown>) => void): Promise<YonlendirmeTablosu> {
  if (!onbellek) return (await yenile()).tablo;
  if (Date.now() > onbellek.gecerlilik) {
    const is = yenile();
    arkaPlan?.(is);
  }
  return onbellek.tablo;
}
