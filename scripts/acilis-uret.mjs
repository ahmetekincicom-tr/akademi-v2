import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

/**
 * Açılış ekranı ve uygulama simgesini tek kaynaktan üretir.
 *
 *   node scripts/acilis-uret.mjs
 *
 * Kaynak public/acilis-logo.svg — web'deki animasyonlu katman da aynı dosyayı
 * kullanıyor. Tek kaynak olması şart: native açılış görseli ile web katmanı
 * birbirinin ÜSTÜNE geçiyor, en ufak fark devir teslimde zıplama olarak
 * görünür.
 */

const KARE = 2732; // Capacitor'ın istediği evrensel açılış boyutu
const ZEMIN = "#FBFBFD";

// Logo kare tuvalin ortasında ve yüksekliğinin %25,6'sı kadar. Bu oran web
// katmanındaki 25.6vh ile aynı: iOS kare görseli ekranı kaplayacak şekilde
// ölçeklerken dikey kenarı taban alıyor, dolayısıyla kare yüksekliğinin bir
// yüzdesi doğrudan ekran yüksekliğinin aynı yüzdesine denk geliyor.
const LOGO_ORAN = 0.256;

async function acilisGorseli(logo) {
  const boy = Math.round(KARE * LOGO_ORAN);
  const olcekli = await sharp(logo).resize(boy, boy).png().toBuffer();

  return sharp({
    create: { width: KARE, height: KARE, channels: 3, background: ZEMIN },
  })
    .composite([{ input: olcekli, top: Math.round((KARE - boy) / 2), left: Math.round((KARE - boy) / 2) }])
    // flatten şeffaflığı zeminle dolduruyor ama kanalı bırakıyor;
    // removeAlpha onu da atıyor. App Store alfa kanallı görselleri reddediyor.
    .flatten({ background: ZEMIN })
    .removeAlpha()
    .png()
    .toBuffer();
}

async function simge(logo) {
  const BOY = 1024;
  const ic = Math.round(BOY * 0.72);
  const olcekli = await sharp(logo).resize(ic, ic).png().toBuffer();

  return sharp({ create: { width: BOY, height: BOY, channels: 3, background: ZEMIN } })
    .composite([{ input: olcekli, top: Math.round((BOY - ic) / 2), left: Math.round((BOY - ic) / 2) }])
    .flatten({ background: ZEMIN })
    .removeAlpha()
    .png()
    .toBuffer();
}

const logo = await readFile("public/acilis-logo.svg");

const acilis = await acilisGorseli(logo);
const kok = "ios/App/App/Assets.xcassets";

// Contents.json aydınlık ve karanlık için ayrı dosya bekliyor. Tasarım açık
// zeminli; karanlık modda ayrı bir görsel üretmek yerine aynısı veriliyor ki
// marka her iki temada aynı görünsün.
const acilisDosyalari = [
  "Default@1x~universal~anyany.png",
  "Default@2x~universal~anyany.png",
  "Default@3x~universal~anyany.png",
  "Default@1x~universal~anyany-dark.png",
  "Default@2x~universal~anyany-dark.png",
  "Default@3x~universal~anyany-dark.png",
  "splash-2732x2732.png",
  "splash-2732x2732-1.png",
  "splash-2732x2732-2.png",
];

for (const ad of acilisDosyalari) {
  await writeFile(`${kok}/Splash.imageset/${ad}`, acilis);
}

await writeFile(`${kok}/AppIcon.appiconset/AppIcon-512@2x.png`, await simge(logo));

console.log(`Açılış görseli: ${acilisDosyalari.length} dosya, ${KARE}x${KARE}`);
console.log("Uygulama simgesi: 1024x1024");
