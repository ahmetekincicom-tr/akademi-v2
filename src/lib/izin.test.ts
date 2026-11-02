import { afterEach, describe, expect, it, vi } from "vitest";
import { UYGULAMA_ISARETI, uygulamaIcinde } from "./izin";

describe("uygulamaIcinde (iOS uygulamasında takip yok)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("tarayıcı kimliğinde uygulama işareti varsa true", () => {
    vi.stubGlobal("navigator", { userAgent: `Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Mobile/15E148 ${UYGULAMA_ISARETI}` });
    expect(uygulamaIcinde()).toBe(true);
  });

  it("normal tarayıcıda ve sunucuda false", () => {
    vi.stubGlobal("navigator", { userAgent: "Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1" });
    expect(uygulamaIcinde()).toBe(false);
    vi.stubGlobal("navigator", undefined);
    expect(uygulamaIcinde()).toBe(false);
  });

  it("işaret capacitor.config.ts'teki appendUserAgent ile aynı", async () => {
    const { readFileSync } = await import("node:fs");
    expect(readFileSync("capacitor.config.ts", "utf8")).toContain(`appendUserAgent: "${UYGULAMA_ISARETI}"`);
  });
});
