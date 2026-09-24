# Google ile giriş / kayıt

Supabase Auth'un Google sağlayıcısı (OAuth, PKCE). Uygulama tarafı hazır;
`src/lib/bolumler.ts → GOOGLE_GIRIS_ACIK` kurulum bitene kadar `false`.

## Akış

1. `/giris` ya da `/kayit` → **Google ile devam et**
   (`src/components/auth/GoogleIleDevam.tsx` → `signInWithOAuth`).
2. Google → Supabase → `https://ahmetekinciakademi.com/auth/callback?next=…`
   (mevcut route: `exchangeCodeForSession`, giriş kaydı, hoş geldin maili).
3. Aynı e-postayla hesap varsa Supabase Google kimliğini o hesaba bağlar;
   kişi kendi hesabına girer.
4. Yeni hesapta sözleşme/KVKK onayı yok → panel bir kez `/kayit/tamamla`'ya
   yönlendirir: ad, soyad, telefon, zorunlu onay, isteğe bağlı ileti izni.
   Onay tarihi servis anahtarıyla, onay kaydı `rizaKaydet` ile (IP, tarayıcı,
   metin parmak izi) — e-posta kaydıyla aynı ispat düzeyi.

iOS uygulamasında (WKWebView) düğme görünmüyor: Google gömülü tarayıcıda
oturum açmayı engelliyor (`disallowed_useragent`).

## Kurulum

### Google Cloud Console
1. https://console.cloud.google.com → proje seç/oluştur.
2. **APIs & Services → OAuth consent screen**
   - User type: **External**
   - App name: `Ahmet Ekinci Akademi`, destek e-postası, logo (isteğe bağlı)
   - App domain: `https://ahmetekinciakademi.com`,
     Privacy policy: `https://ahmetekinciakademi.com/gizlilik-politikasi`,
     Terms: `https://ahmetekinciakademi.com/uyelik-sozlesmesi`
   - Authorized domains: `ahmetekinciakademi.com`, `supabase.co`
   - Scopes: yalnız `openid`, `email`, `profile` (hassas kapsam yok → Google
     incelemesi gerekmez)
   - **Publish app** (Testing'de kalırsa yalnız test kullanıcıları girebilir).
3. **Credentials → Create credentials → OAuth client ID**
   - Application type: **Web application**
   - Authorized JavaScript origins:
     `https://ahmetekinciakademi.com`, `https://panel.ahmetekinciakademi.com`
   - Authorized redirect URIs:
     `https://tlxqkzfohcxiwezidsih.supabase.co/auth/v1/callback`
   - Client ID ve Client secret'ı kopyala (repoya/sohbete yazma).

### Supabase
1. **Authentication → Sign In / Providers → Google** → Enable,
   Client ID + Client Secret yapıştır, kaydet.
2. **URL Configuration → Redirect URLs**: `https://ahmetekinciakademi.com/**`
   ve `https://panel.ahmetekinciakademi.com/**` zaten ekli olmalı.

### Açma
`GOOGLE_GIRIS_ACIK = true` → deploy.

## Test
1. Yeni bir Gmail ile Google'dan kayıt → `/kayit/tamamla` → onayla → panel.
   Yönetim → öğrenci detayı → "Verilen onaylar"da iki kayıt görünmeli.
2. E-postayla kayıtlı bir hesabın Gmail'iyle Google'dan giriş → doğrudan
   panel (tamamlama ekranı çıkmamalı; onay zaten var).
3. Google hesap seçicide iptal → `/giris?hata=1` bilgi mesajı.

Not: Google'ın onay ekranında kısa süre "tlxqkzfohcxiwezidsih.supabase.co"
görünür. Kaldırmak için Supabase'in özel alan adı (Custom Domain) eklentisi
gerekir; zorunlu değil.
