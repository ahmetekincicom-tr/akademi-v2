import { describe, expect, it } from "vitest";
import { config } from "./proxy";

// Next matcher'ı yolun tamamıyla eşleştiriyor.
const desen = new RegExp(`^${config.matcher[0]}$`);
const calisir = (yol: string) => desen.test(yol);

describe("ara katman matcher", () => {
  it("sayfalarda ve panelde çalışıyor", () => {
    for (const yol of ["/", "/egitimler/", "/panel/", "/kontrol-9f4x2k/", "/api/odeme/bildirim/", "/dosya/belgeler/a.pdf"]) {
      expect(calisir(yol), yol).toBe(true);
    }
  });

  it("zamanlanmış görevlerde, makine dosyalarında ve görsellerde çalışmıyor", () => {
    for (const yol of [
      "/api/gorevler/meta-kuyruk/",
      "/api/gorevler/egitim-hatirlatma/",
      "/robots.txt",
      "/sitemap.xml",
      "/llms.txt",
      "/llms-full.txt",
      "/manifest.webmanifest",
      "/sw.js",
      "/dosya/kapaklar/kapak.jpg",
      "/_next/static/chunks/a.js",
    ]) {
      expect(calisir(yol), yol).toBe(false);
    }
  });
});
