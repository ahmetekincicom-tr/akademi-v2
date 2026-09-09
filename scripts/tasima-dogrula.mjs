/*
  Taşıma doğrulaması — ahmetekinciakademi.com

  WordPress'ten bu projeye geçtikten sonra çalıştırılıyor. Eski sitede
  indekslenmiş 56 adresin tamamını tek tek çağırıp üç şeye bakıyor:

    1. Sonuç 200 mü?          → 404 varsa o sayfanın sıralaması gider
    2. Kaç sıçrama etti?      → 2+ zincir demek, her sıçrama değer eritiyor
    3. Nerede bitti?          → yönlendirmeler doğru hedefe mi gidiyor

  Adres listesi Rank Math'in ürettiği üç site haritasından alındı
  (sayfalar 29 + yazılar 23 + kategoriler 4).

  Kullanım:
    node scripts/tasima-dogrula.mjs
    node scripts/tasima-dogrula.mjs https://akademi-v2.vercel.app   (önce prova)
*/

const TEMEL = (process.argv[2] ?? "https://ahmetekinciakademi.com").replace(/\/$/, "");

/** Yeni projenin karşıladığı, 301 ile taşınan adresler: eski → beklenen yeni. */
const YONLENDIRILEN = {
  "/birebir-meta-business-egitimi-2026/": "/egitimler/meta-ads-egitimi/",
  "/birebir-sosyal-medya-ve-reklam-uzmanligi-egitimi-2026/": "/egitimler/sosyal-medya-ve-reklam-egitimi/",
  "/birebir-yapay-zeka-egitimi/": "/egitimler/yapay-zeka-egitimi/",
  "/ankara-sosyal-medya-reklam-egitimi/": "/egitimler/ankara-sosyal-medya-meta-ads-egitimi/",
  "/isletmeler-icin-sosyal-medya-reklam-egitimi/": "/egitimler/isletmelere-ozel-sosyal-medya-ve-reklam-egitimi/",
  "/birebir-egitimler/": "/egitimler/",
  "/kurumsal-meta-ads-egitimi/": "/kurumsal/",
  "/sartlar-ve-kosullar/": "/uyelik-sozlesmesi/",
  "/cerez-politikasi/": "/gizlilik-politikasi/",
  // Site haritasında yoktu ama dış bağlantıları olabilir; taşımada 404
  // verdikleri görülünce eklendi.
  "/birebir-meta-ads-egitimi/": "/egitimler/meta-ads-egitimi/",
  "/birebir-meta-ads-egitimi-2026/": "/egitimler/meta-ads-egitimi/",
};

/** Site haritasındaki sayfalar (29). */
const SAYFALAR = [
  "/",
  "/birebir-yapay-zeka-egitimi/",
  "/birebir-egitimler/",
  "/satis-sozlesmesi/",
  "/iptal-iade-politikasi/",
  "/birebir-meta-business-egitimi-2026/",
  "/birebir-sosyal-medya-ve-reklam-uzmanligi-egitimi-2026/",
  "/yorumlar/",
  "/freelance-mentorluk-programi/",
  "/isletmeler-icin-sosyal-medya-reklam-egitimi/",
  "/kurumsal-meta-ads-egitimi/",
  "/referanslar/",
  "/is-ortaklarimiz/",
  "/on-bilgilendirme-formu/",
  "/gizlilik-politikasi/",
  "/manage-profile/",
  "/ankara-sosyal-medya-reklam-egitimi/",
  "/kisisel-verilerin-islenmesi/",
  "/hakkimizda/",
  "/iletisim/",
  "/birebir-influencer-ugc-olma-egitimi/",
  "/birebir-adobe-after-effects-egitimi-2025/",
  "/birebir-adobe-photoshop-egitimi/",
  "/elementor-12265/",
  "/checkout-3/",
  "/sepet-2/",
  "/sartlar-ve-kosullar/",
  "/cerez-politikasi/",
  "/bakim/",
  // Site haritasında olmayan, geçmişte paylaşılmış eski eğitim adresleri.
  "/birebir-meta-ads-egitimi/",
  "/birebir-meta-ads-egitimi-2026/",
];

/** Blog yazıları (23) — WordPress'te kalıyor, adresleri değişmemeli. */
const YAZILAR = [
  "/blog/",
  "/meta-ads-mcp-baglantisi-nasil-yapilir/",
  "/instagram-hesaplari-neden-kapaniyor/",
  "/meta-advantage-plus-kampanyasi-nedir/",
  "/instagramda-ucretli-mavi-tik-meta-verified/",
  "/meta-business-reklamlarinda-crm-kullanimi/",
  "/yeni-medya-bolumu-nedir/",
  "/meta-business-andromeda-guncellemesi-nedir/",
  "/dijital-pazarlama-uzmani-nasil-olunur/",
  "/meta-capi-nedir/",
  "/nasil-sosyal-medya-uzmani-olunur/",
  "/instagram-reklamlari-meta-piksel-rehberi/",
  "/2026-sosyal-medya-yonetimi-ucretleri/",
  "/instagram-bot-takipciler-nasil-silinir/",
  "/instagram-isletme-konumu-nasil-eklenir/",
  "/sosyal-medya-egitimi-fiyatlari/",
  "/meta-business-ozel-donusumler-nedir/",
  "/meta-business-manager-nedir/",
  "/instagram-reklamlarinda-yapilan-5-hata/",
  "/tiktok-ve-ugc-marketing/",
  "/tiktok-business-center-nedir/",
  "/tiktok-shop-nedir-nasil-calisir/",
  "/sosyal-medya-analiz-araclari-2025/",
];

/** Kategori arşivleri (4) — bunlar da WordPress'te. */
const KATEGORILER = [
  "/sosyal-medya/",
  "/meta-business-manager/",
  "/dijital-pazarlama/",
  "/dijital-pazarlama/tiktok/",
];

/**
 * Yönlendirmeleri elle takip ediyoruz — otomatik takip sıçrama sayısını
 * gizlerdi, oysa asıl bakmak istediğimiz şey o.
 */
async function izle(yol) {
  let adres = TEMEL + yol;
  const zincir = [];

  for (let i = 0; i < 6; i++) {
    let cevap;
    try {
      cevap = await fetch(adres, { redirect: "manual", headers: { "user-agent": "tasima-dogrula" } });
    } catch (hata) {
      return { durum: 0, sicrama: zincir.length, son: adres, zincir, hata: String(hata.message) };
    }

    if (cevap.status >= 300 && cevap.status < 400) {
      const hedef = cevap.headers.get("location");
      if (!hedef) return { durum: cevap.status, sicrama: zincir.length, son: adres, zincir };
      zincir.push(cevap.status);
      adres = new URL(hedef, adres).toString();
      continue;
    }
    return { durum: cevap.status, sicrama: zincir.length, son: adres, zincir };
  }
  return { durum: -1, sicrama: zincir.length, son: adres, zincir, hata: "çok fazla yönlendirme (döngü?)" };
}

const sorunlar = [];
let sayac = 0;

async function kontrol(yol, tur) {
  const s = await izle(yol);
  sayac++;

  const beklenenHedef = YONLENDIRILEN[yol];
  const bitis = s.son.replace(TEMEL, "");

  if (s.durum !== 200) {
    sorunlar.push({ yol, tur, sorun: `durum ${s.durum}${s.hata ? " — " + s.hata : ""}`, bitis });
  } else if (beklenenHedef && bitis !== beklenenHedef) {
    sorunlar.push({ yol, tur, sorun: `yanlış hedef (beklenen ${beklenenHedef})`, bitis });
  } else if (beklenenHedef && s.sicrama !== 1) {
    sorunlar.push({ yol, tur, sorun: `${s.sicrama} sıçrama — tek olmalı`, bitis });
  } else if (!beklenenHedef && s.sicrama > 0) {
    sorunlar.push({ yol, tur, sorun: `${s.sicrama} sıçrama — adres değişmemeliydi`, bitis });
  }
}

console.log(`Hedef: ${TEMEL}\n`);

for (const [tur, liste] of [
  ["sayfa", SAYFALAR],
  ["yazı", YAZILAR],
  ["kategori", KATEGORILER],
]) {
  process.stdout.write(`${tur} kontrol ediliyor (${liste.length}) `);
  for (const yol of liste) {
    await kontrol(yol, tur);
    process.stdout.write(".");
  }
  process.stdout.write("\n");
}

console.log(`\n${sayac} adres kontrol edildi.`);

if (sorunlar.length === 0) {
  console.log("\nSORUN YOK — hepsi 200, yönlendirmeler tek sıçrama, adresler yerinde.");
} else {
  console.log(`\n${sorunlar.length} SORUN:\n`);
  for (const s of sorunlar) {
    console.log(`  [${s.tur}] ${s.yol}`);
    console.log(`      ${s.sorun}`);
    console.log(`      bitiş: ${s.bitis}\n`);
  }
  process.exitCode = 1;
}
