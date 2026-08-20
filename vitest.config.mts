import { defineConfig } from "vitest/config";

/**
 * .mts uzantısı bilerek: Vite yapılandırmayı yerel yükleyiciyle okuyor ve
 * .ts dosyasını CommonJS sanıp ESM sözdizimine uyarı veriyordu.
 *
 * tsconfig yolları (@/…) eklentiyle değil, Vite'ın kendi desteğiyle
 * çözülüyor — eklenti aynı işi yapıyordu ve bir bağımlılık daha demekti.
 */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    // Buradaki testlerin hepsi saf mantık ve kaynak kod taraması; tarayıcı
    // ortamı (jsdom) olmayan bileşen testleri için bağımlılık taşımak olurdu.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
