/**
 * Ahmet Ekinci başlangıç talep listesi üretici.
 *
 *   node teklif/talep.mjs teklif/talepler/<musteri>.json [--png]
 *
 * Çalışmaya başlanan müşteriden istenen erişim ve bilgileri (Meta yetkisi,
 * görsel/video, GEO soruları, web sitesi erişimi, WhatsApp numarası…) teklif
 * dokümanıyla aynı tasarımda bir PDF'e döker.
 *
 *   ayarlar.json        → iletişim bilgileri (e-posta adresi {eposta} yerine geçer)
 *   talep-katalogu.json → standart talep metinleri ve kılavuzlar
 *   talepler/<ad>.json  → müşteri, giriş metni, talep kodları ve müşteriye özel değişiklikler
 *
 * Talepler tek sayfaya sığmazsa teklifteki hizmet kartları gibi otomatik bölünür.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  KOK, json, e, vurgula, iki, tarihYaz, slug, IKON, I, izgara, parcalar, iletisimSayfasi, belge, bas, oku,
} from "./olustur.mjs";

const IK = {
  ...IKON,
  kalkan: I('<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6z"/><path d="M8.8 12.2l2.2 2.2 4.4-4.6"/>'),
  yukle: I('<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-3"/>'),
  soru: I('<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.4a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2.1-2.4 3.6M12 17v.01"/>'),
  kilit: I('<rect x="4.5" y="10.5" width="15" height="10" rx="2.2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'),
};

const TUR_IKON = { kilavuz: "kalkan", liste: "yukle", sorular: "soru", form: "kilit", secim: "whatsapp" };

/** Kaçışlı metin; **kalın** ve `kod` biçimlerini destekler. */
const zengin = (s) =>
  e(s)
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/`(.+?)`/g, "<code>$1</code>");

function veriHazirla(yol) {
  const ayar = json(join(KOK, "ayarlar.json"));
  const katalog = json(join(KOK, "talep-katalogu.json")).talepler;
  const t = json(yol);
  const eposta = ayar.iletisim.eposta;
  // {eposta} yer tutucusunu tüm metinlerde gerçek adresle değiştir.
  const yerlestir = (x) =>
    typeof x === "string"
      ? x.replaceAll("{eposta}", eposta)
      : Array.isArray(x)
        ? x.map(yerlestir)
        : x && typeof x === "object"
          ? Object.fromEntries(Object.entries(x).map(([k, d]) => [k, yerlestir(d)]))
          : x;
  const v = { ...ayar, ...t, iletisim: { ...ayar.iletisim, ...(t.iletisim || {}) } };
  v.talepler = (t.talepler || []).map((x, i) => {
    const temel = x.kod ? katalog[x.kod] : {};
    if (x.kod && !temel) throw new Error(`Katalogda olmayan talep kodu: "${x.kod}"`);
    return { ...yerlestir(temel), ...yerlestir(x), no: iki(i + 1) };
  });
  const tarih = new Date((t.tarih || new Date().toISOString().slice(0, 10)) + "T00:00:00Z");
  v.tarihYazi = tarihYaz(tarih);
  v.belgeTuru = "Başlangıç talep listesi";
  v.belgeNo = t.teklifNo || "";
  v.iletisimMetni = t.iletisimMetni || "Adımlardan birinde takılırsanız bana doğrudan ulaşın; ekran paylaşımıyla birlikte birkaç dakikada tamamlayalım.";
  return v;
}

const kutu = () => `<span class="tk-kutu"></span>`;

// ───────── kapak ─────────
function kapak(v, P) {
  const [, vy, , vh] = P.isaretVB.split(" ").map(Number);
  const sanat = P.isaretIc
    .replace(/fill="currentColor"/, 'fill="none"')
    .replace(/stroke="currentColor"/, 'stroke="url(#sanatSol)"')
    .replace(/stroke-width="5"/, 'stroke-width="0.9" vector-effect="non-scaling-stroke"');
  const harf = (v.musteri.firma || "?").trim().charAt(0).toLocaleUpperCase("tr-TR");
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
      <div class="kapak__no">Başlangıç talep listesi<br>${v.belgeNo ? `<b>Teklif · ${e(v.belgeNo)}</b>` : ""}</div>
    </div>

    <div class="kapak__icerik tk-kapak__icerik">
      <span class="kapak__rozet"><i></i>Çalışmaya başlıyoruz</span>
      <h1 class="kapak__baslik">${vurgula(v.kapakBaslik || "Başlamak için [ihtiyacımız] olanlar.")}</h1>
      <p class="kapak__konu">${e(v.kapakAlt || `Kampanyaları yayına almadan önce sizden ${v.talepler.length} başlıkta bilgi ve erişim rica ediyoruz.`)}</p>
    </div>

    <div class="tk-kapak__liste">
      <div class="tk-kapak__bas"><span>#</span><span>Talep</span><span>Nereye</span><span>Tamam</span></div>
      ${v.talepler
        .map(
          (t) => `<div><span>${t.no}</span><b>${e(t.kisaBaslik || t.baslik)}</b><em>${e(t.ozet?.nereye || "")}</em>${kutu()}</div>`
        )
        .join("")}
    </div>

    <div class="tk-kapak__musteri">
      <div class="kapak__musteri-kart">
        <div class="kapak__musteri-harf">${e(harf)}</div>
        <div>
          <div class="mono-etiket">Hazırlanan</div>
          <div class="kapak__firma" lang="${e(v.musteri.dil || "tr")}">${e(v.musteri.firma)}</div>
          ${v.musteri.tamUnvan ? `<div class="kapak__yetkili">${e(v.musteri.tamUnvan)}</div>` : ""}
        </div>
      </div>
    </div>

    ${P.alt(v)}
  </section>`;
}

// ───────── talep blokları ─────────

function govdeKilavuz(t) {
  return `
    <div class="tk-iki">
      <ol class="tk-adimlar">${t.adimlar.map((a, i) => `<li><span>${i + 1}</span><p>${zengin(a)}</p></li>`).join("")}</ol>
      <div class="tk-yan">
        ${
          t.yanKutu
            ? `<div class="mono-etiket">${e(t.yanKutu.baslik)}</div>
               <ul class="tk-kontrol tk-kontrol--tek">${t.yanKutu.maddeler.map((m) => `<li>${kutu()}${zengin(m)}</li>`).join("")}</ul>`
            : ""
        }
      </div>
    </div>`;
}

function govdeListe(t) {
  return `
    <div class="tk-yontem">${(t.yontemler || [])
      .map((y) => `<div><b>${e(y.ad)}</b><p>${zengin(y.metin)}</p></div>`)
      .join("")}</div>
    ${
      t.maddeler
        ? `<div class="mono-etiket tk-ara">${e(t.maddelerBaslik || "Göndermeniz gerekenler")}</div>
           <ul class="tk-kontrol">${t.maddeler.map((m) => `<li>${kutu()}${zengin(m)}</li>`).join("")}</ul>`
        : ""
    }`;
}

function govdeSorular(t) {
  return `
    ${t.aciklama ? `<p class="tk-aciklama">${zengin(t.aciklama)}</p>` : ""}
    <div class="tk-sorular">${t.sorular
      .map(
        (s, i) => `
      <div class="tk-soru">
        <div class="tk-soru__bas"><span>${iki(i + 1)}</span><b>${zengin(s.soru)}</b></div>
        ${s.ipucu ? `<p>${zengin(s.ipucu)}</p>` : ""}
        <i></i><i></i>
      </div>`
      )
      .join("")}</div>`;
}

function govdeForm(t) {
  return `<div class="tk-alanlar">${t.alanlar.map((a) => `<div><span class="mono-etiket">${e(a)}</span><i></i></div>`).join("")}</div>`;
}

function govdeSecim(t) {
  return `<div class="tk-secenekler">${t.secenekler
    .map(
      (s) => `
    <div class="tk-secenek">
      <div class="tk-secenek__bas">${kutu()}<b>${e(s.baslik)}</b></div>
      ${(s.alanlar || []).map((a) => `<div class="tk-alan"><span class="mono-etiket">${e(a)}</span><i></i></div>`).join("")}
      ${(s.isaretler || [])
        .map(
          (x) => `<div class="tk-isaret"><span class="mono-etiket">${e(x.soru)}</span><div>${x.secimler
            .map((c) => `<label>${kutu()}${e(c)}</label>`)
            .join("")}</div></div>`
        )
        .join("")}
      ${s.metin ? `<p>${zengin(s.metin)}</p>` : ""}
    </div>`
    )
    .join("")}</div>`;
}

const GOVDE = { kilavuz: govdeKilavuz, liste: govdeListe, sorular: govdeSorular, form: govdeForm, secim: govdeSecim };

function talepBlok(t) {
  const govde = GOVDE[t.tur];
  if (!govde) throw new Error(`Bilinmeyen talep türü: "${t.tur}"`);
  return `
  <article class="tk tk--${e(t.tur)}">
    <header class="tk__bas">
      <span class="tk__no">${t.no}</span>
      <div class="tk__metin">
        <span class="hizmet__etiket">${e(t.etiket || "")}</span>
        <h3>${e(t.baslik)}</h3>
        <p>${zengin(t.neden || "")}</p>
      </div>
      ${
        t.nereye
          ? `<div class="tk__nereye"><span class="tk__nereye-ikon">${IK[TUR_IKON[t.tur]] || IK.bilgi}</span><div><span>${e(t.nereye.etiket)}</span><b>${e(t.nereye.deger)}</b></div></div>`
          : ""
      }
    </header>
    ${govde(t)}
    ${(t.notlar || []).length ? `<div class="tk-notlar">${t.notlar.map((n) => `<p>${IK.bilgi}<span>${zengin(n)}</span></p>`).join("")}</div>` : ""}
  </article>`;
}

function sonraBlok(v) {
  if (!v.sonrakiAdimlar?.length) return "";
  return `
  <div class="tk-sonra">
    <div class="tk-sonra__bas"><b>${e(v.sonrakiBaslik || "Teslim ettiğinizde ne olur?")}</b><span class="mono-etiket">Sonraki adımlar</span></div>
    <div class="tk-sonra__izgara">${v.sonrakiAdimlar
      .map((x, i) => `<div><i>${iki(i + 1)} · ${e(x.sure || "")}</i><strong>${e(x.baslik)}</strong><p>${e(x.metin)}</p></div>`)
      .join("")}</div>
  </div>`;
}

function talepSayfasi(v, P) {
  return `
  <section class="sayfa" data-bol>
    ${izgara(false)}
    ${P.ust(v, "Talepler")}
    <div class="govde">
      <div class="bolum-bas">
        <div>
          <div class="kicker">Başlangıç talepleri</div>
          <h2 class="h2">${vurgula(v.talepBaslik || `${v.talepler.length} adımda [hazırız].`)}</h2>
        </div>
        <div>
          ${v.hitap ? `<p class="hitap">${e(v.hitap)}</p>` : ""}
          ${v.giris ? `<p class="lede">${e(v.giris)}</p>` : ""}
        </div>
      </div>
      <div class="devam-bas kicker">Başlangıç talepleri (devam)</div>
      <div class="bol-liste tk-liste">${v.talepler.map(talepBlok).join("")}${sonraBlok(v)}</div>
    </div>
    ${P.alt(v)}
  </section>`;
}

async function main() {
  const arg = process.argv.slice(2);
  const girdi = arg.find((a) => !a.startsWith("--"));
  if (!girdi) {
    console.error("Kullanım: node teklif/talep.mjs teklif/talepler/<dosya>.json [--png]");
    process.exit(1);
  }
  const v = veriHazirla(resolve(girdi));
  const P = parcalar();
  const sayfalar = [kapak(v, P), talepSayfasi(v, P), iletisimSayfasi(v, P, iki(v.talepler.length + 1))].join("\n");
  const cikti = join(KOK, "cikti");
  mkdirSync(cikti, { recursive: true });
  const ad = `AhmetEkinci-Baslangic-${slug(v.musteri.firma)}${v.belgeNo ? "-" + v.belgeNo : ""}`;
  const htmlYol = join(cikti, ad + ".html");
  writeFileSync(htmlYol, belge(`Başlangıç talep listesi · ${v.musteri.firma}`, sayfalar, oku(join(KOK, "talep.css"))));
  await bas(htmlYol, join(cikti, ad + ".pdf"), arg.includes("--png"));
  console.log("HTML:", htmlYol);
}

main().catch((h) => {
  console.error(h.message || h);
  process.exit(1);
});
