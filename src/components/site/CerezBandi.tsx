"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { IZIN_ANAHTARI } from "@/components/site/Olcumleme";
import { useNativeUygulama } from "@/lib/native";
import { IZIN_CEREZI, IZIN_DEGISTI, cerezdenOku, izniCoz, izniYaz, type Izin } from "@/lib/izin";

/** Footer'daki "Çerez tercihleri" bağlantısı bandı yeniden açmak için kullanır. */
export const CEREZ_ACMA_OLAYI = "aea:cerez-ayarlari";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
  // Henüz standart lib.dom tanımında yok; Firefox ve Brave gönderiyor.
  interface Navigator {
    globalPrivacyControl?: boolean;
  }
}

function izniUygula(izin: Izin) {
  // GPC açıksa reklam izni kullanıcı verse de geçmez; önyükleme ile aynı kural.
  const gpc = window.navigator?.globalPrivacyControl === true;
  const reklam = izin.reklam && !gpc ? "granted" : "denied";
  const analitik = izin.analitik ? "granted" : "denied";

  window.gtag?.("consent", "update", {
    ad_storage: reklam,
    ad_user_data: reklam,
    ad_personalization: reklam,
    analytics_storage: analitik,
  });
  window.gtag?.("set", "ads_data_redaction", reklam !== "granted");
}


/** localStorage okunamadığında da bir şey döndürmeliyiz. */
const BILINMIYOR = "bilinmiyor";

function kaydet(izin: Izin) {
  izniYaz(izin);
  window.dispatchEvent(new Event(IZIN_DEGISTI));
  izniUygula(izin);
}

/**
 * Eski localStorage seçimini çereze taşır.
 *
 * Bir kez, sessizce. Taşınmasaydı daha önce seçim yapmış herkese bant yeniden
 * çıkardı — verilmiş bir izni unutmak, hiç sormamaktan kötü: kişi kararının
 * dikkate alınmadığını görür.
 *
 * localStorage kaydı SİLİNMİYOR. Çerez yazılamayan bir tarayıcıda (gizli
 * sekme, sıkı ayar) silmek, elimizdeki tek kaydı da yok etmek olurdu.
 */
function eskiSecimiTasi() {
  try {
    if (cerezdenOku(document.cookie, IZIN_CEREZI)) return;
    const eski = izniCoz(window.localStorage.getItem(IZIN_ANAHTARI));
    if (eski) izniYaz(eski);
  } catch {
    // Depolama kapalı; taşınacak bir şey yok.
  }
}

/*
  Taşıma modül yüklenirken, İLK ÇİZİMDEN ÖNCE çalışıyor — efekt içinde değil.

  Efekte konsaydı ilk boyamadan sonra çalışırdı ve izin vermiş ziyaretçi bandın
  bir kare boyunca açılıp kapandığını görürdü. Aynı kaygı useSyncExternalStore
  seçiminin de sebebi.
*/
if (typeof document !== "undefined") eskiSecimiTasi();

/**
 * Seçim çerezde, yani React'in dışında duruyor. useSyncExternalStore ile
 * okumak iki sorunu birden çözüyor: efekt içinde setState çağırmıyoruz ve
 * sunucu render'ında bant basılmadığı için izin vermiş ziyaretçide bir anlık
 * bant görünüp kaybolmuyor.
 *
 * "storage" olayı dinlenmeye devam ediyor: çerez başka sekmede değiştiğinde
 * olay üretmiyor ama eski kaydı taşıyan bir sekme hâlâ üretebilir.
 */
function izneAbone(geriCagir: () => void) {
  window.addEventListener("storage", geriCagir);
  window.addEventListener(IZIN_DEGISTI, geriCagir);
  return () => {
    window.removeEventListener("storage", geriCagir);
    window.removeEventListener(IZIN_DEGISTI, geriCagir);
  };
}

function izniOku(): string {
  try {
    return cerezdenOku(document.cookie, IZIN_CEREZI) ?? "";
  } catch {
    return "";
  }
}

function sunucudaOku(): string {
  return BILINMIYOR;
}

export function CerezBandi() {
  const kayitli = useSyncExternalStore(izneAbone, izniOku, sunucudaOku);
  const [zorlaAcik, setZorlaAcik] = useState(false);
  const [detay, setDetay] = useState(false);
  const [analitik, setAnalitik] = useState(true);
  const [reklam, setReklam] = useState(false);

  // Henüz seçim yapılmadıysa kendiliğinden çıkar; footer bağlantısı ise
  // seçim yapılmış olsa da yeniden açar.
  const gorunur = zorlaAcik || kayitli === "";
  // iOS uygulamasında sorulacak bir şey yok: orada hiçbir takip başlamıyor
  // (lib/izin → uygulamaIcinde). Bant çıksaydı verilen onay ATT'nin yerine de
  // geçmezdi.
  const native = useNativeUygulama();

  useEffect(() => {
    const ac = () => {
      setDetay(true);
      setZorlaAcik(true);
    };
    window.addEventListener(CEREZ_ACMA_OLAYI, ac);
    return () => window.removeEventListener(CEREZ_ACMA_OLAYI, ac);
  }, []);

  const bitir = useCallback((secim: { analitik: boolean; reklam: boolean }) => {
    kaydet({ ...secim, tarih: new Date().toISOString() });
    setZorlaAcik(false);
    setDetay(false);
  }, []);

  if (!gorunur || native) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Çerez tercihleri"
      className="fixed inset-x-0 bottom-0 z-[9998] p-2 sm:p-5"
    >
      {/*
        Yükseklik güvenliği. Bant sabit konumlu; içeriği ekrandan uzun olursa
        düğmeler görünmez alana taşar ve kişi izni veremeden sıkışıp kalır —
        dar/yatay telefonlarda ve işletim sisteminde yazı boyutu büyütülmüşken
        gerçekten oluyor. Kart en fazla ekranın %85'i; metin bölümü gerekirse
        kendi içinde kayıyor, düğme sırası (flex-none) her zaman görünür kalıyor.
      */}
      <div className="mx-auto flex max-h-[85vh] max-w-[760px] flex-col rounded-2xl border border-ink/13 bg-white p-3.5 shadow-[0_10px_40px_rgba(10,13,24,0.16)] sm:p-5">
        {/* Kayabilen bölüm: yer daralınca kısılan taraf metin olsun, düğmeler değil. */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <h2 className="font-heading text-[15px] font-semibold tracking-[-0.02em] sm:text-[17px]">
            Çerez tercihleri
          </h2>
          <p className="mt-1.5 text-[13px] leading-[1.5] text-[#5C6273] sm:text-[13.5px]">
            Deneyimini iyileştirmek ve reklam performansını ölçmek için çerez kullanıyoruz.{" "}
            <Link href="/gizlilik-politikasi" className="text-brand underline underline-offset-2">
              Gizlilik Politikası
            </Link>
          </p>

          {detay && (
            <div className="mt-4 flex flex-col gap-3 rounded-[12px] bg-mist p-4">
              <label className="flex items-start gap-3">
                <input type="checkbox" checked disabled className="mt-[3px] h-4 w-4 flex-none accent-[#1C56F3]" />
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-semibold">Zorunlu çerezler</span>
                  <span className="mt-[2px] block text-[12.5px] text-[#656B7A]">
                    Oturum yönetimi ve güvenlik için gereklidir; devre dışı bırakılamaz.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={analitik}
                  onChange={(e) => setAnalitik(e.target.checked)}
                  className="mt-[3px] h-4 w-4 flex-none accent-[#1C56F3]"
                />
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-semibold">Analitik çerezler</span>
                  <span className="mt-[2px] block text-[12.5px] text-[#656B7A]">
                    Sayfaların nasıl kullanıldığını anonim olarak ölçerek hizmetimizi geliştirmemize yardımcı olur.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={reklam}
                  onChange={(e) => setReklam(e.target.checked)}
                  className="mt-[3px] h-4 w-4 flex-none accent-[#1C56F3]"
                />
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-semibold">Reklam ölçümü çerezleri</span>
                  <span className="mt-[2px] block text-[12.5px] text-[#656B7A]">
                    Reklam kampanyalarımızın etkinliğini ölçmek için kullanılır.
                  </span>
                </span>
              </label>
            </div>
          )}
        </div>

        {/*
          basis ile sarmalıyor: dar ekranda butonlar ezilmek yerine alt satıra
          iner. basis-[120px]: 150px'te 320-360px'lik telefonlarda her düğme
          kendi satırına düşüyor ve bant bir buçuk satır boyu uzuyordu; 120px
          ile ikisi yan yana sığıyor. flex-none: kart kısalsa da düğme sırası
          asla kırpılmıyor.
        */}
        <div className="mt-3 flex flex-none flex-wrap gap-2">
          <button
            type="button"
            onClick={() => bitir({ analitik: true, reklam: true })}
            className="h-10 grow basis-[120px] rounded-[10px] bg-brand px-5 text-sm font-semibold text-white transition hover:bg-ink"
          >
            Tümünü kabul et
          </button>
          <button
            type="button"
            onClick={() => bitir({ analitik: false, reklam: false })}
            className="h-10 grow basis-[120px] rounded-[10px] border border-ink/13 bg-white px-5 text-sm font-semibold text-ink transition hover:border-ink"
          >
            Yalnızca zorunlu
          </button>
          {detay ? (
            <button
              type="button"
              onClick={() => bitir({ analitik, reklam })}
              className="h-10 grow basis-[120px] rounded-[10px] border border-ink/13 bg-white px-5 text-sm font-semibold text-ink transition hover:border-ink"
            >
              Tercihlerimi kaydet
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setDetay(true)}
              className="h-10 grow basis-[120px] rounded-[10px] border border-ink/13 bg-white px-5 text-sm font-semibold text-ink transition hover:border-ink"
            >
              Ayarlar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
