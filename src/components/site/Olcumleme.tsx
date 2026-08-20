import Script from "next/script";
import { getOlcumleme, olcumlemeAcik } from "@/lib/olcumleme";
import { IZIN_CEREZI } from "@/lib/izin";

/**
 * Eski localStorage anahtarı.
 *
 * Artık yazılmıyor; yalnızca bir kez okunup çereze taşınıyor. Kaldırılsaydı
 * daha önce seçim yapmış herkese bant yeniden çıkardı — verilmiş bir izni
 * unutmak, hiç sormamaktan kötü.
 */
export const IZIN_ANAHTARI = "aea-cerez-izni";

/**
 * Consent Mode v2 önyüklemesi. gtag.js'ten ÖNCE ve senkron çalışması şart,
 * yoksa Google etiketleri izin bilinmeden bir kez ateşlenir.
 *
 * next/script'in beforeInteractive stratejisi burada işe yaramadı: script
 * gerçek bir <script> etiketi olarak basılmak yerine RSC payload'ına
 * serileşiyor ve ancak hidrasyonda çalışıyor. Bu yüzden kök layout'un
 * <head>'ine düz inline script olarak konuyor — tarayıcı onu sırası gelince
 * bloklayarak çalıştırır, garanti budur.
 *
 * Varsayılan: her şey reddedilmiş. Ziyaretçi daha önce seçim yaptıysa onu
 * senkron okuyup default olarak veriyoruz; aksi halde geri dönen kullanıcı
 * bant hidrate olana kadar boşuna "izinsiz" sayılırdı.
 */
export const ONYUKLEME = `
(function () {
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;

  /*
    İzin ÖNCE çerezden okunuyor.

    Çerez .ahmetekinciakademi.com kapsamında yazılıyor, yani WordPress'teki
    ana sitede verilen izin panelde de görülüyor. localStorage bunu yapamaz
    ve eskiden aynı ziyaretçi iki mülkte iki kez sorulurdu.

    localStorage yalnızca GERİYE DÖNÜK okunuyor: çerezden önce seçim yapmış
    ziyaretçiye bant yeniden çıkmasın diye. Çereze taşıma işini bandın kendisi
    yapıyor; burada yazma yok, bu script yalnızca varsayılanı kuruyor.
  */
  var kayit = null;
  try {
    var ad = ${JSON.stringify(IZIN_CEREZI)} + '=';
    var hepsi = document.cookie ? document.cookie.split(';') : [];
    for (var i = 0; i < hepsi.length; i++) {
      var p = hepsi[i].trim();
      if (p.indexOf(ad) === 0) { kayit = JSON.parse(decodeURIComponent(p.slice(ad.length))); break; }
    }
  } catch (e) {}
  if (!kayit) {
    try { kayit = JSON.parse(window.localStorage.getItem(${JSON.stringify(IZIN_ANAHTARI)})); } catch (e) {}
  }

  // Global Privacy Control tarayıcıdan gelen yasal bir ret sinyali:
  // kullanıcı ne seçmiş olursa olsun reklam izni verilmez.
  var gpc = window.navigator && window.navigator.globalPrivacyControl === true;

  var analitik = kayit && kayit.analitik ? 'granted' : 'denied';
  var reklam = (kayit && kayit.reklam && !gpc) ? 'granted' : 'denied';

  gtag('consent', 'default', {
    ad_storage: reklam,
    ad_user_data: reklam,
    ad_personalization: reklam,
    analytics_storage: analitik,
    functionality_storage: 'granted',
    security_storage: 'granted',
    wait_for_update: 500
  });

  // İzin yokken Google'a giden isteklerden tanımlayıcılar çıkarılsın.
  gtag('set', 'ads_data_redaction', reklam !== 'granted');
  gtag('set', 'url_passthrough', true);
})();
`;

export async function Olcumleme() {
  const o = await getOlcumleme();

  // Panelde hiçbir tanımlayıcı yoksa tek satır script bile basmıyoruz.
  if (!olcumlemeAcik(o)) return null;

  return (
    <>
      {o.gtm ? (
        // GTM varsa GA4'ü de o yönetir. İkisini birden yüklemek olayları
        // çift saydırır, bu yüzden GTM tek başına kazanır.
        <Script id="gtm-yukleyici" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${o.gtm}');`}
        </Script>
      ) : (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${o.ga4}`}
            strategy="afterInteractive"
          />
          <Script id="gtag-yapilandirma" strategy="afterInteractive">
            {`gtag('js', new Date());
gtag('config', '${o.ga4}');${o.adsId ? `\ngtag('config', '${o.adsId}');` : ""}`}
          </Script>
        </>
      )}
    </>
  );
}
