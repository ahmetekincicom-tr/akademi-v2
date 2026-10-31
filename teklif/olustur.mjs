/**
 * Ahmet Ekinci teklif dokümanı üretici.
 *
 *   node teklif/olustur.mjs teklif/teklifler/ornek.json          → PDF + HTML
 *   node teklif/olustur.mjs teklif/teklifler/ornek.json --png    → + sayfa önizlemeleri
 *
 * Girdi üç katmandan birleşir:
 *   ayarlar.json          → her teklifte aynı kalanlar (iletişim, ödeme, referanslar…)
 *   hizmet-katalogu.json  → standart hizmet açıklamaları
 *   teklifler/<ad>.json   → müşteri, konu, hizmet kodları ve fiyatlar
 *
 * Çıktı teklif/cikti/ altına yazılır (depoya girmez). Tüm görseller ve yazı
 * tipleri HTML'in içine gömülür; HTML tek başına da açılıp yazdırılabilir.
 * Hizmet detayları tek sayfaya sığmazsa sayfa tarayıcıda ölçülüp otomatik
 * ikinciye bölünür.
 *
 * PDF'in telefonda da temiz görünmesi için arka plandaki ızgara ve kapak
 * çizimi CSS maskesiyle değil, vektör SVG çizgileriyle çiziliyor: Chromium
 * maskeleri PDF'e düşük çözünürlüklü görüntü olarak basıyor ve mobil PDF
 * görüntüleyicilerde ızgara bozuk/kırık görünüyordu.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const KOK = dirname(fileURLToPath(import.meta.url));
const V = (...p) => join(KOK, "varliklar", ...p);

// ───────── yardımcılar ─────────
const oku = (p) => readFileSync(p, "utf8");
const json = (p) => JSON.parse(oku(p));
const MIME = { ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const veriUrl = (p) => `data:${MIME[extname(p)]};base64,${readFileSync(p).toString("base64")}`;
const e = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const vurgula = (s) => e(s).replace(/\[(.+?)\]/g, '<span class="vurgu">$1</span>');
const svgIc = (p) => oku(p).replace(/^<svg[^>]*>|<\/svg>$/g, "");
const svgViewBox = (p) => oku(p).match(/viewBox="([^"]+)"/)[1];

const para = (n) => "₺" + new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(Math.round(n * 100) / 100);
const tarihYaz = (d) => new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(d);
const iki = (n) => String(n).padStart(2, "0");

/** Webp/png başlığından piksel ölçüsü (logo oranları için). */
function gorselOlcu(p) {
  const b = readFileSync(p);
  if (b.toString("ascii", 0, 4) === "RIFF") {
    const tur = b.toString("ascii", 12, 16);
    if (tur === "VP8L") {
      const bits = b.readUInt32LE(21);
      return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (tur === "VP8X") return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  }
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

// ───────── ikonlar (24×24, çizgi) ─────────
const I = (d, extra = "") =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
const IKON = {
  tik: I('<path d="M5 12.5l4.2 4.2L19 7"/>', 'stroke-width="3.2"'),
  saat: I('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  dongu: I('<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16"/><path d="M20 20v-4h-4"/>'),
  tek: I('<path d="M12 3l7 4v10l-7 4-7-4V7z"/><path d="M12 12l7-5M12 12v9M12 12L5 7"/>'),
  hediye: I('<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12"/><path d="M12 8c-1.5-3-5-3.5-5-1.2C7 8 9 8 12 8c3 0 5 0 5-1.2 0-2.3-3.5-1.8-5 1.2"/>'),
  bilgi: I('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8v.01"/>'),
  banka: I('<path d="M3 10l9-6 9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8"/><path d="M3 20h18"/>'),
  kart: I('<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h4"/>'),
  bolum: I('<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17"/><path d="M12 12h8.5"/>'),
  butce: I('<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>'),
  telefon: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
  whatsapp: I('<path d="M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.4z"/><path d="M9 8.5c0 3.5 2.5 6.5 6.5 6.5l1-1.6-2.2-1-1 .9a5 5 0 0 1-2.6-2.6l.9-1-1-2.2z" stroke-width="1.4"/>'),
  eposta: I('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>'),
  web: I('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.4 3.8 5.2 3.8 8.5s-1.2 6.1-3.8 8.5c-2.6-2.4-3.8-5.2-3.8-8.5s1.2-6.1 3.8-8.5"/>'),
  konum: I('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  ok: I('<path d="M7 17L17 7M9 7h8v8"/>', 'stroke-width="2.8"'),
  sag: I('<path d="M5 12h14M13 6l6 6-6 6"/>', 'stroke-width="2.6"'),
  kupa: I('<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7"/>'),
};

const GRUP = {
  yonetim: { renk: "#f2c230", yazi: "#17140f" },
  kurulum: { renk: "#4c7bea", yazi: "#ffffff" },
  uretim: { renk: "#e2685a", yazi: "#ffffff" },
  web: { renk: "#17140f", yazi: "#f2c230" },
};
const CUBUK_RENK = ["#f2c230", "#4c7bea", "#e2685a", "#17140f", "#6b6355", "#cfa327"];
const periyotCip = (p) => `<span class="cip">${p === "aylik" ? IKON.dongu + "Aylık" : IKON.tek + "Tek seferlik"}</span>`;

// ───────── veri ─────────
function veriHazirla(teklifYolu) {
  const ayar = json(join(KOK, "ayarlar.json"));
  const katalog = json(join(KOK, "hizmet-katalogu.json")).hizmetler;
  const teklif = json(teklifYolu);
  const v = { ...ayar, ...teklif, iletisim: { ...ayar.iletisim, ...(teklif.iletisim || {}) } };
  const paketler = teklif.paketler || {};

  v.hizmetler = (teklif.hizmetler || []).map((h, i) => {
    const temel = h.kod ? katalog[h.kod] : {};
    if (h.kod && !temel) throw new Error(`Katalogda olmayan hizmet kodu: "${h.kod}"`);
    const s = { periyot: "tek", grup: "yonetim", kapsam: [], adet: 1, ...temel, ...h };
    if (s.paket && !paketler[s.paket]) throw new Error(`"${s.ad}" için tanımsız paket: "${s.paket}"`);
    if (s.fiyat == null && !s.paket) throw new Error(`"${s.ad || s.kod}" için fiyat yazılmamış`);
    s.no = iki(i + 1);
    if (s.paket) s.periyot = paketler[s.paket].periyot || s.periyot;
    return s;
  });

  // Fiyat tablosu satırları: aynı pakete bağlı hizmetler tek satırda, paket fiyatıyla.
  v.satirlar = [];
  const islenenPaket = new Set();
  for (const h of v.hizmetler) {
    if (h.paket) {
      if (islenenPaket.has(h.paket)) continue;
      islenenPaket.add(h.paket);
      const p = paketler[h.paket];
      const uyeler = v.hizmetler.filter((x) => x.paket === h.paket);
      v.satirlar.push({
        no: uyeler.map((x) => x.no).join("+"),
        ad: p.ad || uyeler.map((x) => x.ad).join(" + "),
        etiket: p.etiket || "Paket fiyatı",
        grup: p.grup || h.grup,
        periyot: h.periyot,
        tutar: Number(p.fiyat),
        dahil: Number(p.fiyat) === 0,
      });
    } else {
      const tutar = Number(h.fiyat) * Number(h.adet || 1);
      v.satirlar.push({
        no: h.no,
        ad: h.ad + (h.adet > 1 ? ` × ${h.adet}` : ""),
        etiket: h.fiyatNotu || h.etiket || "",
        grup: h.grup,
        periyot: h.periyot,
        tutar,
        dahil: tutar === 0,
      });
    }
  }

  const tarih = new Date((teklif.tarih || new Date().toISOString().slice(0, 10)) + "T00:00:00Z");
  const sonTarih = teklif.sonGecerlilik
    ? new Date(teklif.sonGecerlilik + "T00:00:00Z")
    : new Date(tarih.getTime() + v.gecerlilikGun * 864e5);
  v.tarihYazi = tarihYaz(tarih);
  v.sonTarihYazi = tarihYaz(sonTarih);
  v.gecerlilikGun = Math.round((sonTarih - tarih) / 864e5);
  v.teklifNo = teklif.teklifNo || `${v.teklifNoOnEki}-${tarih.getUTCFullYear()}-${iki(tarih.getUTCMonth() + 1)}${iki(tarih.getUTCDate())}`;

  // Toplamlar: tek seferlik ve aylık ayrı. Bedeli 0 olan (pakete dahil) kalemler ayrıca listelenir.
  const ind = teklif.indirim;
  v.dahiller = v.satirlar.filter((s) => s.dahil);
  v.gruplar = ["tek", "aylik"]
    .map((p) => {
      const kalemler = v.satirlar.filter((s) => s.periyot === p && !s.dahil);
      if (!kalemler.length) return null;
      const ara = kalemler.reduce((t, s) => t + s.tutar, 0);
      const indirimVar = ind && (ind.kapsam === "tum" || ind.kapsam === p || (!ind.kapsam && p === "tek"));
      const indirim = indirimVar ? (ind.tutar != null ? Number(ind.tutar) : (ara * Number(ind.oran)) / 100) : 0;
      const matrah = ara - indirim;
      const kdv = (matrah * v.kdvOrani) / 100;
      return {
        p,
        baslik: p === "tek" ? "Tek seferlik" : "Aylık hizmet",
        ara,
        indirim,
        indirimEtiket: indirimVar ? `${ind.aciklama || "İndirim"}${ind.oran ? ` (%${ind.oran})` : ""}` : "",
        kdv,
        toplam: matrah + kdv,
      };
    })
    .filter(Boolean);

  // Ödeme seçenekleri: "kosul" alanı olan seçenek yalnız o türde ücretli kalem varsa görünür.
  const ucretliPeriyot = new Set(v.gruplar.map((g) => g.p));
  v.odemeSecenekleri = v.odemeSecenekleri.filter((o) => !o.kosul || ucretliPeriyot.has(o.kosul));

  v.teslim = v.hizmetler.find((h) => h.teslimTakvimi)?.teslimTakvimi || teklif.teslimTakvimi || null;
  return v;
}

// ───────── parçalar ─────────

/** Sayfa arka planındaki ince ızgara: tek tek vektör çizgiler, yukarıdan aşağı solar. */
function izgara(koyu) {
  const renk = koyu ? "#f5f0e6" : "#17140f";
  const tepe = koyu ? 0.05 : 0.07;
  const boy = koyu ? 190 : 120;
  const ara = 9;
  let cizgi = "";
  for (let y = ara; y < boy; y += ara) {
    const o = (tepe * (1 - y / boy)).toFixed(4);
    cizgi += `<line x1="0" y1="${y}" x2="210" y2="${y}" stroke-opacity="${o}"/>`;
  }
  for (let x = ara; x < 210; x += ara) cizgi += `<line x1="${x}" y1="0" x2="${x}" y2="${boy}" stroke="url(#izg${koyu ? "K" : "A"})"/>`;
  return `<svg class="izgara" viewBox="0 0 210 297" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id="izg${koyu ? "K" : "A"}" x1="0" y1="0" x2="0" y2="${boy}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${renk}" stop-opacity="${tepe}"/><stop offset="1" stop-color="${renk}" stop-opacity="0"/>
    </linearGradient></defs>
    <g stroke="${renk}" stroke-width="0.15" fill="none">${cizgi}</g></svg>`;
}

function parcalar() {
  const isaretVB = svgViewBox(V("logo-isaret.svg"));
  const isaretIc = svgIc(V("logo-isaret.svg"));
  const logo = (ek = "") =>
    `<span class="logo" ${ek}><svg viewBox="${isaretVB}" aria-hidden="true">${isaretIc}</svg>Ahmet Ekinci</span>`;
  const metaSvg = `<svg class="pb__meta" viewBox="${svgViewBox(V("meta.svg"))}">${svgIc(V("meta.svg"))}</svg>`;
  const partnerler = `
    <div class="partnerler">
      <span class="partnerler__etiket">PARTNER</span>
      <span class="pb">${metaSvg}<span class="pb__txt"><b>Meta</b><span>Tech Provider</span></span></span>
      <span class="pb"><img class="pb__shopify" src="${veriUrl(V("partner", "shopify-partners.webp"))}" alt="Shopify Partners"></span>
      <span class="pb"><img class="pb__yuvarlak" src="${veriUrl(V("partner", "openai-partner-network.webp"))}" alt=""><span class="pb__txt"><b>OpenAI</b><span>Partner Network</span></span></span>
      <span class="pb"><img class="pb__kare" src="${veriUrl(V("partner", "kommo-mark.webp"))}" alt=""><span class="pb__txt"><b>Kommo</b><span>partner</span></span></span>
    </div>`;
  const alt = (v) => `
    <footer class="alt">
      ${logo()}
      ${partnerler}
      <div class="sayfa-no"><b class="js-no">00</b> / <span class="js-toplam">00</span><br>${e(v.iletisim.web)}</div>
    </footer>`;
  const ust = (v, sag) => `
    <header class="ust">
      <div class="ust__sol"><span class="ust__nokta"></span><b>${e(v.musteri.firma)}</b> · Hizmet teklifi</div>
      <div>${e(v.teklifNo)} · ${sag}</div>
    </header>`;
  return { logo, alt, ust, isaretVB, isaretIc };
}

function kapak(v, P) {
  const ad = v.kapakBaslik || v.konu;
  const harf = (v.musteri.firma || "?").trim().charAt(0).toLocaleUpperCase("tr-TR");
  const seritOgeleri = [...v.hizmetler.map((h) => h.ad), "Önce veri, sonra karar"];
  const serit = Array(3).fill(seritOgeleri).flat().map((s) => `<span>${e(s)} ${IKON.ok}</span>`).join("");
  // Logo çizimi aşağı doğru solar (maske yerine degrade çizgi: PDF'te vektör kalır).
  const [, vy, , vh] = P.isaretVB.split(" ").map(Number);
  const sanat = P.isaretIc
    .replace(/fill="currentColor"/, 'fill="none"')
    .replace(/stroke="currentColor"/, 'stroke="url(#sanatSol)"')
    .replace(/stroke-width="5"/, 'stroke-width="0.9" vector-effect="non-scaling-stroke"');
  const musteriAlt = [
    v.musteri.yetkili ? `<b>${e(v.musteri.yetkili)}</b>${v.musteri.unvan ? ` · ${e(v.musteri.unvan)}` : ""}` : "",
    v.musteri.tamUnvan ? e(v.musteri.tamUnvan) : "",
    v.musteri.web ? `<b>${e(v.musteri.web)}</b>` : "",
  ].filter(Boolean);
  return `
  <section class="sayfa sayfa--koyu kapak">
    ${izgara(true)}
    <div class="kapak__sanat"><svg viewBox="${P.isaretVB}">
      <defs><linearGradient id="sanatSol" x1="0" y1="${vy}" x2="0" y2="${vy + vh}" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#f2c230"/><stop offset="0.36" stop-color="#f2c230"/><stop offset="0.58" stop-color="#f2c230" stop-opacity="0"/>
      </linearGradient></defs>${sanat}</svg></div>
    <div class="kapak__halka" style="width:150mm;height:150mm;right:-48mm;top:-30mm"></div>
    <div class="kapak__halka" style="width:210mm;height:210mm;right:-78mm;top:-60mm;opacity:.6"></div>

    <div class="kapak__ust">
      ${P.logo()}
      <div class="kapak__no">Hizmet teklifi<br><b>No · ${e(v.teklifNo)}</b></div>
    </div>

    <div class="kapak__icerik">
      <span class="kapak__rozet"><i></i>${e(v.etiket || "Size özel hazırlandı")}</span>
      <h1 class="kapak__baslik">${vurgula(ad)}</h1>
      <p class="kapak__konu"><b>Teklif konusu:</b> ${e(v.konu)}</p>
    </div>

    <div class="kapak__musteri">
      <div class="kapak__musteri-kart">
        <div class="kapak__musteri-harf">${e(harf)}</div>
        <div>
          <div class="mono-etiket">Teklif sunulan</div>
          <div class="kapak__firma">${e(v.musteri.firma)}</div>
          ${musteriAlt.length ? `<div class="kapak__yetkili">${musteriAlt.join(" · ")}</div>` : ""}
        </div>
      </div>
    </div>

    <div class="kapak__bilgi">
      <div><span class="mono-etiket">Teklif tarihi</span><strong>${e(v.tarihYazi)}</strong></div>
      <div><span class="mono-etiket">Son geçerlilik</span><strong>${e(v.sonTarihYazi)}</strong><em>${v.gecerlilikGun} gün geçerli</em></div>
      <div><span class="mono-etiket">Teklif no</span><strong>${e(v.teklifNo)}</strong></div>
    </div>

    <div class="serit serit--golge">${serit}</div>
    <div class="serit">${serit}</div>

    ${P.alt(v)}
  </section>`;
}

function hizmetKart(h) {
  const g = GRUP[h.grup] || GRUP.yonetim;
  return `
  <article class="hizmet" style="--grup:${g.renk};--grup-yazi:${g.yazi}">
    <div>
      <div class="hizmet__no-satir"><span class="no-cip">${h.no}</span><span class="hizmet__etiket">${e(h.etiket || "")}</span></div>
      <h3 class="hizmet__ad">${e(h.ad)}</h3>
      <p class="hizmet__ozet">${e(h.ozet || "")}</p>
      <div class="hizmet__cipler">
        ${h.sure && !(h.periyot === "aylik" && h.sure.trim() === "Aylık") ? `<span class="cip cip--sari">${IKON.saat}${e(h.sure)}</span>` : ""}
        ${h.fiyat === 0 ? `<span class="cip cip--koyu">${IKON.hediye}Pakete dahil</span>` : periyotCip(h.periyot)}
      </div>
    </div>
    <div class="hizmet__sag">
      <div class="mono-etiket">Kapsam</div>
      <ul class="kapsam">${h.kapsam.map((k) => `<li><span class="tik">${IKON.tik}</span><span>${e(k)}</span></li>`).join("")}</ul>
      ${h.not ? `<div class="hizmet__not">${IKON.bilgi}<span>${e(h.not)}</span></div>` : ""}
    </div>
  </article>`;
}

function hizmetSayfasi(v, P) {
  const hitap = v.hitap || (v.musteri.yetkili ? `Sayın ${v.musteri.yetkili},` : `Değerli ${v.musteri.firma} ekibi,`);
  return `
  <section class="sayfa" data-bol>
    ${izgara(false)}
    ${P.ust(v, "Kapsam")}
    <div class="govde">
      <div class="bolum-bas">
        <div>
          <div class="kicker">01 · Hizmet detayları</div>
          <h2 class="h2">${vurgula(v.kapsamBaslik || "Size özel [hazırlanan] hizmetler")}</h2>
        </div>
        <div>
          <p class="hitap">${e(hitap)}</p>
          <p class="lede">${e(v.giris || "")}</p>
        </div>
      </div>
      <div class="devam-bas kicker">01 · Hizmet detayları (devam)</div>
      <div class="bol-liste">${v.hizmetler.map(hizmetKart).join("")}</div>
    </div>
    ${P.alt(v)}
  </section>`;
}

function yatirimSayfasi(v, P) {
  const satirlar = v.satirlar
    .map((s) => {
      const g = GRUP[s.grup] || GRUP.yonetim;
      return `
      <div class="tablo__satir" style="--grup:${g.renk};--grup-yazi:${g.yazi}">
        <span class="no-cip${s.no.includes("+") ? " no-cip--genis" : ""}">${s.no}</span>
        <div class="tablo__ad"><b>${e(s.ad)}</b><span>${e(s.etiket)}</span></div>
        <div>${periyotCip(s.periyot)}</div>
        <div class="sag">${
          s.dahil
            ? `<span class="cip cip--koyu">${IKON.hediye}Pakete dahil</span>`
            : `<span class="tutar">${para(s.tutar)}${s.periyot === "aylik" ? " <small>/ ay</small>" : ""}</span>`
        }</div>
      </div>`;
    })
    .join("");

  const dahilBlok = v.dahiller.length
    ? `<div class="toplam__blok">
        <div class="mono-etiket">Ücretsiz eklenen</div>
        ${v.dahiller.map((d) => `<div class="toplam__satir toplam__satir--indirim"><span>${e(d.ad)}</span><span class="tutar">Dahil</span></div>`).join("")}
      </div>`
    : "";
  const toplam =
    v.gruplar
      .map(
        (g) => `
    <div class="toplam__blok">
      <div class="mono-etiket">${g.baslik}</div>
      <div class="toplam__satir"><span>Ara toplam</span><span class="tutar">${para(g.ara)}</span></div>
      ${g.indirim ? `<div class="toplam__satir toplam__satir--indirim"><span>${e(g.indirimEtiket)}</span><span class="tutar">−${para(g.indirim)}</span></div>` : ""}
      <div class="toplam__satir"><span>KDV (%${v.kdvOrani})</span><span class="tutar">${para(g.kdv)}</span></div>
      <div class="toplam__genel"><span>Toplam</span><strong>${para(g.toplam)}${g.p === "aylik" ? " <small>/ ay</small>" : ""}</strong></div>
    </div>`
      )
      .join("") + dahilBlok;

  let teslim;
  if (v.teslim) {
    const t = v.teslim;
    const topGun = t.asamalar.reduce((a, s) => a + s.gun, 0);
    teslim = `
    <div class="teslim">
      <div class="teslim__ust">
        <div>
          <div class="mono-etiket">${e(t.baslik)}</div>
          <div class="teslim__sure"><strong>${e(t.toplam)}</strong><span>${e(t.altyazi || "")}</span></div>
        </div>
        <span class="saat-ikon">${IKON.saat}</span>
      </div>
      <div class="cubuk">${t.asamalar.map((s, i) => `<i style="flex:${s.gun};background:${CUBUK_RENK[i % CUBUK_RENK.length]}"></i>`).join("")}</div>
      <div class="asamalar">${t.asamalar
        .map((s) => `<div style="flex:${Math.max(s.gun, topGun * 0.17)}"><b>${s.gun} gün</b><span>${e(s.ad)}</span></div>`)
        .join("")}</div>
      ${t.not ? `<p class="teslim__not">${e(t.not)}</p>` : ""}
    </div>`;
  } else {
    teslim = `
    <div class="teslim">
      <div class="teslim__ust">
        <div>
          <div class="mono-etiket">Başlangıç</div>
          <div class="teslim__sure"><strong>${e(v.baslangic || "3 iş günü")}</strong><span>onaydan sonra</span></div>
        </div>
        <span class="saat-ikon">${IKON.saat}</span>
      </div>
      <p class="teslim__not">Onayın ardından başlangıç toplantısı yapılır; erişimler ve takvim netleşir, çalışma başlar.</p>
    </div>`;
  }

  const butce = v.reklamButcesi
    ? `<div class="butce">
        <span class="butce__ikon">${IKON.butce}</span>
        <div>
          <div class="mono-etiket">${e(v.reklamButcesi.baslik || "Önerilen reklam bütçesi")}</div>
          <strong>${e(v.reklamButcesi.tutar)}</strong>
        </div>
        <p>${e(v.reklamButcesi.metin || "Reklam bütçesi hizmet bedeline dahil değildir; doğrudan reklam platformlarına ödenir.")}</p>
      </div>`
    : "";

  const odeme = v.odemeSecenekleri
    .map(
      (o) => `
    <div class="odeme__kart">
      <span class="odeme__ikon">${IKON[o.ikon] || IKON.kart}</span>
      <b>${e(o.baslik)}</b>
      <p>${e(o.metin)}</p>
    </div>`
    )
    .join("");

  return `
  <section class="sayfa">
    ${izgara(false)}
    ${P.ust(v, "Yatırım")}
    <div class="govde">
      <div class="bolum-bas">
        <div>
          <div class="kicker">02 · Yatırım ve ödeme</div>
          <h2 class="h2">Net fiyat, <span class="vurgu">net</span> takvim.</h2>
        </div>
        <p class="lede">Tüm kalemler tek tabloda. Tek seferlik işler ve aylık hizmetler ayrı toplanır; sürpriz maliyet yoktur.</p>
      </div>

      <div class="tablo">
        <div class="tablo__satir tablo__bas"><div>#</div><div>Hizmet</div><div>Periyot</div><div class="sag">Tutar (KDV hariç)</div></div>
        ${satirlar}
      </div>

      <div class="yatirim-alt">
        ${teslim}
        <div class="toplam">${toplam}</div>
      </div>

      ${butce}

      <div class="odeme-bas"><div class="kicker">Ödeme seçenekleri</div></div>
      <div class="odeme" style="grid-template-columns:repeat(${v.odemeSecenekleri.length},1fr)">${odeme}</div>

      <div class="sartlar">${v.sartlar.map((s) => `<p>${e(s)}</p>`).join("")}</div>
    </div>
    ${P.alt(v)}
  </section>`;
}

function referansSayfasi(v, P) {
  // Logolar optik olarak dengelenir: genişlik/yükseklik oranına göre aynı görsel ağırlığa
  // yakın bir boyut hesaplanır (geniş logolar daha alçak, kare logolar daha yüksek).
  const logolar = v.referanslar
    .map((r) => {
      const { w, h } = gorselOlcu(V("referanslar", r.dosya));
      const oran = w / h;
      let yuk = 10.6 * Math.pow(oran, -0.5) * (r.olcek || 1);
      let gen = yuk * oran;
      if (gen > 33) (gen = 33), (yuk = gen / oran);
      if (yuk > 12.5) (yuk = 12.5), (gen = yuk * oran);
      return `
      <div class="ref">
        <div class="ref__logo"><img src="${veriUrl(V("referanslar", r.dosya))}" alt="" style="width:${gen.toFixed(2)}mm;height:${yuk.toFixed(2)}mm"></div>
        <span class="ref__ad">${e(r.ad)}</span>
      </div>`;
    })
    .join("");
  const kalan = 4 - (v.referanslar.length % 4 || 4);
  const span = kalan === 0 ? 4 : kalan;
  return `
  <section class="sayfa">
    ${izgara(false)}
    ${P.ust(v, "Referanslar")}
    <div class="govde">
      <div class="bolum-bas">
        <div>
          <div class="kicker">03 · Referanslar</div>
          <h2 class="h2">Birlikte <span class="vurgu">büyüdüğümüz</span> markalar.</h2>
        </div>
        <p class="lede">Kamu kurumlarından savunma sanayisine, sağlıktan e-ticarete; farklı sektörlerde aynı kural: önce veri, sonra karar.</p>
      </div>

      <div class="rakamlar">${v.istatistikler
        .map((s) => `<div><strong>${e(s.deger)}</strong><b>${e(s.etiket)}</b><span>${e(s.alt)}</span></div>`)
        .join("")}</div>

      <div class="logolar">
        ${logolar}
        <div class="ref siradaki" style="grid-column:span ${span}">
          <span>Sıradaki marka</span><b>${e(v.musteri.firma)}</b>${IKON.sag}
        </div>
      </div>

      <div class="adimlar">${v.calismaModeli
        .map((a, i) => `<div class="adim adim--${i + 1}"><b>${iki(i + 1)} · ${e(a.baslik)}</b><p>${e(a.metin)}</p></div>`)
        .join("")}</div>
    </div>
    ${P.alt(v)}
  </section>`;
}

function iletisimSayfasi(v, P) {
  const c = v.iletisim;
  const rakam = (t) => t.replace(/\D/g, "").replace(/^0/, "");
  return `
  <section class="sayfa sayfa--koyu">
    ${izgara(true)}
    ${P.ust(v, "İletişim")}
    <div class="govde">
      <div class="bolum-bas">
        <div>
          <div class="kicker">04 · İletişim</div>
          <h2 class="h2" style="color:#fffaf0">Birlikte <span class="vurgu">başlayalım</span>.</h2>
        </div>
        <p class="lede">Sorularınız için bana doğrudan ulaşabilirsiniz. Teklifle ilgili her konuşmayı ben yürütürüm; aracı yok.</p>
      </div>

      <div class="iletisim-izgara">
        <div class="portre">
          <div class="portre__arka"></div>
          <div class="portre__kart">
            <img src="${veriUrl(V("portre.webp"))}" alt="${e(v.hazirlayan.ad)}">
            <div class="portre__alt">
              <b>${e(v.hazirlayan.ad)}</b>
              <span>${e(v.hazirlayan.unvan)}</span>
              <span class="odul">${IKON.kupa}TRT Geleceğin İletişimcileri 2021</span>
            </div>
          </div>
        </div>
        <div class="kanallar">
          <a class="kanal" href="tel:+90${rakam(c.telefon)}"><span class="kanal__ikon">${IKON.telefon}</span><div><span class="mono-etiket">Telefon</span><b>${e(c.telefon)}</b></div></a>
          <a class="kanal" href="https://wa.me/90${rakam(c.whatsapp)}"><span class="kanal__ikon kanal__ikon--wa">${IKON.whatsapp}</span><div><span class="mono-etiket">WhatsApp</span><b>${e(c.whatsapp)}</b></div></a>
          <a class="kanal" href="mailto:${e(c.eposta)}"><span class="kanal__ikon">${IKON.eposta}</span><div><span class="mono-etiket">E-posta</span><b>${e(c.eposta)}</b></div></a>
          <a class="kanal" href="https://${e(c.web)}"><span class="kanal__ikon">${IKON.web}</span><div><span class="mono-etiket">Web</span><b>${e(c.web)}</b></div></a>
          <div class="kanal"><span class="kanal__ikon">${IKON.konum}</span><div><span class="mono-etiket">Ofis</span><b class="kucuk">${c.adres.map(e).join("<br>")}</b></div></div>
        </div>
      </div>

      <div class="sonraki">${v.sonrakiAdimlar
        .map((s, i) => `<div><i>${iki(i + 1)} · Adım</i><b>${e(s.baslik)}</b><p>${e(s.metin)}</p></div>`)
        .join("")}</div>

      <a class="cta" href="https://wa.me/90${rakam(c.whatsapp)}">
        <div>
          <span class="mono-etiket">Teklif ${e(v.teklifNo)} · ${e(v.sonTarihYazi)} tarihine kadar geçerli</span>
          <b>Onay için tek mesaj yeterli.</b>
        </div>
        <span class="cta__buton">${IKON.whatsapp}${e(c.whatsapp)}<i>${IKON.sag}</i></span>
      </a>
    </div>
    ${P.alt(v)}
  </section>`;
}

// Tarayıcıda çalışır: taşan hizmet listesini yeni sayfaya böler, sayfaları numaralar.
const SAYFALA = `
(function () {
  function sayfala() {
    document.querySelectorAll('.sayfa[data-bol]').forEach(function (s) {
      var guvenlik = 0;
      while (guvenlik++ < 10) {
        var govde = s.querySelector('.govde'), liste = s.querySelector('.bol-liste');
        if (govde.scrollHeight <= govde.clientHeight + 1 || liste.children.length < 2) break;
        var yeni = s.cloneNode(true);
        yeni.classList.add('devam');
        var yl = yeni.querySelector('.bol-liste');
        yl.innerHTML = '';
        s.after(yeni);
        while (govde.scrollHeight > govde.clientHeight + 1 && liste.children.length > 1) yl.prepend(liste.lastElementChild);
        s = yeni;
      }
    });
    var sayfalar = document.querySelectorAll('.sayfa');
    sayfalar.forEach(function (s, i) {
      s.querySelectorAll('.js-no').forEach(function (n) { n.textContent = String(i + 1).padStart(2, '0'); });
      s.querySelectorAll('.js-toplam').forEach(function (n) { n.textContent = String(sayfalar.length).padStart(2, '0'); });
    });
    window.__hazir = true;
  }
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () { requestAnimationFrame(sayfala); });
})();`;

function html(v) {
  const P = parcalar();
  const font = (ad, dosya, aralik, agirlik) =>
    `@font-face{font-family:"${ad}";src:url(${veriUrl(V("fontlar", dosya))}) format("woff2");font-weight:${agirlik};font-style:normal;unicode-range:${aralik};}`;
  const LATIN = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
  const LATIN_EXT = "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF";
  const fontlar = [
    font("Jakarta", "jakarta-latin.woff2", LATIN, "200 800"),
    font("Jakarta", "jakarta-latin-ext.woff2", LATIN_EXT, "200 800"),
    font("JBMono", "mono-latin.woff2", LATIN, "100 800"),
    font("JBMono", "mono-latin-ext.woff2", LATIN_EXT, "100 800"),
  ].join("\n");

  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Teklif · ${e(v.musteri.firma)} · ${e(v.teklifNo)}</title>
<style>${fontlar}\n${oku(join(KOK, "stil.css"))}</style>
</head>
<body>
${kapak(v, P)}
${hizmetSayfasi(v, P)}
${yatirimSayfasi(v, P)}
${referansSayfasi(v, P)}
${iletisimSayfasi(v, P)}
<script>${SAYFALA}</script>
</body>
</html>`;
}

// ───────── çalıştır ─────────
const slug = (s) =>
  s
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşü]/g, (c) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" })[c])
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

async function main() {
  const arg = process.argv.slice(2);
  const girdi = arg.find((a) => !a.startsWith("--"));
  if (!girdi) {
    console.error("Kullanım: node teklif/olustur.mjs teklif/teklifler/<dosya>.json [--png]");
    process.exit(1);
  }
  const v = veriHazirla(resolve(girdi));
  const cikti = join(KOK, "cikti");
  mkdirSync(cikti, { recursive: true });
  const ad = `AhmetEkinci-Teklif-${slug(v.musteri.firma)}-${v.teklifNo}`;
  const htmlYol = join(cikti, ad + ".html");
  writeFileSync(htmlYol, html(v));

  const require = createRequire(import.meta.url);
  const { chromium } = require("playwright");
  const tarayici = await chromium.launch();
  const sayfa = await tarayici.newPage({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 2 });
  await sayfa.goto("file://" + htmlYol);
  await sayfa.waitForFunction(() => window.__hazir === true, null, { timeout: 15000 });
  await sayfa.emulateMedia({ media: "print" });
  await sayfa.pdf({ path: join(cikti, ad + ".pdf"), preferCSSPageSize: true, printBackground: true });

  if (arg.includes("--png")) {
    await sayfa.emulateMedia({ media: "screen" });
    const klasor = join(cikti, ad + "-onizleme");
    rmSync(klasor, { recursive: true, force: true });
    mkdirSync(klasor, { recursive: true });
    const sayfalar = await sayfa.$$(".sayfa");
    for (let i = 0; i < sayfalar.length; i++) await sayfalar[i].screenshot({ path: join(klasor, `sayfa-${iki(i + 1)}.png`) });
    console.log("Önizleme:", klasor);
  }
  const n = await sayfa.$$eval(".sayfa", (s) => s.length);
  await tarayici.close();
  console.log(`PDF hazır (${n} sayfa):`, join(cikti, ad + ".pdf"));
  console.log("HTML:", htmlYol, `(${basename(girdi)})`);
}

main().catch((h) => {
  console.error(h.message || h);
  process.exit(1);
});
