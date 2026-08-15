/**
 * Supabase Auth e-posta şablonlarını üretir.
 *
 * Şifre sıfırlama, hesap doğrulama ve davet maillerini Supabase kendisi
 * gönderiyor; içeriğini bizim kodumuz üretmiyor. Bu yüzden HTML'i burada
 * üretip Supabase panelindeki şablon editörüne yapıştırıyoruz.
 *
 * Aynı bildirimSablonu() kullanılıyor — böylece auth mailleri ile panel
 * bildirimleri arasında tasarım ayrışması olmuyor. Şablon değişince bu script
 * yeniden çalıştırılıp çıktılar Supabase'e tekrar yapıştırılmalı.
 *
 * Çalıştırma:  node scripts/auth-eposta-sablonlari.mjs
 * Çıktı:       docs/eposta-sablonlari/*.html
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const GECICI = ".sablon-derleme";

// eposta-sablon.ts hiçbir şey içe aktarmıyor, bu yüzden tek başına derlenebiliyor.
execFileSync(
  "npx",
  [
    "tsc",
    "src/lib/eposta-sablon.ts",
    "--outDir",
    GECICI,
    "--module",
    "esnext",
    "--target",
    "es2022",
    // Dosya kendi başına derleniyor; projenin @types ağacını çözmeye çalışmasın.
    "--moduleResolution",
    "bundler",
    "--skipLibCheck",
  ],
  { stdio: "inherit" },
);

const { bildirimSablonu } = await import(`../${GECICI}/eposta-sablon.js`);

/*
  Supabase değişkenleri şablona olduğu gibi geçiyor.

  bildirimSablonu içindeki kaçırma yalnızca & < > " karakterlerini değiştiriyor;
  {{ .ConfirmationURL }} bunların hiçbirini içermediği için bozulmadan çıkıyor.
*/
const BAGLANTI = "{{ .ConfirmationURL }}";

const sablonlar = {
  "hesap-dogrulama": {
    baslik: "Confirm signup",
    icerik: {
      ustEtiket: "Hesap doğrulama",
      baslik: "E-posta adresini doğrula",
      ozet:
        "Ahmet Ekinci Akademi üye alanı için hesap oluşturdun. Aşağıdaki düğmeye basınca hesabın " +
        "açılıyor ve panele girebiliyorsun.",
      eylem: { etiket: "Hesabımı doğrula", adres: BAGLANTI },
      alinti: "Bu hesabı sen oluşturmadıysan bu maili yok sayabilirsin; hiçbir işlem yapılmaz.",
    },
  },
  "sifre-sifirlama": {
    baslik: "Reset password",
    icerik: {
      ustEtiket: "Şifre sıfırlama",
      baslik: "Yeni şifreni belirle",
      ozet:
        "Şifreni sıfırlama isteği aldık. Aşağıdaki düğmeye basıp yeni şifreni belirleyebilirsin. " +
        "Bağlantı kısa süre sonra geçersiz oluyor.",
      eylem: { etiket: "Yeni şifre belirle", adres: BAGLANTI },
      alinti:
        "Bu isteği sen yapmadıysan bu maili yok say — şifren değişmez. " +
        "Hesabına başkasının erişmeye çalıştığını düşünüyorsan bize yaz.",
    },
  },
  davet: {
    baslik: "Invite user",
    icerik: {
      ustEtiket: "Davet",
      baslik: "Üye alanın hazır",
      ozet:
        "Ahmet Ekinci Akademi üye alanında senin için bir hesap açıldı. Eğitim içeriklerin, " +
        "ders kayıtların ve dokümanların burada toplanıyor. Başlamak için şifreni belirle.",
      eylem: { etiket: "Şifremi belirle", adres: BAGLANTI },
    },
  },
  "eposta-degisikligi": {
    baslik: "Change email address",
    icerik: {
      ustEtiket: "E-posta değişikliği",
      baslik: "Yeni adresini doğrula",
      ozet:
        "Hesabının e-posta adresini değiştirme isteği aldık. Değişikliğin tamamlanması için " +
        "yeni adresini doğrulaman gerekiyor.",
      eylem: { etiket: "Yeni adresimi doğrula", adres: BAGLANTI },
      alinti: "Bu isteği sen yapmadıysan bu maili yok say; adresin değişmez.",
    },
  },
};

const klasor = join("docs", "eposta-sablonlari");
mkdirSync(klasor, { recursive: true });

for (const [dosya, { baslik, icerik }] of Object.entries(sablonlar)) {
  const { html } = bildirimSablonu(icerik);
  writeFileSync(join(klasor, `${dosya}.html`), html);
  console.log(`${dosya}.html  →  Supabase şablonu: "${baslik}"`);
}

rmSync(GECICI, { recursive: true, force: true });
