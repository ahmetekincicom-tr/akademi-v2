import { describe, expect, it } from "vitest";
import { guvenliUrl, guvenliYol } from "@/lib/guvenli-url";

/**
 * Bu iki fonksiyon panelin dış dünyaya açılan iki kapısını süzüyor:
 * yöneticinin yapıştırdığı bağlantılar (Drive klasörü, toplantı adresi) ve
 * giriş sonrası yönlendirme adresi. İkisi de kırıldığında sessizce kırılır —
 * kötü bir değer hata vermez, sadece çalışır.
 */

describe("guvenliUrl", () => {
  it("http ve https geçiyor", () => {
    expect(guvenliUrl("https://drive.google.com/x")).toBe("https://drive.google.com/x");
    expect(guvenliUrl("http://ornek.com/")).toBe("http://ornek.com/");
  });

  it("şema yazılmamışsa https varsayıyor", () => {
    expect(guvenliUrl("ornek.com")).toBe("https://ornek.com/");
  });

  it("çalıştırılabilir şemaları reddediyor", () => {
    /*
      Asıl mesele bu: bu alanlara yöneticinin yapıştırdığı değer bir iframe
      src'sine ya da href'e giriyor. javascript: ya da data:text/html değeri,
      sayfayı açan herkesin tarayıcısında çalışırdı.
    */
    for (const kotu of [
      "javascript:alert(1)",
      "JavaScript:alert(1)",
      "  javascript:alert(1)  ",
      "data:text/html;base64,PHNjcmlwdD4=",
      "vbscript:msgbox(1)",
      "file:///etc/passwd",
    ]) {
      expect(guvenliUrl(kotu), kotu).toBeNull();
    }
  });

  it("boş ve bozuk değerlerde null dönüyor", () => {
    for (const bos of [null, undefined, "", "   ", "http://"]) {
      expect(guvenliUrl(bos)).toBeNull();
    }
  });
});

describe("guvenliYol", () => {
  it("site içi yolu geçiriyor", () => {
    expect(guvenliYol("/panel/dersler", "/panel")).toBe("/panel/dersler");
  });

  it("site dışına çıkan yönlendirmeyi reddediyor", () => {
    // "//kotu.site" bazı tarayıcılarda protokol-göreli adres olarak okunuyor;
    // giriş sonrası yönlendirme buradan kaçırılabilirdi.
    for (const kotu of ["//kotu.site", "https://kotu.site", "/\\kotu.site", "\\\\kotu.site", "panel"]) {
      expect(guvenliYol(kotu, "/panel"), kotu).toBe("/panel");
    }
  });

  it("boş değerde varsayılana düşüyor", () => {
    expect(guvenliYol(null, "/panel")).toBe("/panel");
    expect(guvenliYol("", "/panel")).toBe("/panel");
  });
});
