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
  Bağlantı {{ .ConfirmationURL }} DEĞİL.

  Varsayılan değişken kullanıcıyı önce supabase.co'ya götürüp oradan siteye
  döndürüyor; adres çubuğunda bir an başka bir alan adı görünüyor ve şifre
  sıfırlarken bu güven kırıyor. Bunun yerine token_hash'i kendi adresimize
  taşıyoruz, doğrulamayı /auth/onayla yapıyor.

  {{ .SiteURL }} Supabase panelindeki URL Configuration → Site URL değeri;
  panelin adresine ayarlı olmalı.
*/
const onayAdresi = (tur, next) =>
  `{{ .SiteURL }}/auth/onayla?token_hash={{ .TokenHash }}&type=${tur}&next=${next}`;

const sablonlar = {
  "hesap-dogrulama": {
    baslik: "Confirm signup",
    icerik: {
      ustEtiket: "Hesap doğrulama",
      baslik: "E-posta adresini doğrula",
      ozet:
        "Ahmet Ekinci Akademi üye alanı için hesap oluşturdun. Aşağıdaki düğmeye basınca hesabın " +
        "açılıyor ve panele girebiliyorsun.",
      eylem: { etiket: "Hesabımı doğrula", adres: onayAdresi("signup", "/panel") },
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
      eylem: { etiket: "Yeni şifre belirle", adres: onayAdresi("recovery", "/sifre-belirle") },
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
      eylem: { etiket: "Şifremi belirle", adres: onayAdresi("invite", "/sifre-belirle") },
    },
  },
  "sihirli-baglanti": {
    baslik: "Magic Link / OTP",
    icerik: {
      ustEtiket: "Giriş bağlantısı",
      baslik: "Tek kullanımlık giriş",
      ozet:
        "Şifre girmeden giriş yapmak için aşağıdaki düğmeyi kullan. Bağlantı bir kez çalışıyor " +
        "ve kısa süre sonra geçersiz oluyor.",
      eylem: { etiket: "Giriş yap", adres: onayAdresi("magiclink", "/panel") },
      // Bağlantı bazı posta istemcilerinde tıklanamıyor (kurumsal filtreler
      // düğmeleri sıyırıyor); kod ikinci yol olarak duruyor.
      kod: "{{ .Token }}",
      alinti: "Düğme çalışmazsa giriş ekranındaki kod alanına yukarıdaki kodu yazabilirsin.",
    },
  },
  "yeniden-dogrulama": {
    baslik: "Reauthentication",
    icerik: {
      ustEtiket: "Kimlik doğrulama",
      baslik: "İşlemi onayla",
      ozet: "Hassas bir işlem için kimliğini doğrulaman gerekiyor. Aşağıdaki kodu ekrana gir.",
      kod: "{{ .Token }}",
      alinti: "Böyle bir işlem başlatmadıysan bu maili yok say ve şifreni değiştir.",
    },
  },
  "sifre-degisti": {
    baslik: "Password changed (Güvenlik)",
    icerik: {
      ustEtiket: "Güvenlik",
      baslik: "Şifren değiştirildi",
      ozet: "Hesabının şifresi az önce değiştirildi. Bu işlemi sen yaptıysan yapman gereken bir şey yok.",
      alinti:
        "Bu değişikliği sen yapmadıysan hemen bize yaz: iletisim@ahmetekinci.com.tr. " +
        "Hesabına erişimi durdurup şifreni birlikte sıfırlarız.",
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
      eylem: { etiket: "Yeni adresimi doğrula", adres: onayAdresi("email_change", "/panel/hesabim") },
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
