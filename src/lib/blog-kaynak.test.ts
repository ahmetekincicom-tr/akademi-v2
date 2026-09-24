import { describe, it, expect } from "vitest";
import { kaynakBaglanti } from "@/lib/blog-kaynak";

describe("kaynakBaglanti", () => {
  it("geçerli https URL → href + www'suz alan adı", () => {
    expect(kaynakBaglanti("https://www.developers.facebook.com/docs/marketing-api/conversions-api")).toEqual({
      href: "https://www.developers.facebook.com/docs/marketing-api/conversions-api",
      alan: "developers.facebook.com",
    });
  });

  it("şemasız girdiye https varsayar", () => {
    expect(kaynakBaglanti("support.google.com/analytics")?.href).toBe("https://support.google.com/analytics");
  });

  it("tehlikeli/geçersiz şemaları reddeder", () => {
    expect(kaynakBaglanti("javascript:alert(1)")).toBeNull();
    expect(kaynakBaglanti("data:text/html,x")).toBeNull();
    expect(kaynakBaglanti("")).toBeNull();
    expect(kaynakBaglanti(null)).toBeNull();
  });
});
