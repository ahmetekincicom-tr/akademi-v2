import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Panel sorgularının kapsam bekçisi.
 *
 * Bu testin varlık sebebi somut bir hata: yönetici kendi öğrenci panelinde
 * bütün katılımcıların ders kaydı klasörlerini, ödemelerini, destek
 * taleplerini ve giriş geçmişini görüyordu. Sebep, sorguların "RLS zaten
 * sınırlıyor" varsayımıyla yazılmasıydı — o cümle katılımcı için doğru,
 * YÖNETİCİ İÇİN DEĞİL: politikalar "kendi satırın VEYA yöneticiysen hepsi"
 * diyor ve yönetici aynı zamanda bir katılımcı.
 *
 * Hata gözle bulundu. Aynı sınıftaki bir sonrakini gözle aramamak için
 * kural burada yazılı: panel tarafında kişiye bağlı bir tabloya yapılan her
 * sorgu, kimin satırlarını istediğini AÇIKÇA söylemeli.
 *
 * Test kaynak kodu tarıyor, veritabanına bağlanmıyor: CI'da sırsız çalışsın
 * ve hatayı kod yazılırken yakalasın diye.
 */

/** RLS'i "kendi satırın veya yöneticiysen hepsi" olan tablolar. */
const KISIYE_BAGLI_TABLOLAR = [
  "egitim_kayit_arsivi",
  "egitim_oturumlari",
  "enrollments",
  "gorusmeler",
  "lesson_progress",
  "odeme_denemeleri",
  "oturum_kayitlari",
  "panel_gorulme",
  "payments",
  "profiles",
  "push_cihazlar",
  "riza_kayitlari",
  "seanslar",
  "support_messages",
  "support_tickets",
];

/**
 * Taranan yerler: panelin kendi sayfaları ve yalnızca panel için okuyan
 * kütüphaneler.
 *
 * Yönetim ekranları bilerek dışarıda — onların bütün satırları görmesi
 * gerekiyor. destek.ts ve gorusme.ts gibi İKİ TARAFIN da kullandığı
 * kütüphaneler de dışarıda: onlarda kapsam parametreyle geliyor ve çağrı
 * yerinde veriliyor, o çağrı yerleri zaten bu listede.
 */
const TARANAN = [
  "src/app/panel",
  "src/lib/panel.ts",
  "src/lib/odeme.ts",
  "src/lib/egitim-oturumu.ts",
  "src/lib/bildirimler.ts",
  "src/lib/baslangic.ts",
];

/**
 * Sorgunun kapsamının belirlendiğini gösteren işaretler.
 *
 * `eq("user_id"` doğrudan süzgeç. `eq("id", user` profil gibi birincil
 * anahtarı kullanıcı olan tablolar için. `support_tickets.user_id` gömülü
 * ilişki üzerinden süzme (PostgREST !inner). `insert`/`upsert` yazma; kapsamı
 * gövdedeki user_id belirliyor ve RLS with_check ile doğruluyor.
 */
const KAPSAM_ISARETLERI = [
  'eq("user_id"',
  "eq('user_id'",
  'eq("id", user',
  'eq("id", profil',
  'eq("id", kullanici',
  "support_tickets.user_id",
  ".insert(",
  ".upsert(",
  ".delete(",
];

/** Bilinçli istisna: sorgunun üstüne bu yorum konursa test atlıyor. */
const MUAF = "kapsam-muaf:";

function dosyalar(yol: string): string[] {
  const tam = join(process.cwd(), yol);
  if (!statSync(tam).isDirectory()) return [tam];

  const cikti: string[] = [];
  for (const ad of readdirSync(tam)) {
    const alt = join(yol, ad);
    if (statSync(join(process.cwd(), alt)).isDirectory()) cikti.push(...dosyalar(alt));
    else if (/\.tsx?$/.test(ad) && !ad.endsWith(".test.ts")) cikti.push(join(process.cwd(), alt));
  }
  return cikti;
}

type Bulgu = { dosya: string; tablo: string; parca: string };

/**
 * `.from("tablo")` çağrısından deyimin sonuna kadar olan zinciri çıkarır.
 *
 * Deyim sonu için noktalı virgül aranmıyor: zincir çok satırlı ve araya
 * `{ count: "exact" }` gibi süslü parantezler giriyor. Sabit bir pencere
 * (1000 karakter) bu kod tabanındaki en uzun zinciri rahatça kapsıyor ve
 * ayrıştırıcı yazmaktan çok daha az kırılgan.
 */
function zincirler(icerik: string, tablo: string): string[] {
  const cikti: string[] = [];
  const desen = new RegExp(`\\.from\\(["']${tablo}["']\\)`, "g");
  let eslesme: RegExpExecArray | null;

  while ((eslesme = desen.exec(icerik)) !== null) {
    // Öncesi de alınıyor: muafiyet yorumu ve "await servis.from(" gibi
    // ipuçları çağrının üstünde duruyor.
    const basla = Math.max(0, eslesme.index - 400);
    cikti.push(icerik.slice(basla, eslesme.index + 1000));
  }
  return cikti;
}

describe("panel sorguları kişiye bağlı", () => {
  const bulgular: Bulgu[] = [];

  for (const yol of TARANAN) {
    for (const dosya of dosyalar(yol)) {
      const icerik = readFileSync(dosya, "utf8");

      for (const tablo of KISIYE_BAGLI_TABLOLAR) {
        for (const parca of zincirler(icerik, tablo)) {
          if (parca.includes(MUAF)) continue;
          if (KAPSAM_ISARETLERI.some((isaret) => parca.includes(isaret))) continue;

          bulgular.push({
            dosya: dosya.replace(process.cwd() + "/", ""),
            tablo,
            parca: parca.slice(400, 560).trim(),
          });
        }
      }
    }
  }

  it("her sorgu kimin satırlarını istediğini söylüyor", () => {
    const rapor = bulgular
      .map(
        (b) =>
          `\n  ${b.dosya}\n    tablo: ${b.tablo}\n    ${b.parca.replace(/\s+/g, " ").slice(0, 140)}…`,
      )
      .join("\n");

    expect(
      bulgular,
      bulgular.length === 0
        ? ""
        : `Kişiye bağlı tabloya kapsamsız sorgu bulundu. RLS bu satırları ` +
            `yöneticiye AÇIYOR ve yönetici de bu paneli kullanıyor; süzgeç ` +
            `olmadan kendi panelinde herkesin verisini görür.\n` +
            `Süzgeç ekle ya da bilinçliyse sorgunun üstüne "// ${MUAF} gerekçe" yaz.\n${rapor}\n`,
    ).toEqual([]);
  });

  it("tarama gerçekten bir şey buluyor", () => {
    /*
      Bekçinin sessizce körelmesine karşı: dosya deseni ya da klasör yapısı
      değişip tarama boşa düşerse, yukarıdaki test de her zaman geçer ve
      kimse fark etmez. Bu test taramanın hâlâ kod gördüğünü doğruluyor.
    */
    const toplam = TARANAN.flatMap(dosyalar).reduce((n, d) => {
      const icerik = readFileSync(d, "utf8");
      return n + KISIYE_BAGLI_TABLOLAR.filter((t) => zincirler(icerik, t).length > 0).length;
    }, 0);

    expect(toplam).toBeGreaterThan(5);
  });
});
