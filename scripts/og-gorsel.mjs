/**
 * Paylaşım görselini (public/og.png) üretir.
 *
 * Neden PNG: og:image olarak SVG veriliyordu ve Facebook, LinkedIn, X ve
 * WhatsApp SVG'yi okumuyor — paylaşımlarda kart görselsiz çıkıyordu. Aynı
 * görsel arama sonuçlarında ve yapay zekâ arama motorlarının kaynak
 * kartlarında da kullanılıyor.
 *
 * 1200×630, Facebook/X/LinkedIn'in ortak önerdiği ölçü.
 *
 * Görsel artık YÖNETİM PANELİNDEN yükleniyor (Logo ve favicon → Paylaşım
 * görseli). Bu betik yalnızca başlangıç için markadan bir kapak üretiyor;
 * çıktıyı panelden yüklemek gerekiyor, dosyanın depoda durması tek başına
 * hiçbir şey yapmıyor.
 *
 * Çalıştırma:  node scripts/og-gorsel.mjs
 * sharp zaten Next'in bağımlılığı olarak kurulu; ayrıca paket eklenmiyor.
 */
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const G = 1200;
const Y = 630;

// Logo 400×400'lük kendi ızgarasında çizili; 0.62 ölçekle sola yerleşiyor.
const LOGO = `
  <g transform="translate(72, 116) scale(0.6)">
    <path d="M190 130 L66 298 L128 298 L172 238 L228 238 L272 298 L334 298 L210 130 Z"
          fill="url(#aGrad)" stroke="url(#aGrad)" stroke-width="16" stroke-linejoin="round"/>
    <g fill="none" stroke="#FFFFFF" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M200 182 L232 194 L200 206 L168 194 Z"/>
      <path d="M180 199v11c0 9 40 9 40 0v-11"/>
      <path d="M232 194v20"/>
    </g>
  </g>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${G}" height="${Y}" viewBox="0 0 ${G} ${Y}">
  <defs>
    <linearGradient id="aGrad" x1="200" y1="128" x2="200" y2="300" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#4B7BFF"/>
      <stop offset="1" stop-color="#1C56F3"/>
    </linearGradient>
    <radialGradient id="isik" cx="0.22" cy="0.12" r="0.62">
      <stop offset="0" stop-color="#1C56F3" stop-opacity="0.42"/>
      <stop offset="1" stop-color="#1C56F3" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${G}" height="${Y}" fill="#0A0D18"/>
  <rect width="${G}" height="${Y}" fill="url(#isik)"/>

  <!-- Sitedeki koyu ızgara deseninin aynısı. -->
  <g stroke="#FFFFFF" stroke-opacity="0.05" stroke-width="1">
    ${Array.from({ length: 15 }, (_, i) => `<path d="M${(i + 1) * 80} 0V${Y}"/>`).join("")}
    ${Array.from({ length: 7 }, (_, i) => `<path d="M0 ${(i + 1) * 80}H${G}"/>`).join("")}
  </g>

  ${LOGO}

  <text x="322" y="252" font-family="DejaVu Sans" font-size="26" font-weight="bold"
        letter-spacing="6" fill="#4B7BFF">AHMET EKİNCİ AKADEMİ</text>

  <text x="322" y="330" font-family="DejaVu Sans" font-size="52" font-weight="bold" fill="#FFFFFF">Birebir dijital</text>
  <text x="322" y="392" font-family="DejaVu Sans" font-size="52" font-weight="bold" fill="#FFFFFF">pazarlama eğitimi</text>

  <text x="322" y="452" font-family="DejaVu Sans" font-size="25" fill="#FFFFFF" fill-opacity="0.62">Meta Ads · Sosyal Medya · Yapay Zekâ</text>

  <rect x="322" y="486" width="86" height="4" rx="2" fill="#1C56F3"/>
  <text x="322" y="536" font-family="DejaVu Sans" font-size="23" fill="#FFFFFF" fill-opacity="0.45">ahmetekinciakademi.com · Ankara</text>
</svg>`;

const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
writeFileSync(new URL("../public/og.png", import.meta.url), png);
console.log(`public/og.png yazıldı — ${G}×${Y}, ${(png.length / 1024).toFixed(0)} KB`);
