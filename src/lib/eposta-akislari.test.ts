import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AKISLAR, AKIS_ADI } from "@/lib/eposta-akislari";

/**
 * E-posta akış kataloğunun bütünlüğü.
 *
 * Katalog kodda, anahtarlar veritabanında. İkisi ayrıştığında hata sessiz
 * oluyor: katalogda olmayan bir anahtarla gönderilen mail hiçbir zaman
 * kapatılamaz, katalogda olup kodda kullanılmayan bir akış ise yönetim
 * ekranında çalışmayan bir düğme olarak durur.
 */

describe("akış kataloğu", () => {
  it("anahtarlar benzersiz", () => {
    const anahtarlar = AKISLAR.map((a) => a.anahtar);
    expect(new Set(anahtarlar).size).toBe(anahtarlar.length);
  });

  it("her akışın başlığı ve açıklaması var", () => {
    for (const a of AKISLAR) {
      expect(a.baslik.length, a.anahtar).toBeGreaterThan(3);
      expect(a.aciklama.length, a.anahtar).toBeGreaterThan(10);
    }
  });

  it("işleyişi bozacak akışlar kapatılamaz işaretli", () => {
    /*
      Bu dördü kapalıyken sistem sessizce yanlış çalışır: havale yapanın
      ödemesi işaretlenmeden bekler, silme talebinde yasal süre haber
      verilmeden işler. Listeden biri düşerse test kırılsın.
    */
    const zorunluOlmali = [
      "havale-bildirimi",
      "odeme-sonucu",
      "hesap-silme",
      "tani-testi",
      "sistem-hatasi",
    ];
    for (const anahtar of zorunluOlmali) {
      const akis = AKISLAR.find((a) => a.anahtar === anahtar);
      expect(akis, anahtar).toBeDefined();
      expect("zorunlu" in akis! && akis!.zorunlu, anahtar).toBe(true);
    }
  });

  it("AKIS_ADI kataloğun tamamını kapsıyor", () => {
    for (const a of AKISLAR) expect(AKIS_ADI[a.anahtar]).toBe(a.baslik);
  });
});

/* --------------------------------------------------- kod ile eşleşme --- */

function tsDosyalari(yol: string): string[] {
  const tam = join(process.cwd(), yol);
  const cikti: string[] = [];
  for (const ad of readdirSync(tam)) {
    const alt = join(yol, ad);
    if (statSync(join(process.cwd(), alt)).isDirectory()) cikti.push(...tsDosyalari(alt));
    else if (/\.tsx?$/.test(ad) && !ad.endsWith(".test.ts")) cikti.push(join(process.cwd(), alt));
  }
  return cikti;
}

describe("katalog kodla uyumlu", () => {
  const kaynak = tsDosyalari("src")
    .filter((d) => !d.endsWith("eposta-akislari.ts"))
    .map((d) => readFileSync(d, "utf8"))
    .join("\n");

  it("her akış en az bir yerden gönderiliyor", () => {
    // Katalogda durup hiç kullanılmayan akış, yönetim ekranında hiçbir işe
    // yaramayan bir anahtar demek.
    const kullanilmayan = AKISLAR.filter((a) => !kaynak.includes(`"${a.anahtar}"`)).map(
      (a) => a.anahtar,
    );
    expect(kullanilmayan).toEqual([]);
  });

  it("kodda katalogda olmayan akış adı yok", () => {
    /*
      epostaGonder'in "akis" alanı tipli, yani derleyici zaten yakalıyor.
      Bu test tipin gevşetildiği (string'e düşürüldüğü) günü yakalamak için:
      o gün kapatma anahtarı sessizce çalışmaz olurdu.
    */
    const gecerli = new Set<string>(AKISLAR.map((a) => a.anahtar));
    const kullanilan = [...kaynak.matchAll(/akis:\s*"([a-z-]+)"/g)].map((m) => m[1]);

    expect(kullanilan.length).toBeGreaterThan(5);
    expect(kullanilan.filter((a) => !gecerli.has(a))).toEqual([]);
  });
});
